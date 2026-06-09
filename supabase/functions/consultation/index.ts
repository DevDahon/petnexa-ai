type RiskLevel = "Mild" | "Moderate" | "Severe" | "Emergency";

const RISK_LEVELS: RiskLevel[] = ["Mild", "Moderate", "Severe", "Emergency"];

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
  const normalized = String(value || "").trim().toLowerCase();
  return RISK_LEVELS.find((level) => level.toLowerCase() === normalized) || "Mild";
}

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) return cleaned.slice(start, end + 1);
  return cleaned;
}

function textFromBody(body: unknown) {
  return JSON.stringify(body).toLowerCase();
}

const redFlags = [
  "difficulty breathing",
  "trouble breathing",
  "abnormal breathing",
  "seizure",
  "unconscious",
  "severe bleeding",
  "poison",
  "poisoning",
  "blood in stool",
  "blood in urine",
  "continuous vomiting",
  "severe dehydration",
  "collapse",
  "collapsed",
];

const moderateSignals = [
  "repeated",
  "few times",
  "3+ days",
  "not eating",
  "weak",
  "very weak",
  "wound",
  "cough",
  "letharg",
  "pain",
  "dehydration",
  "changed",
];

function hasRedFlags(body: unknown) {
  const text = textFromBody(body);
  return redFlags.some((flag) => text.includes(flag));
}

function inferLocalGuidance(body: unknown): { riskLevel: RiskLevel; guidance: string } {
  const text = textFromBody(body);

  if (hasRedFlags(body)) {
    return {
      riskLevel: "Emergency",
      guidance:
        "Emergency warning signs may be present. Seek urgent veterinary or emergency clinic care now and avoid delaying with home monitoring.",
    };
  }

  if (moderateSignals.some((signal) => text.includes(signal))) {
    return {
      riskLevel: "Moderate",
      guidance:
        "Use supportive monitoring while you plan timely veterinary advice if this continues: keep your pet calm, offer fresh water, avoid sudden diet changes, track appetite, water intake, stool, breathing, energy, and symptom timing, and do not give medication unless a veterinarian already instructed it. Escalate sooner if symptoms repeat, worsen, or combine with lethargy, pain, dehydration, or breathing changes.",
    };
  }

  return {
    riskLevel: "Mild",
    guidance:
      "This sounds mild from the details provided. Monitor at home for now: keep fresh water available, offer normal food gently if your pet wants it, avoid new treats or sudden diet changes, keep activity calm, and record appetite, water intake, stool, energy, and symptom timing. Get veterinary help only if it repeats, persists beyond a short observation period, worsens, or any red flags appear.",
  };
}

function isVetOnlyGuidance(guidance: string) {
  const normalized = guidance.toLowerCase();
  const vetMentions = (normalized.match(/veterinarian|vet|clinic/g) || []).length;
  const practicalSignals = [
    "water",
    "food",
    "appetite",
    "stool",
    "energy",
    "monitor",
    "record",
    "calm",
    "breathing",
  ];
  return vetMentions > 0 && practicalSignals.filter((signal) => normalized.includes(signal)).length < 2;
}

function hasUnsafeHomeInstruction(guidance: string) {
  const normalized = guidance.toLowerCase();
  return (
    normalized.includes("withhold food") ||
    normalized.includes("withhold water") ||
    normalized.includes("fast ") ||
    normalized.includes("fasting")
  );
}

function normalizeAiPayload(raw: string | undefined, body: unknown) {
  const local = inferLocalGuidance(body);

  if (!raw) {
    return local;
  }

  let result: { riskLevel: RiskLevel; guidance: string };
  try {
    const parsed = JSON.parse(extractJson(raw));
    result = {
      riskLevel: normalizeRiskLevel(parsed.riskLevel),
      guidance: String(parsed.guidance || raw).trim(),
    };
  } catch {
    result = {
      riskLevel: local.riskLevel,
      guidance: raw.trim(),
    };
  }

  if (!hasRedFlags(body)) {
    if (local.riskLevel === "Mild" && (result.riskLevel === "Severe" || result.riskLevel === "Emergency")) {
      return local;
    }
    if ((local.riskLevel === "Mild" || local.riskLevel === "Moderate") && isVetOnlyGuidance(result.guidance)) {
      return {
        riskLevel: local.riskLevel,
        guidance: local.guidance,
      };
    }
    if (hasUnsafeHomeInstruction(result.guidance)) {
      return {
        riskLevel: local.riskLevel,
        guidance: local.guidance,
      };
    }
  }

  return result.guidance ? result : local;
}

function promptFor(body: unknown) {
  return [
    "You are PetNexa AI, a cautious pet-care assistant.",
    "Give concise, non-diagnostic pet health guidance with practical next steps.",
    "Never prescribe medication, medication dosage, or replace veterinary care.",
    "Do not instruct fasting or withholding food/water for a specific duration.",
    "For mild cases, do not start with 'contact a veterinarian'. Give home monitoring steps first, then list clear escalation signs.",
    "For moderate cases, give monitoring steps and suggest timely veterinary advice only if symptoms persist, repeat, worsen, or combine with red flags.",
    "For severe or emergency signs, tell the user to seek veterinary or emergency clinic care immediately.",
    "Avoid generic veterinarian-only answers for mild symptoms.",
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
        {
          role: "system",
          content:
            "You provide cautious, non-diagnostic pet health guidance. Never prescribe medication, dosage, or fasting/withholding-food durations. Return only JSON. For mild cases, provide practical home monitoring first and reserve veterinarian escalation for persistence, worsening, repeated symptoms, or red flags.",
        },
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

    const result = normalizeAiPayload(raw, body);
    return json({
      riskLevel: result.riskLevel,
      guidance: `${result.guidance}\n\nThis AI assistant provides informational guidance only and does not replace professional veterinary care.`,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "AI service unavailable." }, { status: 500 });
  }
});
