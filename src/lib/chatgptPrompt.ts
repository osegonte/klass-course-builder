export function buildChatGPTPrompt(params: {
  level:        'topic' | 'subtopic'
  name:         string
  topicName:    string
  subjectName?: string
  overview?:    string
  objectives?:  string[]
}): string {
  const { level, name, topicName, subjectName, overview, objectives } = params
  const isTopic = level === 'topic'
  const objList = objectives?.filter(o => o.trim()).map((o, i) => `${i + 1}. ${o}`).join('\n') ?? ''

  return `You are building structured course content for Nigerian secondary school students (SS1-SS3, WAEC and JAMB level).

SUBJECT: ${subjectName ?? 'Not specified'}
${isTopic
  ? `COURSE: ${name}\nThis is the complete course on ${name}. Cover everything students need to fully understand this topic.`
  : `PARENT COURSE: ${topicName}\nSUBTOPIC: ${name}\nThis is a focused lesson on ${name} within the larger ${topicName} course.`
}
${overview ? `\nOVERVIEW:\n${overview}` : ''}
${objList ? `\nLEARNING OBJECTIVES (your output must fully address all of these):\n${objList}` : ''}

YOUR TASK:
Produce complete teaching content using EXACTLY the section format below. This output will be automatically parsed by software, so the format must be followed precisely.

REQUIRED FORMAT:

## DEFINITION: [Term or concept name]
[Precise definition in plain language — one to three sentences]
ANALOGY: [Concrete real-world analogy, ideally from Nigerian daily life]

## EXPLANATION: [Title]
[Clear explanation of why and how this concept works. Build intuition before formalism. Short paragraphs.]
ANALOGY: [Optional additional analogy]

## FORMULA: [Formula name]
[The formula itself on its own line, e.g.: a^m x a^n = a^(m+n)]
BREAKDOWN: [Define every variable or symbol used, e.g.: a = base number, m and n = exponents]

## EXAMPLE: [Problem title]
[Optional: one sentence describing the problem]
STEP 1: [expression or equation] -- [explain what is happening in this step]
STEP 2: [expression or equation] -- [explain what is happening in this step]
STEP 3: [expression or equation] -- [explain what is happening in this step]

## TABLE: [Table title]
Headers: Column 1 | Column 2 | Column 3
Row: value | value | value
Row: value | value | value

## KEYPOINT: [Title]
[The single most important thing to remember. One to two sentences maximum.]

## NOTE: [Title]
[Common mistake, exam trap, or extra context worth flagging.]

## DIAGRAM: [Title]
[Describe what the diagram shows]
INSTRUCTIONS: [Detailed instructions for how to draw or render this diagram]

RULES:
- Use ## headings exactly as shown above. Do not use ###, ####, bold, or any other heading style.
- Every section type keyword (DEFINITION, EXPLANATION, FORMULA, EXAMPLE, TABLE, KEYPOINT, NOTE, DIAGRAM) must be in capitals.
- Do not use em dashes or en dashes anywhere. Use regular hyphens or rewrite the sentence.
- Short sentences. Active voice. No filler phrases.
- In EXAMPLE sections, every step must follow the format: STEP N: expression -- explanation
- Use a double hyphen -- to separate expression from explanation in steps (not a single dash, not an em dash).
- In TABLE sections, always include a Headers line followed by Row lines using pipe | separators.
- Cover all learning objectives. Produce as many sections as needed.
- Do not produce an outline or summary. Produce the full content.
- If something requires a diagram to understand properly, include a DIAGRAM section.
- Do not add any text outside of the ## sections (no intro paragraph, no conclusion).

Begin now. Produce the full content, one section at a time.`
}