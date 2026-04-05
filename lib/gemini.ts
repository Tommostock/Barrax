/* ============================================
   Gemini AI Integration
   Helper function to call Google's Gemini API.
   All AI calls go through server-side API routes
   so the API key is never exposed to the client.
   ============================================ */

// The shape of what we send to the Gemini API
interface GeminiRequest {
  systemPrompt: string;
  userPrompt: string;
  maxRetries?: number;
}

// Call Gemini and return parsed JSON
// Retries up to maxRetries times if the response is invalid
export async function callGemini<T>(
  { systemPrompt, userPrompt, maxRetries = 3 }: GeminiRequest
): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  // Use Gemini 2.0 Flash (free tier, fast, good at structured output)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // System instruction tells Gemini its role and output format
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              parts: [{ text: userPrompt }],
            },
          ],
          // Configure the model to respond with JSON
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            responseMimeType: "application/json",
          },
        }),
      });

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

      // Parse the JSON response — Gemini sometimes wraps it in markdown code fences
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(cleanedText) as T;
      return parsed;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Gemini attempt ${attempt}/${maxRetries} failed:`, lastError.message);

      // Wait a bit before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError ?? new Error("Gemini request failed after all retries.");
}
