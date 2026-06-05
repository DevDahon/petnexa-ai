type RiskLevel = "Mild" | "Moderate" | "Severe" | "Emergency";

function safetyResponse(guidance: string, riskLevel: RiskLevel = "Moderate") {
  return Response.json({
    riskLevel,
    guidance: `${guidance}\n\nThis AI assistant provides informational guidance only and does not replace professional veterinary care.`,
  });
}

async function callGemini(body: unknown) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini key not configured.");
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `Give concise non-diagnostic pet health guidance. Never prescribe dosage. Return practical monitoring and vet consultation advice.\n${JSON.stringify(body)}` }],
      }],
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
      messages: [
        { role: "system", content: "You provide cautious, non-diagnostic pet health guidance. Never prescribe medication or dosage. Recommend a veterinarian for moderate or severe signs." },
        { role: "user", content: JSON.stringify(body) },
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
    let guidance: string | undefined;
    try {
      guidance = await callGemini(body);
    } catch {
      guidance = await callGroq(body);
    }
    return safetyResponse(guidance || "Monitor symptoms and contact a veterinarian if they persist or worsen.", "Moderate");
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "AI service unavailable." }, { status: 500 });
  }
}
