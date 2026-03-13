// ── Block types ───────────────────────────────────────────────────────────────

export type BlockType = 'definition' | 'explanation' | 'formula' | 'example' | 'keypoint' | 'note' | 'question' | 'flashcard' | 'diagram'

export interface ExampleStep {
  id: string
  expression: string
  talkingPoint: string
}

export interface ContentBlock {
  id: string
  type: BlockType
  title: string
  body: string
  analogy?: string
  breakdown?: string
  diagramPrompt?: string
  steps?: ExampleStep[]
  questionId?: string
  flashcardId?: string
  order: number
}

// ── Question types ────────────────────────────────────────────────────────────

export type QuestionType = 'mcq' | 'truefalse' | 'fillingap' | 'multiselect'

export interface QuestionOption {
  id: string
  text: string
}

export interface Question {
  id: string
  type: QuestionType
  questionText: string
  options: QuestionOption[]
  correctAnswer: string
  hint: string
  imageUrl?: string
  status: 'draft' | 'ready' | 'exported'
  order: number
}

// ── Flashcard types ───────────────────────────────────────────────────────────

export interface Flashcard {
  id: string
  front: string
  back: string
  order: number
}

// ── Project / catalog types ───────────────────────────────────────────────────

export interface CSProject {
  id: string
  name: string
  source: 'jamsulator' | 'manual' | 'school'
  sourceRef?: string
  status: 'active' | 'archived'
  createdAt: string
}

export interface CSTopic {
  id: string
  projectId: string
  name: string
  objectives: string[]
  externalId?: string
  order: number
}

export interface CSSubtopic {
  id: string
  topicId: string
  projectId: string
  name: string
  externalId?: string
  order: number
}

// ── Import / export types ─────────────────────────────────────────────────────

export interface CSImport {
  id: string
  source: string
  payload: {
    subject: string
    subject_id?: string
    topics: Array<{
      id: string
      name: string
      objectives?: string[]
      subtopics: Array<{ id: string; name: string }>
    }>
  }
  status: 'pending' | 'processed' | 'ignored'
  createdAt: string
}