// ── Block types ───────────────────────────────────────────────────────────────

export type BlockType =
  | 'definition'
  | 'explanation'
  | 'formula'
  | 'example'
  | 'keypoint'
  | 'note'
  | 'diagram'
  | 'question'
  | 'table'
  | 'flashcard'

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
  subtopicId?: string
  subjectId?: string
  type: QuestionType
  questionText: string
  options: QuestionOption[]
  correctAnswer: string
  hint: string
  imageUrl?: string
  status: 'draft' | 'ready' | 'exported'
  isMockQuestion: boolean
  order: number
}

// ── Flashcard types ───────────────────────────────────────────────────────────

export interface Flashcard {
  id: string
  front: string
  back: string
  order: number
}

// ── Subject / Topic / Subtopic types ─────────────────────────────────────────

export type CourseStatus = 'draft' | 'in_progress' | 'complete' | 'published'

export interface CSSubject {
  id: string
  name: string
  description?: string
  isActive: boolean
  isPriority: boolean
  createdAt: string
  updatedAt: string
}

export interface CSTopic {
  id: string
  subjectId: string
  name: string
  description?: string
  status: CourseStatus
  introComplete: boolean
  objectives: string[]
  topicOrder: number
  createdAt: string
  updatedAt: string
}

export interface CSSubtopic {
  id: string
  topicId: string
  subjectId: string
  name: string
  description?: string
  objectives: string[]
  subtopicOrder: number
  createdAt: string
  updatedAt: string
}

// ── Topic intro ───────────────────────────────────────────────────────────────

export interface CSTopicIntro {
  id: string
  topicId: string
  overview: string
  whyItMatters: string
  prerequisites: string
  sourceTextbook: string
  sourceTranscript: string
  sourceExtra: string
  isComplete: boolean
  updatedAt: string
}

// ── Topic prerequisites ───────────────────────────────────────────────────────

export interface CSTopicPrerequisite {
  id: string
  topicId: string
  requiresTopicId: string
  requiresTopicName: string   // joined from topics table
  requiresSubjectName: string // joined from subjects table
  note?: string
}

// ── Export types ──────────────────────────────────────────────────────────────

export type ExportFormat = 'jamsulator_json' | 'generic_json' | 'scorm'

export interface ConsumerExport {
  id: string
  subjectId?: string
  topicId?: string
  format: ExportFormat
  consumerName?: string
  questionCount: number
  exportedAt: string
}
// ── Table block data ──────────────────────────────────────────────────────────
// Stored as JSON in the `steps` field (reused as generic jsonb)
// Format: { headers: string[], rows: string[][] }
export interface TableData {
  headers: string[]
  rows:    string[][]
}