import type { ContentBlock, BlockType, TableData } from '../types/content'

// ── Parse ChatGPT markdown output into KLASS content blocks ──────────────────
//
// Expected format (enforced by the ChatGPT prompt):
//
//   ## DEFINITION: Term Name
//   Body text
//   ANALOGY: analogy text
//
//   ## EXPLANATION: Title
//   Body text
//
//   ## FORMULA: Formula Name
//   a^m x a^n = a^(m+n)
//   BREAKDOWN: a = base, m and n = exponents
//
//   ## EXAMPLE: Problem Title
//   STEP 1: expression -- what is happening
//   STEP 2: expression -- what is happening
//
//   ## TABLE: Table Title
//   Headers: Col1 | Col2 | Col3
//   Row: val1 | val2 | val3
//   Row: val1 | val2 | val3
//
//   ## KEYPOINT: Title
//   Body text
//
//   ## NOTE: Title
//   Body text
//
//   ## DIAGRAM: Title
//   Body text
//   INSTRUCTIONS: how to draw it

const BLOCK_TYPE_MAP: Record<string, BlockType> = {
  'DEFINITION':  'definition',
  'EXPLANATION': 'explanation',
  'FORMULA':     'formula',
  'EXAMPLE':     'example',
  'TABLE':       'table',
  'KEYPOINT':    'keypoint',
  'KEY POINT':   'keypoint',
  'NOTE':        'note',
  'DIAGRAM':     'diagram',
}

interface RawSection {
  typeKey: string
  title:   string
  body:    string
}

function splitSections(markdown: string): RawSection[] {
  const lines   = markdown.split('\n')
  const sections: RawSection[] = []
  let current: RawSection | null = null

  for (const line of lines) {
    // Match ## TYPE: Title  or  ## TYPE - Title
    const header = line.match(/^#{1,3}\s+([A-Z][A-Z\s]+?)[\s]*[:\-]\s*(.+)$/)
    if (header) {
      if (current) sections.push(current)
      current = { typeKey: header[1].trim().toUpperCase(), title: header[2].trim(), body: '' }
    } else if (current) {
      current.body += (current.body ? '\n' : '') + line
    }
  }
  if (current) sections.push(current)
  return sections
}

function parseExample(body: string): { body: string; steps: { id: string; expression: string; talkingPoint: string }[] } {
  const lines = body.split('\n').filter(l => l.trim())
  const steps: { id: string; expression: string; talkingPoint: string }[] = []
  const intro: string[] = []

  for (const line of lines) {
    // Match: STEP N: expression -- explanation  or  STEP N: expression — explanation
    const stepMatch = line.match(/^STEP\s+\d+[\s:]+(.+?)(?:\s*[-—]{1,2}\s*|\s+::\s+)(.+)$/i)
    if (stepMatch) {
      steps.push({
        id:           crypto.randomUUID(),
        expression:   stepMatch[1].trim(),
        talkingPoint: stepMatch[2].trim(),
      })
    } else if (steps.length === 0) {
      // Text before first step = intro/problem statement goes in body
      intro.push(line)
    }
  }

  return { body: intro.join('\n').trim(), steps }
}

function parseTable(body: string): TableData {
  const lines   = body.split('\n').filter(l => l.trim())
  let headers:  string[] = []
  const rows:   string[][] = []

  for (const line of lines) {
    // Headers: Col1 | Col2 | Col3
    const headerMatch = line.match(/^[Hh]eaders?\s*:\s*(.+)$/)
    if (headerMatch) {
      headers = headerMatch[1].split('|').map(h => h.trim())
      continue
    }
    // Row: val1 | val2 | val3
    const rowMatch = line.match(/^[Rr]ow\s*:\s*(.+)$/)
    if (rowMatch) {
      rows.push(rowMatch[1].split('|').map(c => c.trim()))
      continue
    }
    // Also handle plain pipe-delimited lines (markdown table style)
    if (line.includes('|') && !line.match(/^[-|]+$/)) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean)
      if (headers.length === 0) {
        headers = cells
      } else {
        rows.push(cells)
      }
    }
  }

  if (headers.length === 0) headers = ['Column 1', 'Column 2']
  return { headers, rows }
}

function extractField(body: string, label: string): { value: string; remainder: string } {
  const regex  = new RegExp(`^${label}\\s*:\\s*(.+)`, 'im')
  const match  = body.match(regex)
  if (!match) return { value: '', remainder: body }
  const value    = match[1].trim()
  const remainder = body.replace(match[0], '').trim()
  return { value, remainder }
}

export function parseMarkdownToBlocks(markdown: string): Omit<ContentBlock, 'id' | 'order'>[] {
  if (!markdown.trim()) return []

  const sections = splitSections(markdown)
  const blocks:  Omit<ContentBlock, 'id' | 'order'>[] = []

  for (const section of sections) {
    const blockType = BLOCK_TYPE_MAP[section.typeKey]
    if (!blockType) continue

    const body = section.body.trim()

    switch (blockType) {
      case 'definition': {
        const { value: analogy, remainder } = extractField(body, 'ANALOGY')
        blocks.push({ type: 'definition', title: section.title, body: remainder, analogy: analogy || undefined })
        break
      }

      case 'explanation': {
        const { value: analogy, remainder } = extractField(body, 'ANALOGY')
        blocks.push({ type: 'explanation', title: section.title, body: remainder, analogy: analogy || undefined })
        break
      }

      case 'formula': {
        const { value: breakdown, remainder } = extractField(body, 'BREAKDOWN')
        // First non-empty line is the formula itself
        const formulaLine = remainder.split('\n').find(l => l.trim()) ?? ''
        const rest        = remainder.replace(formulaLine, '').trim()
        blocks.push({
          type:      'formula',
          title:     section.title,
          body:      formulaLine.trim(),
          breakdown: breakdown || (rest || undefined),
        })
        break
      }

      case 'example': {
        const { body: exBody, steps } = parseExample(body)
        blocks.push({ type: 'example', title: section.title, body: exBody, steps })
        break
      }

      case 'table': {
        const tableData = parseTable(body)
        // Store as steps field (jsonb) — same pattern as existing table block
        blocks.push({
          type:  'table',
          title: section.title,
          body:  '',
          steps: tableData as unknown as ContentBlock['steps'],
        })
        break
      }

      case 'keypoint': {
        blocks.push({ type: 'keypoint', title: section.title, body })
        break
      }

      case 'note': {
        blocks.push({ type: 'note', title: section.title, body })
        break
      }

      case 'diagram': {
        const { value: instructions, remainder } = extractField(body, 'INSTRUCTIONS')
        blocks.push({
          type:          'diagram',
          title:         section.title,
          body:          remainder,
          diagramPrompt: instructions || undefined,
        })
        break
      }
    }
  }

  return blocks
}

// ── Validate parsed output ────────────────────────────────────────────────────

export function validateParsedBlocks(blocks: Omit<ContentBlock, 'id' | 'order'>[]): {
  valid:    boolean
  warnings: string[]
} {
  const warnings: string[] = []
  if (blocks.length === 0) warnings.push('No blocks found. Check that headings use the format: ## TYPE: Title')
  if (!blocks.find(b => b.type === 'definition'))  warnings.push('No definition block found.')
  if (!blocks.find(b => b.type === 'explanation')) warnings.push('No explanation block found.')
  if (!blocks.find(b => b.type === 'example'))     warnings.push('No example block found.')
  return { valid: blocks.length > 0, warnings }
}
