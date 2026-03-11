const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'

export async function generateBlocksFromText(rawText: string) {
  const prompt = `You are an expert curriculum designer. Given the following raw textbook or lecture text, extract and structure it into a sequence of learning blocks.

Return ONLY a valid JSON array with no markdown, no explanation, just the raw JSON.

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

  const response = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  try {
    return JSON.parse(content)
  } catch {
    // Sometimes the model wraps in ```json ... ``` despite instructions
    const match = content.match(/\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0])
    throw new Error('Failed to parse DeepSeek response as JSON')
  }
}