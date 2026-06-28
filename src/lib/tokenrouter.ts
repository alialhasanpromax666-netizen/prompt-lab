const BASE_URL = "https://router.bynara.id/v1";
const MODEL = "mimo-v2.5-pro-free";

export async function generateWithTokenRouter(
  systemPrompt: string,
  userPrompt: string
): Promise<string | null> {
  const apiKey = process.env.TOKENROUTER_API_KEY || "sk-nry-srmIBbD99JwJOU3HVOeNwYxIZ0Z_i8_E71YU3L911_g";
  if (!apiKey) return null;

  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout ? AbortSignal.timeout(55000) : (() => { const c = new AbortController(); setTimeout(() => c.abort(), 55000); return c.signal; })(),
    });

    if (!res.ok) {
      console.error(`TokenRouter API error: ${res.status} ${res.statusText}`);
      return null;
    }

    const json = (await res.json()) as {
      choices: { message: { content: string } }[];
    };

    let content = json.choices[0]?.message?.content ?? null;
    if (content) {
      content = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    }

    return content;
  } catch (err) {
    console.error("TokenRouter fetch failed:", err);
    return null;
  }
}
