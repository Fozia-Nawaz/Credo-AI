
import sampleEvents from "../mock/sampleStreamEvents.json";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

// If the server sends nothing for this long, we stop waiting.
const IDLE_TIMEOUT_MS = 45000;

function friendlyMessage(err) {
  if (err instanceof TypeError) {
    return "Cannot reach the server. Check that the backend is running and that your connection is working.";
  }
  return err.message || "Something went wrong.";
}

// Sends the student profile and streams back events one by one.
// Returns a function that stops the stream.
export function runVerification(profile, onEvent, onError) {
  if (USE_MOCK) {
    const timers = sampleEvents.map((event, i) =>
      setTimeout(() => onEvent(event), 700 * (i + 1))
    );
    return () => timers.forEach(clearTimeout);
  }

  const controller = new AbortController();
  let stopped = false; // the user or the page stopped it on purpose
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

      // ASK the backend teammate for the real endpoint name and method.
      const response = await fetch(`${BASE_URL}/api/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        throw new Error(`The server returned an error (${response.status}). Please try again.`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        resetIdleTimer();

        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

        // Server-Sent Events arrive as blocks separated by a blank line.
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const part of parts) {
          const line = part.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          try {
            const event = JSON.parse(line.slice(5).trim());
            if (event.stage === "COMPLETE") finished = true;
            onEvent(event);
          } catch {
            console.warn("Skipped a bad event from the server:", line);
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