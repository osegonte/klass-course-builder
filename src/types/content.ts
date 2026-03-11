export type BlockType = 'definition' | 'explanation' | 'formula' | 'example' | 'keypoint' | 'note' | 'question' | 'flashcard'

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
  steps?: ExampleStep[]
  questionId?: string
  flashcardId?: string
  order: number
}

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
  explanation: string
  imageUrl?: string
  order: number
}

export interface Flashcard {
  id: string
  front: string
  back: string
  order: number
}