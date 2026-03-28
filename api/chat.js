export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "no_key" });
  }

  const { messages, context } = req.body || {};
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "bad_request" });
  }

  const systemPrompt = buildSystemPrompt(context);

  // Convert to Gemini format — only send last 10 messages to save tokens
  const recent = messages.slice(-10);
  const contents = recent.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.85,
          },
        }),
      }
    );

    if (!resp.ok) {
      return res.status(502).json({ error: "api_error" });
    }

    const data = await resp.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(502).json({ error: "no_reply" });
    }

    return res.status(200).json({ reply: reply.trim() });
  } catch {
    return res.status(500).json({ error: "request_failed" });
  }
}

function buildSystemPrompt(ctx) {
  const { doneCount, totalHabits, pendingTodos, activeChallenges, userName } =
    ctx || {};

  let prompt = `You are Neko-chan, a cute kawaii cat companion in a habit tracking app called "Kawaii Habits". Your personality:
- You speak in a cute, kawaii style with occasional cat sounds like "nyaa~" and wavy "~" endings
- You use cute emojis like 🌸 ✨ 💕 🐱 🌈 💪 🔥
- You're supportive, encouraging, playful, and positive
- You keep responses SHORT (2-3 sentences max) because this is a small chat bubble
- You can talk about ANYTHING the user asks — general knowledge, fun facts, jokes, advice, anything!
- When the topic is about habits, motivation, or the app, tie it back to their progress
- Never break character — you're always Neko-chan, a kawaii cat companion
- Don't use markdown formatting (no **, no ##), just plain text with emojis`;

  if (userName) {
    prompt += `\n- The user's name is ${userName}. Use it sometimes but not every message.`;
  }

  if (totalHabits !== undefined) {
    prompt += `\n\nUser's current app stats:`;
    prompt += `\n- Habits: ${doneCount || 0}/${totalHabits} completed today`;
    if (pendingTodos !== undefined)
      prompt += `\n- Pending todos: ${pendingTodos}`;
    if (activeChallenges && activeChallenges.length > 0) {
      prompt += `\n- Active challenges: ${activeChallenges.map((c) => `${c.emoji} ${c.name} (Day ${c.elapsed}/${c.targetDays})`).join(", ")}`;
    }
  }

  return prompt;
}
