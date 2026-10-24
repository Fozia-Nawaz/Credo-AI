import sampleEvents from "../mock/sampleStreamEvents.json";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

// The backend sends a heartbeat every 15 seconds, so 45 seconds of
// silence means something is wrong.
const IDLE_TIMEOUT_MS = 45000;

function friendlyMessage(err) {
  if (err instanceof TypeError) {
    return "Cannot reach the server. Check that the backend is running and that its FRONTEND_ORIGIN setting allows this page.";
  }
  return err.message || "Something went wrong.";
}

// Turns a failed HTTP response into a readable sentence.
async function readError(response) {
  try {
    const body = await response.json();
    if (Array.isArray(body.detail)) {
      const fields = body.detail
        .map((d) => `${(d.loc || []).slice(1).join(".")}: ${d.msg}`)
        .join("; ");
      return `The server did not accept the profile (${fields}).`;
    }
    if (typeof body.detail === "string") return body.detail;
  } catch {
    // The response was not JSON.
  }
  return `The server returned an error (${response.status}). Please try again.`;
}

// Starts a verification run and streams its events back one by one.
// Returns a function that stops everything.
export function runVerification(profile, onEvent, onError) {
  if (USE_MOCK) {
    const timers = sampleEvents.map((event, i) =>
      setTimeout(() => onEvent(event), 700 * (i + 1))
    );
    return () => timers.forEach(clearTimeout);
  }

  const controller = new AbortController();
  let stopped = false; // stopped on purpose (user or page)
  let timedOut = false; // the server went silent
  let finished = false; // we received the COMPLETE event
  let idleTimer;

  const resetIdleTimer = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, IDLE_TIMEOUT_MS);
  };

  (async () => {
    try {
      resetIdleTimer();

      // Step 1: start a run and get its stream address.
      const start = await fetch(`${BASE_URL}/api/v1/verify/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
        signal: controller.signal,
      });
      if (!start.ok) throw new Error(await readError(start));
      const { stream_url: streamUrl } = await start.json();
      if (!streamUrl) throw new Error("The server did not return a stream address.");
      resetIdleTimer();

      // Step 2: listen to the live events.
      const response = await fetch(`${BASE_URL}${streamUrl}`, {
        headers: { Accept: "text/event-stream" },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(await readError(response));
      if (!response.body) throw new Error("The server did not open a live stream.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        resetIdleTimer();

        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, "\n");

        // Each event is a block separated by a blank line.
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const part of parts) {
          const line = part.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue; // heartbeat comments have no data line

          let event;
          try {
            event = JSON.parse(line.slice(5).trim());
          } catch {
            console.warn("Skipped a bad event from the server:", line);
            continue;
          }

          onEvent(event);
          if (event.stage === "COMPLETE") finished = true;

          if (event.stage === "FAILED") {
            stopped = true;
            clearTimeout(idleTimer);
            controller.abort();
            onError?.(new Error(event.message || "The verification failed. Please try again."));
            return;
          }
        }
      }

      clearTimeout(idleTimer);
      if (!finished && !stopped) {
        onError?.(new Error("The connection closed before the agents finished. Please try again."));
      }
    } catch (err) {
      clearTimeout(idleTimer);
      if (stopped) return;
      if (timedOut) {
        onError?.(new Error("The server stopped responding. Please try again."));
      } else {
        onError?.(new Error(friendlyMessage(err)));
      }
    }
  })();

  return () => {
    stopped = true;
    clearTimeout(idleTimer);
    controller.abort();
  };
}