type RiskLevel = "Mild" | "Moderate" | "Severe" | "Emergency";

const RISK_LEVELS: RiskLevel[] = ["Mild", "Moderate", "Severe", "Emergency"];

const SAFETY_NOTICE =
  "This AI assistant provides informational guidance only. It does not diagnose, prescribe medication, provide dosage instructions, or replace professional veterinary care.";

const RED_FLAGS = [
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

function normalizeRiskLevel(value: unknown, fallback: RiskLevel): RiskLevel {
  const normalized = String(value || "").trim().toLowerCase();
  return RISK_LEVELS.find((level) => level.toLowerCase() === normalized) || fallback;
}

function withSafetyNotice(guidance: string) {
  const cleanGuidance = guidance.trim();
  if (cleanGuidance.toLowerCase().includes("does not diagnose")) {
    return cleanGuidance;
  }
  return `${cleanGuidance}\n\n${SAFETY_NOTICE}`;
}

function safetyResponse(guidance: string, riskLevel: RiskLevel) {
  return Response.json({
    riskLevel,
    guidance: withSafetyNotice(guidance),
  });
}

function stripMarkdownFence(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseProviderResponse(text: string | undefined): { riskLevel: RiskLevel; guidance: string } | null {
  if (!text) return null;

  const cleaned = stripMarkdownFence(text);
  const jsonSource = cleaned.match(/\{[\s\S]*\}/)?.[0] || cleaned;

  try {
    const parsed = JSON.parse(jsonSource) as { riskLevel?: unknown; guidance?: unknown };
    const guidance = String(parsed.guidance || "").trim();
    if (!guidance) return null;
    return {
      riskLevel: normalizeRiskLevel(parsed.riskLevel, "Mild"),
      guidance,
    };
  } catch {
    const guidance = cleaned.trim();
    if (!guidance) return null;
    return {
      riskLevel: inferFallback(bodyTextToRiskSource(guidance)).riskLevel,
      guidance,
    };
  }
}

function bodyTextToRiskSource(body: unknown) {
  return JSON.stringify(body).toLowerCase();
}

function inferFallback(body: unknown): { riskLevel: RiskLevel; guidance: string } {
  const text = bodyTextToRiskSource(body);
  const hasRedFlag = RED_FLAGS.some((flag) => text.includes(flag));

  if (hasRedFlag) {
    return {
      riskLevel: "Emergency",
      guidance:
        "Emergency warning signs may be present. Contact a veterinarian or emergency clinic immediately and avoid home treatment delays.",
    };
  }

  const moderateSignals = ["repeated", "not eating", "weak", "wound", "cough", "letharg", "pain", "dehydration"];
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

function hasRedFlags(body: unknown) {
  const text = bodyTextToRiskSource(body);
  return RED_FLAGS.some((flag) => text.includes(flag));
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

function normalizeResultForInput(body: unknown, result: { riskLevel: RiskLevel; guidance: string }) {
  const fallback = inferFallback(body);
  if (!hasRedFlags(body)) {
    if (fallback.riskLevel === "Mild" && (result.riskLevel === "Severe" || result.riskLevel === "Emergency")) {
      return fallback;
    }
    if ((fallback.riskLevel === "Mild" || fallback.riskLevel === "Moderate") && isVetOnlyGuidance(result.guidance)) {
      return fallback;
    }
    if (hasUnsafeHomeInstruction(result.guidance)) {
      return fallback;
    }
  }
  return result.guidance ? result : fallback;
}

function buildPrompt(body: unknown) {
  return [
    "You are PetNexa AI, a cautious pet-care guidance assistant.",
    "Return only valid JSON with exactly these keys: riskLevel and guidance.",
    'riskLevel must be one of: "Mild", "Moderate", "Severe", "Emergency".',
    "For mild symptoms, do not start with 'contact a veterinarian'. Give practical home monitoring and supportive safety guidance first, then explain when to escalate.",
    "For moderate symptoms, give monitoring steps and suggest timely veterinary advice only if symptoms persist, repeat, worsen, or combine with red flags.",
    "For severe or emergency warning signs, advise immediate veterinary or emergency clinic care.",
    "Never diagnose, prescribe medication, name medication dosages, or give dosage instructions.",
    "Do not instruct fasting or withholding food/water for a specific duration.",
    "Do not turn every mild symptom into a veterinarian-only answer. Escalate only for persistence, worsening, repeated symptoms, or red flags.",
    "Keep guidance concise, friendly, and specific to the provided pet details.",
    `Consultation input: ${JSON.stringify(body)}`,
  ].join("\n");
}

async function callGemini(body: unknown) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini key not configured.");
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
      contents: [
        {
          parts: [{ text: buildPrompt(body) }],
        },
      ],
    }),
  });
  if (!response.ok) throw new Error("Gemini failed.");
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
}

async function callGroq(body: unknown) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("Groq key not configured.");
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "deepseek-r1-distill-llama-70b",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are PetNexa AI. Return only valid JSON with keys riskLevel and guidance. Do not diagnose, prescribe medication, provide dosage instructions, or give fasting/withholding-food durations. For mild cases, provide practical home monitoring first and reserve veterinarian escalation for persistence, worsening, repeated symptoms, or red flags.",
        },
        { role: "user", content: buildPrompt(body) },
      ],
    }),
  });
  if (!response.ok) throw new Error("Groq failed.");
  const data = await response.json();
  return data?.choices?.[0]?.message?.content as string | undefined;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.pet || !body?.symptoms) {
      return Response.json({ error: "Missing consultation input." }, { status: 400 });
    }

    let result: { riskLevel: RiskLevel; guidance: string } | null = null;
    let providerError: unknown;
    try {
      result = parseProviderResponse(await callGemini(body));
    } catch (error) {
      providerError = error;
      try {
        result = parseProviderResponse(await callGroq(body));
        providerError = undefined;
      } catch (fallbackError) {
        providerError = fallbackError;
      }
    }

    if (providerError) {
      return Response.json({ error: "AI service unavailable." }, { status: 503 });
    }

    const finalResult = normalizeResultForInput(body, result || inferFallback(body));
    return safetyResponse(finalResult.guidance, finalResult.riskLevel);
  } catch {
    return Response.json({ error: "AI service unavailable." }, { status: 500 });
  }
}
