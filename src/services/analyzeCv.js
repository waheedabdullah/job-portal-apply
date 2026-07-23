/**
 * AI helpers via Groq (no Express backend).
 * Key: VITE_GROQ_API_KEY in job-portal/.env
 */
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

function getApiKey() {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey || !String(apiKey).trim()) {
    throw new Error(
      "Groq API key missing. Add VITE_GROQ_API_KEY in job-portal/.env and restart npm run dev."
    );
  }
  return apiKey;
}

async function groqJson(prompt) {
  const apiKey = getApiKey();

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You return only valid JSON. No markdown.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 401 || res.status === 403) {
      throw new Error("Groq API key invalid. Create a new key and update .env.");
    }
    throw new Error(`AI request failed (${res.status}). ${errText.slice(0, 140)}`);
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content || "";

  try {
    return JSON.parse(raw);
  } catch {
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    return JSON.parse(cleaned);
  }
}

function clampScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
}

/** Feature 1: Analyze CV quality */
export async function analyzeCvWithAI(cvText) {
  const trimmed = String(cvText || "").trim();
  if (trimmed.length < 40) {
    throw new Error("Please paste a longer CV (at least a few lines) before analyzing.");
  }

  const parsed = await groqJson(`You are a career coach for a job portal.
Analyze the CV text below and return ONLY valid JSON with this exact shape:
{
  "summary": "2-3 sentence summary of the candidate",
  "skills": ["skill1", "skill2"],
  "strengths": ["strength1", "strength2"],
  "improvements": ["tip1", "tip2", "tip3"],
  "score": 0
}
score must be an integer from 0 to 100 for overall CV quality for entry/mid-level jobs.

CV TEXT:
${trimmed}`);

  return {
    summary: String(parsed.summary || "").trim(),
    skills: Array.isArray(parsed.skills) ? parsed.skills.map(String) : [],
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    improvements: Array.isArray(parsed.improvements)
      ? parsed.improvements.map(String)
      : [],
    score: clampScore(parsed.score),
  };
}

/** Feature 2: Match saved CV against a job posting */
export async function matchJobWithCv(cvText, job) {
  const trimmed = String(cvText || "").trim();
  if (trimmed.length < 40) {
    throw new Error("Save your CV first in My CV (AI), then try Match again.");
  }

  const jobBlock = [
    `Title: ${job.title || ""}`,
    `Company: ${job.companyName || ""}`,
    `Location: ${job.location || ""}`,
    `Type: ${job.type || ""}`,
    `Salary: ${job.salary || ""}`,
    `Description: ${job.description || ""}`,
  ].join("\n");

  const parsed = await groqJson(`You are a hiring assistant for a job portal.
Compare the candidate CV with the job posting and return ONLY valid JSON:
{
  "matchScore": 0,
  "verdict": "short verdict like Strong Match / Partial Match / Weak Match",
  "matchedSkills": ["skill that matches"],
  "missingSkills": ["skill required but missing"],
  "tips": ["tip1", "tip2"]
}
matchScore is 0-100 how well the CV fits THIS job.

JOB:
${jobBlock}

CV:
${trimmed}`);

  return {
    matchScore: clampScore(parsed.matchScore),
    verdict: String(parsed.verdict || "Match result").trim(),
    matchedSkills: Array.isArray(parsed.matchedSkills)
      ? parsed.matchedSkills.map(String)
      : [],
    missingSkills: Array.isArray(parsed.missingSkills)
      ? parsed.missingSkills.map(String)
      : [],
    tips: Array.isArray(parsed.tips) ? parsed.tips.map(String) : [],
  };
}


/** Feature 3: Company — write / improve a job description with AI */
export async function writeJobDescriptionWithAI(form, companyName = "") {
  const title = String(form?.title || "").trim();
  if (!title) {
    throw new Error("Enter a Job Title first, then click Write with AI.");
  }

  const existing = String(form?.description || "").trim();
  const mode = existing ? "improve" : "generate";

  const parsed = await groqJson(`You are an expert HR copywriter for a job portal in Pakistan.
${mode === "generate"
  ? "Write a clear, professional job description."
  : "Improve the existing job description. Keep it clear and professional."}
Return ONLY valid JSON:
{
  "description": "full job description text with responsibilities, requirements, and nice-to-have skills. Use plain text with line breaks, no markdown headings."
}

Company: ${companyName || "Our company"}
Job Title: ${title}
Location: ${form?.location || ""}
Job Type: ${form?.type || ""}
Salary: ${form?.salary || ""}
Existing description (may be empty):
${existing || "(none)"}`);

  const description = String(parsed.description || "").trim();
  if (!description) {
    throw new Error("AI returned an empty description. Please try again.");
  }
  return description;
}
