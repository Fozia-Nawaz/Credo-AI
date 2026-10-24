import sampleEvents from "../mock/sampleStreamEvents.json";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

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

  (async () => {
    try {
      // ASK the backend teammate for the real endpoint name and method.
      const response = await fetch(`${BASE_URL}/api/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Server-Sent Events arrive as lines starting with "data: "
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const part of parts) {
          const line = part.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          try {
            onEvent(JSON.parse(line.slice(5).trim()));
          } catch {
            onError?.(new Error("Received a bad event from the server"));
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") onError?.(err);
    }
  })();

  return () => controller.abort();
}