type RiskLevel = "Mild" | "Moderate" | "Severe" | "Emergency";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...init?.headers,
    },
  });
}

function normalizeRiskLevel(value: unknown): RiskLevel {
  if (value === "Mild" || value === "Moderate" || value === "Severe" || value === "Emergency") return value;
  return "Moderate";
}

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) return cleaned.slice(start, end + 1);
  return cleaned;
}

function normalizeAiPayload(raw: string | undefined) {
  if (!raw) {
    return {
      riskLevel: "Moderate" as RiskLevel,
      guidance: "Monitor symptoms and contact a veterinarian if they persist or worsen.",
    };
  }

  try {
    const parsed = JSON.parse(extractJson(raw));
    return {
      riskLevel: normalizeRiskLevel(parsed.riskLevel),
      guidance: String(parsed.guidance || raw).trim(),
    };
  } catch {
    return {
      riskLevel: "Moderate" as RiskLevel,
      guidance: raw.trim(),
    };
  }
}

function promptFor(body: unknown) {
  return [
    "You are PetNexa AI, a cautious pet-care assistant.",
    "Give concise, non-diagnostic pet health guidance.",
    "Never prescribe medication, medication dosage, or replace veterinary care.",
    "If signs could be urgent, tell the user to contact a veterinarian or emergency clinic.",
    "Return only JSON with this shape:",
    '{"riskLevel":"Mild|Moderate|Severe|Emergency","guidance":"short practical guidance"}',
    JSON.stringify(body),
  ].join("\n");
}

async function callGemini(body: unknown) {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("Gemini key not configured.");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptFor(body) }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 500,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) throw new Error("Gemini failed.");
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
}

async function callGroq(body: unknown) {
  const key = Deno.env.get("GROQ_API_KEY");
  if (!key) throw new Error("Groq key not configured.");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        { role: "system", content: "You provide cautious, non-diagnostic pet health guidance. Never prescribe medication or dosage. Return only JSON." },
        { role: "user", content: promptFor(body) },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) throw new Error("Groq failed.");
  const data = await response.json();
  return data?.choices?.[0]?.message?.content as string | undefined;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, { status: 405 });

  try {
    const body = await request.json();
    if (!body?.pet || !body?.symptoms) return json({ error: "Missing consultation input." }, { status: 400 });

    let raw: string | undefined;
    try {
      raw = await callGemini(body);
    } catch {
      raw = await callGroq(body);
    }

    const result = normalizeAiPayload(raw);
    return json({
      riskLevel: result.riskLevel,
      guidance: `${result.guidance}\n\nThis AI assistant provides informational guidance only and does not replace professional veterinary care.`,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "AI service unavailable." }, { status: 500 });
  }
});
