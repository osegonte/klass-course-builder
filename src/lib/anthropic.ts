import { buildFullSystemPrompt } from './professorKlass'

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

// ── Shared fetch wrapper ──────────────────────────────────────────────────────

async function claudeJSON<T>(prompt: string, systemPrompt?: string): Promise<T> {
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8096,
      system: systemPrompt ?? buildFullSystemPrompt(),
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const content: string = data.content[0].text

  try {
    return JSON.parse(content)
  } catch {
    const match = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('Failed to parse Claude response as JSON')
  }
}

// ── 1. Generate content blocks from raw text ─────────────────────────────────

export async function generateBlocksFromText(rawText: string) {
  const prompt = `You are an expert curriculum designer. Given the following raw textbook or lecture text, extract and structure it into a sequence of learning blocks.

Return ONLY a valid JSON array. No markdown, no explanation, just the raw JSON array.

Each block must follow this exact structure:
- type: one of "definition", "explanation", "formula", "example", "keypoint", "note"
- title: short title for the block
- body: main content
- analogy: (only for definition) a simple analogy to help understanding, or null
- breakdown: (only for formula) explanation of each variable, or null
- steps: (only for example) array of { expression: string, talkingPoint: string }, or null

Example output:
[
  {
    "type": "definition",
    "title": "Quadratic Equation",
    "body": "A polynomial equation of degree 2 in the form ax² + bx + c = 0",
    "analogy": "Like a parabola describing the path of a thrown ball",
    "breakdown": null,
    "steps": null
  },
  {
    "type": "formula",
    "title": "Quadratic Formula",
    "body": "x = (-b ± √(b²-4ac)) / 2a",
    "analogy": null,
    "breakdown": "a, b, c are coefficients. The ± means there are two possible solutions.",
    "steps": null
  }
]

Now process this text:
${rawText}`

  return claudeJSON<any[]>(prompt)
}

// ── 2. Generate questions from a subtopic's content + objectives ──────────────

export interface GeneratedQuestion {
  type: 'mcq' | 'truefalse' | 'fillingap'
  question_text: string
  options: { id: string; text: string }[]
  correct_answer: string
  hint: string
}

export async function generateQuestionsFromSubtopic(
  subtopicName: string,
  topicName: string,
  objectives: string[],
  contentSummary: string,
  count = 5,
  subjectName?: string
): Promise<GeneratedQuestion[]> {
  const prompt = `You are an expert exam question writer for Nigerian secondary school students (JAMB/WAEC level).

Topic: ${topicName}
Subtopic: ${subtopicName}
Learning Objectives: ${objectives.length > 0 ? objectives.join(', ') : 'Not specified'}
Content: ${contentSummary}

Generate exactly ${count} multiple choice questions (MCQ) that test understanding of this subtopic. Questions should range from recall to application difficulty.

Return ONLY a valid JSON array. No markdown, no explanation.

Each question must follow this exact structure:
{
  "type": "mcq",
  "question_text": "The question",
  "options": [
    { "id": "a", "text": "Option A" },
    { "id": "b", "text": "Option B" },
    { "id": "c", "text": "Option C" },
    { "id": "d", "text": "Option D" }
  ],
  "correct_answer": "a",
  "hint": "One sentence — what concept did this question test, without giving the full explanation"
}

Ensure:
- Options are plausible distractors, not obviously wrong
- Hints are ONE sentence max — tell the student what concept they missed, not the full answer. Example: "This tests whether you know the chain rule applies to composite functions." The full explanation lives in the course, not here.
- Questions directly test the objectives if provided`

  return claudeJSON<GeneratedQuestion[]>(prompt, buildFullSystemPrompt(subjectName))
}

// ── 3. Generate a full lesson outline for a subtopic ─────────────────────────

export interface LessonOutlineBlock {
  type: string
  title: string
  description: string
}

export async function generateLessonOutline(
  topicName: string,
  subtopicName: string,
  objectives: string[]
): Promise<LessonOutlineBlock[]> {
  const prompt = `You are a curriculum designer. Create a lesson outline for the following subtopic.

Topic: ${topicName}
Subtopic: ${subtopicName}
Objectives: ${objectives.length > 0 ? objectives.join(', ') : 'Not specified'}

Return ONLY a valid JSON array of content blocks that should be created for this lesson. No markdown, no explanation.

Each item should be:
{
  "type": "definition" | "explanation" | "formula" | "example" | "keypoint" | "note",
  "title": "Block title",
  "description": "One sentence describing what this block should cover"
}

Produce a logical teaching sequence: start with definitions, build up to explanations and formulas, include worked examples, end with key points.`

  return claudeJSON<LessonOutlineBlock[]>(prompt)
}


// ── 4. PASS 1 — Clean raw sources into structured notes ───────────────────────
// Input: raw YouTube transcript + raw textbook text + topic context
// Output: clean structured notes the teacher can review and edit before generation

export async function prepareSources(params: {
  subtopicName: string
  topicName: string
  subjectName?: string
  objectives: string[]
  transcript?: string
  textbook?: string
  extra?: string
  topicContext?: { overview: string; why_it_matters: string; prerequisites: string }
  chapterNumber?: number
  totalChapters?: number
}): Promise<string> {
  const { subtopicName, topicName, objectives, transcript, textbook, extra, topicContext, chapterNumber, totalChapters } = params

  const parts: string[] = []
  if (transcript) parts.push(`=== YOUTUBE TRANSCRIPT ===\n${transcript}`)
  if (textbook) parts.push(`=== TEXTBOOK EXTRACT ===\n${textbook}`)
  if (extra) parts.push(`=== ADDITIONAL NOTES ===\n${extra}`)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8096,
      system: buildFullSystemPrompt(params.subjectName),
      messages: [{
        role: 'user',
        content: `You are preparing teaching notes for a secondary school teacher.

Topic: ${topicName}
Subtopic: ${subtopicName}${chapterNumber ? ` (Chapter ${chapterNumber} of ${totalChapters})` : ''}
Learning Objectives: ${objectives.length > 0 ? objectives.join('; ') : 'Not specified'}${topicContext?.overview ? `

COURSE CONTEXT (this subtopic is part of a larger course on ${topicName}):
- Course overview: ${topicContext.overview}
- Why it matters: ${topicContext.why_it_matters}
- Prerequisites: ${topicContext.prerequisites}

Use this context to ensure the lesson feels connected to the course — don't repeat the overview but build naturally from it.` : ''}

You have been given raw source materials below. Your job is to:
1. Extract ONLY the concepts, explanations, and examples that are relevant to the subtopic
2. Remove all filler, repetition, and off-topic content
3. Organise what remains into clean structured notes
4. Do NOT add anything that is not in the source materials
5. Flag any gap with [GAP: what is missing] so the teacher knows

Format the output as clean readable notes with clear headings. This is NOT the final lesson — it is a reference the teacher will review before the lesson is generated.

SOURCE MATERIALS:
${parts.join('\n\n')}`,
      }],
    }),
  })

  if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`)
  const data = await response.json()
  return data.content[0].text as string
}


// ── 5. PASS 2 — Generate full lesson blocks from clean notes + objectives ──────
// Input: clean notes (output of pass 1, possibly edited by teacher) + objectives
// Output: structured content blocks ready to save to cs_content_blocks

export interface GeneratedBlock {
  type: 'definition' | 'explanation' | 'formula' | 'example' | 'keypoint' | 'note' | 'diagram'
  title: string
  body: string
  analogy?: string | null
  breakdown?: string | null
  steps?: { expression: string; talkingPoint: string }[] | null
  diagramPrompt?: string | null  // for diagram placeholders
}

export async function generateLessonFromSources(params: {
  subtopicName: string
  topicName: string
  subjectName?: string
  objectives: string[]
  cleanNotes: string
  topicContext?: { overview: string; why_it_matters: string; prerequisites: string }
  chapterNumber?: number
  totalChapters?: number
}): Promise<GeneratedBlock[]> {
  const { subtopicName, topicName, objectives, cleanNotes, topicContext, chapterNumber, totalChapters } = params

  const prompt = `You are an expert curriculum designer building a lesson for Nigerian secondary school students (SS1–SS3, WAEC/JAMB level).

Topic: ${topicName}
Subtopic: ${subtopicName}${chapterNumber ? ` — Chapter ${chapterNumber} of ${totalChapters}` : ''}
Learning Objectives: ${objectives.length > 0 ? objectives.join('; ') : 'Not specified'}${topicContext?.overview ? `

COURSE CONTEXT:
This lesson is chapter ${chapterNumber ?? '?'} in a course on ${topicName}.
Course overview: ${topicContext.overview}
Why it matters: ${topicContext.why_it_matters}
Prerequisites: ${topicContext.prerequisites}

The lesson should feel like a natural continuation of the course — assume students have read the course intro and understand the bigger picture. Don't re-explain the overall topic, dive into the chapter.` : ''}

TEACHING NOTES (use ONLY what is in here — do not add outside knowledge):
${cleanNotes}

Build a complete lesson as a sequence of content blocks. Rules:
- Break every concept down simply — explain it like the student has never seen it before
- Use concrete analogies and real-world examples where possible
- Where a diagram would genuinely help understanding, insert a diagram block with a clear description
- Follow a logical teaching sequence: concept → explanation → worked example → key points
- Do NOT hallucinate — if the notes don't cover something clearly, skip it or flag it with [INCOMPLETE]

Return ONLY a valid JSON array. No markdown, no explanation, just raw JSON.

Block types and their fields:

definition → { type, title, body, analogy }
explanation → { type, title, body }
formula → { type, title, body, breakdown }
example → { type, title, body, steps: [{ expression, talkingPoint }] }
keypoint → { type, title, body }
note → { type, title, body }
diagram → { type, title, body: "description of what the diagram should show", diagramPrompt: "detailed instruction for drawing/creating the diagram" }

Example diagram block:
{
  "type": "diagram",
  "title": "Area Under a Curve",
  "body": "A graph showing the shaded region between f(x) and the x-axis from x=a to x=b, representing the definite integral.",
  "diagramPrompt": "Draw a smooth curve f(x) above the x-axis. Shade the area between x=a and x=b. Label the x-axis, y-axis, the curve as f(x), and mark points a and b on the x-axis. Add the integral notation below."
}

Now generate the lesson blocks:`

  return claudeJSON<GeneratedBlock[]>(prompt, buildFullSystemPrompt(params.subjectName))
}