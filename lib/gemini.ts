/* ============================================
   AI Provider Integration
   Tries Gemini first (Google), then falls back
   to Groq (Llama) if Gemini is rate-limited.
   Both are 100% free with no credit card.
   ============================================ */

interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  maxRetries?: number;
}

// ---- GEMINI PROVIDER ----
// Tries multiple Gemini models in order of free-tier generosity
const GEMINI_MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

async function callGeminiProvider<T>(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<T | null> {
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            responseMimeType: "application/json",
          },
        }),
      });

      // Rate limited — try next model
      if (response.status === 429) {
        console.warn(`Gemini ${model} rate limited, trying next...`);
        continue;
      }

      if (!response.ok) continue;

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;

      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned) as T;
      console.log(`AI response from Gemini (${model})`);
      return parsed;

    } catch (error) {
      console.warn(`Gemini ${model} failed:`, error);
      continue;
    }
  }

  // All Gemini models failed
  return null;
}

// ---- GROQ PROVIDER (FALLBACK) ----
// Uses Llama models via Groq's free API
// 14,400 requests/day — much higher than Gemini
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

async function callGroqProvider<T>(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<T | null> {
  for (const model of GROQ_MODELS) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
          max_tokens: 4096,
        }),
      });

      // Rate limited — try next model
      if (response.status === 429) {
        console.warn(`Groq ${model} rate limited, trying next...`);
        continue;
      }

      if (!response.ok) {
        const errBody = await response.text();
        console.warn(`Groq ${model} error (${response.status}):`, errBody);
        continue;
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) continue;

      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned) as T;
      console.log(`AI response from Groq (${model})`);
      return parsed;

    } catch (error) {
      console.warn(`Groq ${model} failed:`, error);
      continue;
    }
  }

  // All Groq models failed
  return null;
}

// ---- MAIN ENTRY POINT ----
// Tries Gemini first, falls back to Groq.
// Both are free. Between them you'll practically never fail.
export async function callGemini<T>(
  { systemPrompt, userPrompt, maxRetries = 2 }: AIRequest
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // 1. Try Gemini (Google)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const result = await callGeminiProvider<T>(geminiKey, systemPrompt, userPrompt);
      if (result) return result;
      console.warn(`Gemini failed on attempt ${attempt}, falling back to Groq...`);
    }

    // 2. Fall back to Groq (Llama)
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      const result = await callGroqProvider<T>(groqKey, systemPrompt, userPrompt);
      if (result) return result;
      console.warn(`Groq also failed on attempt ${attempt}`);
    }

    // Wait before retrying the full chain
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }

  throw new Error(
    "AI generation failed. Both Gemini and Groq providers are unavailable. " +
    "Please wait a moment and try again."
  );
}
