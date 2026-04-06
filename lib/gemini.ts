/* ============================================
   Gemini AI Integration
   Helper function to call Google's Gemini API.
   All AI calls go through server-side API routes
   so the API key is never exposed to the client.

   Uses a model fallback chain so if one model's
   free tier is exhausted, it tries the next one.
   ============================================ */

// The shape of what we send to the Gemini API
interface GeminiRequest {
  systemPrompt: string;
  userPrompt: string;
  maxRetries?: number;
}

// Models to try in order — if one hits a rate limit, try the next.
// gemini-2.0-flash-lite has higher free-tier limits than 2.0-flash.
const MODEL_CHAIN = [
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

// Call Gemini and return parsed JSON.
// Tries multiple models if rate-limited (429).
// Retries with proper delay when the API tells us to wait.
export async function callGemini<T>(
  { systemPrompt, userPrompt, maxRetries = 3 }: GeminiRequest
): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  let lastError: Error | null = null;

  // Try each model in the chain
  for (const model of MODEL_CHAIN) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Retry loop for each model
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: [
              {
                parts: [{ text: userPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topP: 0.9,
              responseMimeType: "application/json",
            },
          }),
        });

        // Handle rate limiting (429) — extract retry delay from response
        if (response.status === 429) {
          const errorBody = await response.text();

          // Try to extract the retry delay from the response
          const retryMatch = errorBody.match(/retryDelay.*?(\d+)/);
          const waitSeconds = retryMatch ? parseInt(retryMatch[1]) : 30;

          console.warn(
            `Gemini rate limited on ${model} (attempt ${attempt}/${maxRetries}). ` +
            `Waiting ${waitSeconds}s before retry...`
          );

          // If this is the last attempt for this model, try the next model
          if (attempt === maxRetries) {
            lastError = new Error(
              `Rate limit exceeded on ${model}. Trying next model...`
            );
            break; // Break inner retry loop, continue to next model
          }

          // Wait the suggested delay before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, waitSeconds * 1000)
          );
          continue; // Retry same model
        }

        // Handle other HTTP errors
        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
        }

        const data = await response.json();

        // Extract the text content from Gemini's response
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          throw new Error("Gemini returned an empty response.");
        }

        // Parse the JSON — Gemini sometimes wraps it in markdown code fences
        const cleanedText = text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();

        const parsed = JSON.parse(cleanedText) as T;
        console.log(`Gemini response from ${model} (attempt ${attempt})`);
        return parsed;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(
          `Gemini ${model} attempt ${attempt}/${maxRetries} failed:`,
          lastError.message
        );

        // Exponential backoff before retrying (unless it was a 429 which has its own delay)
        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * attempt)
          );
        }
      }
    }
  }

  // All models exhausted — throw a user-friendly error
  throw new Error(
    "AI generation failed. The free tier rate limit has been reached. " +
    "Please wait a minute and try again."
  );
}
