import { buildFullSystemPrompt } from './professorKlass'

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const ANTHROPIC_URL     = 'https://api.anthropic.com/v1/messages'
const MODEL             = 'claude-sonnet-4-5'

// ── Shared fetch wrapper ──────────────────────────────────────────────────────

async function claudeJSON<T>(
  prompt: string,
  systemPrompt?: string,
  maxTokens = 8096
): Promise<T> {
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
      max_tokens: maxTokens,
      system: systemPrompt ?? buildFullSystemPrompt(),
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`)

  const data    = await response.json()
  const content = data.content[0].text as string

  // Robust JSON extraction — handles markdown fences and partial wrapping
  const tryParse = (s: string): T | null => {
    try { return JSON.parse(s) } catch { return null }
  }

  // Try raw first
  let result = tryParse(content)
  if (result) return result

  // Strip markdown code fences
  const stripped = content.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()
  result = tryParse(stripped)
  if (result) return result

  // Extract first JSON array or object
  const arrMatch = content.match(/\[([\s\S]*?)\](?=[^\[\]]*$)/)
  if (arrMatch) {
    result = tryParse(arrMatch[0])
    if (result) return result
  }
  const objMatch = content.match(/\{[\s\S]*\}/)
  if (objMatch) {
    result = tryParse(objMatch[0])
    if (result) return result
  }

  throw new Error('Failed to parse Claude response as JSON. Response may be too long or malformed.')
}

async function claudeText(
  prompt: string,
  systemPrompt?: string,
  maxTokens = 4096
): Promise<string> {
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
      max_tokens: maxTokens,
      system: systemPrompt ?? buildFullSystemPrompt(),
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`)
  const data = await response.json()
  return data.content[0].text as string
}


// ── Types ─────────────────────────────────────────────────────────────────────

export interface GeneratedBlock {
  type: 'definition' | 'explanation' | 'formula' | 'example' | 'keypoint' | 'note' | 'diagram'
  title: string
  body: string
  analogy?: string | null
  breakdown?: string | null
  steps?: { expression: string; talkingPoint: string }[] | null
  diagramPrompt?: string | null
}

export interface GeneratedQuestion {
  type: 'mcq' | 'truefalse' | 'fillingap'
  question_text: string
  options: { id: string; text: string }[]
  correct_answer: string
  hint: string
}

export interface CourseGenerationParams {
  // What we're generating
  level:         'topic' | 'subtopic'
  name:          string        // topic name or subtopic name
  topicName:     string        // always the parent topic name
  subjectName?:  string

  // Context
  overview?:      string
  objectives?:    string[]
  prerequisites?: string[]     // names of prerequisite topics

  // Position in course
  chapterNumber?: number
  totalChapters?: number

  // Source material (all optional)
  sourceTextbook?:   string
  sourceTranscript?: string
  sourceExtra?:      string
}


// ── PASS 1: Preprocess sources into clean structured notes ───────────────────
// Organises raw material around objectives without adding anything new.
// Output is readable text the teacher can review/edit before generation.

export async function preprocessSources(params: CourseGenerationParams): Promise<string> {
  const hasMaterial = params.sourceTextbook || params.sourceTranscript || params.sourceExtra

  // If no material provided, generate from Professor Klass's knowledge directly
  if (!hasMaterial) {
    return `[SELF-CONTAINED: No source material provided. Generation will use Professor KLASS's expert knowledge of ${params.subjectName ?? 'this subject'} directly.]

Topic: ${params.topicName}
${params.level === 'subtopic' ? `Subtopic: ${params.name}` : ''}
Overview: ${params.overview ?? 'Not provided'}
Objectives: ${params.objectives?.join('; ') ?? 'Not specified'}
Prerequisites: ${params.prerequisites?.join(', ') ?? 'None specified'}`
  }

  const parts: string[] = []
  if (params.sourceTranscript) parts.push(`=== TRANSCRIPT ===\n${params.sourceTranscript}`)
  if (params.sourceTextbook)   parts.push(`=== TEXTBOOK EXTRACT ===\n${params.sourceTextbook}`)
  if (params.sourceExtra)      parts.push(`=== ADDITIONAL NOTES ===\n${params.sourceExtra}`)

  const prompt = `You are preparing teaching notes for a secondary school teacher.

${params.level === 'topic'
  ? `COURSE: ${params.name} (this is the full topic course - be comprehensive)`
  : `TOPIC: ${params.topicName}\nSUBTOPIC: ${params.name} (this is a deep-dive into one specific concept)`
}
${params.overview ? `Overview: ${params.overview}` : ''}
Learning Objectives: ${params.objectives?.join('; ') ?? 'Not specified'}
${params.prerequisites?.length ? `Prerequisites (DO NOT re-teach these): ${params.prerequisites.join(', ')}` : ''}

From the raw source materials below:
1. Extract ONLY what is relevant to the ${params.level === 'topic' ? 'course' : 'subtopic'}
2. Organise it around the learning objectives
3. Remove filler, repetition, off-topic content
4. Add short analogies where they would help (clearly marked [ANALOGY])
5. Flag gaps with [GAP: what is missing]
6. Do NOT invent content - only structure what exists

Output clean, structured teaching notes with clear headings.

SOURCE MATERIALS:
${parts.join('\n\n')}`

  return claudeText(prompt, buildFullSystemPrompt(params.subjectName), 4096)
}


// ── PASS 2: Generate lesson blocks from clean notes ───────────────────────────
// Produces the final content blocks ready to save to the database.

export async function generateLesson(
  params: CourseGenerationParams,
  cleanNotes: string
): Promise<GeneratedBlock[]> {

  const isFullCourse = params.level === 'topic'

  const prompt = `You are building a ${isFullCourse ? 'FULL COURSE' : 'SUBTOPIC LESSON'} for Nigerian secondary school students (SS1–SS3, WAEC/JAMB level).

${isFullCourse
  ? `COURSE: ${params.name} (Subject: ${params.subjectName ?? 'unknown'})\nThis is the COMPLETE course on ${params.name}. Cover everything comprehensively.`
  : `TOPIC: ${params.topicName}\nSUBTOPIC: ${params.name}${params.chapterNumber ? ` - Chapter ${params.chapterNumber} of ${params.totalChapters}` : ''}\nThis is a DEEP DIVE into one specific concept. Assume the topic foundation is already established.`
}

${params.overview ? `Overview: ${params.overview}` : ''}
Learning Objectives: ${params.objectives?.length ? params.objectives.join('; ') : 'Not specified'}
${params.prerequisites?.length ? `Prerequisites (already covered - reference briefly if needed, never re-teach): ${params.prerequisites.join(', ')}` : ''}

TEACHING NOTES (generate ONLY from this material):
${cleanNotes}

REQUIRED SEQUENCE - follow this order exactly:
1. definition(s) - what it is
2. explanation - why it works, how to think about it
3. formula - if applicable
4. example - worked step-by-step
5. keypoint - single most important thing
6. note - common mistakes / exam traps (if relevant)
7. diagram - where a visual would genuinely help

Return ONLY a valid JSON array. No markdown, no explanation.

Block shapes:
- definition:  { type, title, body, analogy }
- explanation: { type, title, body }
- formula:     { type, title, body (LaTeX), breakdown }
- example:     { type, title, body, steps: [{ expression, talkingPoint }] }
- keypoint:    { type, title, body }
- note:        { type, title, body }
- diagram:     { type, title, body: "what it shows", diagramPrompt: "how to draw it" }

Quality rules:
- Concrete before abstract - analogy before formula
- One idea fully explained before introducing the next
- If notes say [GAP] - skip that section, do not hallucinate
- Use Nigerian context where natural (not forced)
- Formula body field must be valid LaTeX string

Generate now:`

  return claudeJSON<GeneratedBlock[]>(prompt, buildFullSystemPrompt(params.subjectName), 8096)
}


// ── Generate questions for a lesson ──────────────────────────────────────────

export async function generateQuestions(
  params: CourseGenerationParams,
  contentSummary: string,
  count = 4
): Promise<GeneratedQuestion[]> {

  const prompt = `Generate exactly ${count} multiple choice questions for Nigerian SS1–SS3 students (WAEC/JAMB level).

${params.level === 'topic' ? `Course: ${params.name}` : `Topic: ${params.topicName}\nSubtopic: ${params.name}`}
Learning Objectives: ${params.objectives?.join('; ') ?? 'Not specified'}

Content covered:
${contentSummary}

Rules:
- Questions must directly test the learning objectives
- Options must be plausible distractors - no obviously wrong answers
- Range from recall to application difficulty
- Hints are ONE sentence: what concept did the question test, NOT the answer

Return ONLY valid JSON array:
[{
  "type": "mcq",
  "question_text": "...",
  "options": [{ "id": "a", "text": "..." }, { "id": "b", "text": "..." }, { "id": "c", "text": "..." }, { "id": "d", "text": "..." }],
  "correct_answer": "a",
  "hint": "..."
}]`

  return claudeJSON<GeneratedQuestion[]>(prompt, buildFullSystemPrompt(params.subjectName))
}


// ── Legacy helpers (kept for backward compatibility) ─────────────────────────

export async function generateBlocksFromText(rawText: string) {
  const prompt = `Extract and structure the following text into a sequence of learning blocks.

Return ONLY a valid JSON array. Each block:
{ type: "definition"|"explanation"|"formula"|"example"|"keypoint"|"note", title, body, analogy?, breakdown?, steps? }

TEXT:
${rawText}`
  return claudeJSON<GeneratedBlock[]>(prompt)
}

export async function generateQuestionsFromSubtopic(
  subtopicName: string,
  topicName: string,
  objectives: string[],
  contentSummary: string,
  count = 5,
  subjectName?: string
): Promise<GeneratedQuestion[]> {
  return generateQuestions(
    { level: 'subtopic', name: subtopicName, topicName, subjectName, objectives },
    contentSummary,
    count
  )
}


// ── Generate course overview from topic name alone ────────────────────────────

export interface GeneratedOverview {
  overview:      string
  objectives:    string[]
  prerequisites: string[]  // topic names to search for in KLASS
}

export async function generateCourseOverview(params: {
  topicName:   string
  subjectName?: string
  level:       'topic' | 'subtopic'
}): Promise<GeneratedOverview> {
  const isTopic = params.level === 'topic'

  const prompt = `You are building a course outline for a Nigerian secondary school student (SS1–SS3, WAEC/JAMB level).

${isTopic
  ? `Course topic: ${params.topicName} (Subject: ${params.subjectName ?? 'unknown'})`
  : `Subtopic: ${params.topicName} (Subject: ${params.subjectName ?? 'unknown'})`
}

Generate the following in JSON format:

{
  "overview": "2-3 sentence description of what this ${isTopic ? 'course' : 'subtopic'} covers and why it matters to students. Be specific to Nigerian SS1-SS3 curriculum.",
  "objectives": [
    "By the end of this, students should be able to... (5-7 specific, measurable objectives)"
  ],
  "prerequisites": [
    "List of topic names a student should have covered first (just the topic names, e.g. 'Cell Biology', 'Basic Algebra'). Max 4. If this is a foundational topic with no prerequisites, return an empty array []."
  ]
}

Return ONLY valid JSON. No markdown, no explanation.`

  return claudeJSON<GeneratedOverview>(prompt, buildFullSystemPrompt(params.subjectName))
}