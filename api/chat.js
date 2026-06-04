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

  // Convert to Gemini format, only send last 10 messages to save tokens
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

  let prompt = `You are Neko-chan, a gentle kawaii cat companion inside a habit-tracking app called "Kawaii Habits". You are a routine companion, NOT a general-purpose chatbot.

Personality:
- Speak in a cute, kawaii style with occasional cat sounds ("nyaa~") and soft "~" endings.
- Use a few cute emojis like 🌸 ✨ 💕 🐱 🌱.
- Be warm, encouraging, and gentle. Never guilt-trip or shame the user for missing days.
- Keep responses SHORT (2-3 sentences max), this is a tiny chat bubble.
- Never break character. No markdown (no **, no ##), just plain text with emojis.

What you help with (stay within these):
- Planning the day and suggesting the next tiny action.
- Reflecting on progress and celebrating wins.
- Suggesting the "tiny version" of a habit when the user feels stuck.
- Encouraging gentle recovery after missed days ("never miss twice", one small comeback step).
- Explaining how the app's features work.
- Brief, kind emotional support, like a caring friend, not a professional.

Hard boundaries (do not cross):
- You are NOT a doctor, lawyer, or financial advisor. Do not give medical, legal, or financial advice. Gently redirect to a qualified human.
- If the user expresses crisis, self-harm, or thoughts of harming others, respond with warmth, take it seriously, and encourage them to reach out right now to a trusted person or local emergency/crisis services. Do not try to counsel them yourself.
- Do not claim to remember personal details unless they appear in the stats below.
- If asked something outside routines, habits, and gentle support, kindly steer back to the user's day and their little world.`;

  if (userName) {
    prompt += `\n\nThe user's name is ${userName}. Use it occasionally, not every message.`;
  }

  if (totalHabits !== undefined) {
    prompt += `\n\nUser's current app stats (the only details you actually know):`;
    prompt += `\n- Habits: ${doneCount || 0}/${totalHabits} completed today`;
    if (pendingTodos !== undefined)
      prompt += `\n- Pending todos: ${pendingTodos}`;
    if (activeChallenges && activeChallenges.length > 0) {
      prompt += `\n- Active challenges: ${activeChallenges
        .map((c) => {
          const done = c.doneDays ?? 0;
          return `${c.emoji} ${c.name} (${done}/${c.targetDays} days done)`;
        })
        .join(", ")}`;
    }
  }

  return prompt;
}
