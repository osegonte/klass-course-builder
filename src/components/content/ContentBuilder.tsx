import { useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import type { ContentBlock, BlockType, QuestionType, Question } from '../../types/content'
import { useContentBlocks } from '../../hooks/useContentBlocks'
import { useQuestions } from '../../hooks/useQuestions'
import { useFlashcards } from '../../hooks/useFlashcards'
import ContentBlockCard from './ContentBlockCard'
import BlockTypeSelector from './BlockTypeSelector'
import InlineQuestionPicker from './InlineQuestionPicker'
import InlineFlashcardPicker from './InlineFlashcardPicker'
import OverviewPanel from './OverviewPanel'
import GenerateCourse from './GenerateCourse'
import { useTopicRow, useSubtopicRow, useSubtopics, useSubtopicOverview } from '../../hooks/useStructure'

interface Props {
  subtopicId:  string
  subjectId:   string
  topicId?:    string
  subjectName?: string
}

export default function ContentBuilder({ subtopicId, topicId, subjectName }: Props) {
  const { blocks, loading, addBlock, updateBlock, deleteBlock } = useContentBlocks(subtopicId)
  const { questions, addQuestion }  = useQuestions(subtopicId)
  const { flashcards, addFlashcard } = useFlashcards(subtopicId)
  const { topic }                   = useTopicRow(topicId ?? '')
  const { subtopic }                = useSubtopicRow(subtopicId)
  const { subtopics: allSubtopics } = useSubtopics(topicId ?? '')
  const { save: saveOverview }      = useSubtopicOverview(subtopicId)

  const [showSelector,       setShowSelector]        = useState(false)
  const [showQuestionPicker, setShowQuestionPicker]  = useState(false)
  const [showFlashcardPicker,setShowFlashcardPicker] = useState(false)
  const [showGenerate,       setShowGenerate]        = useState(false)

  const chapterNumber = allSubtopics.findIndex(s => s.id === subtopicId) + 1 || undefined
  const totalChapters = allSubtopics.length || undefined

  // Block builder handlers
  const handleSelectType = (type: BlockType) => {
    setShowSelector(false)
    if (type === 'question')  { setShowQuestionPicker(true);  return }
    if (type === 'flashcard') { setShowFlashcardPicker(true); return }
    createBlock(type)
  }

  const createBlock = async (type: BlockType, extra?: Partial<ContentBlock>) => {
    await addBlock({
      id: crypto.randomUUID(), type, title: '', body: '',
      order: blocks.length,
      steps: type === 'example' ? [] : undefined,
      ...extra,
    } as ContentBlock)
  }

  const handlePickExistingQuestion = async (questionId: string) => {
    await createBlock('question', { questionId })
    setShowQuestionPicker(false)
  }

  const handleCreateNewQuestion = async (type: QuestionType) => {
    const q = {
      id: crypto.randomUUID(), type, questionText: '',
      options: type === 'mcq' || type === 'multiselect'
        ? [{ id: crypto.randomUUID(), text: '' }, { id: crypto.randomUUID(), text: '' }]
        : [],
      correctAnswer: '', hint: '', status: 'draft' as const,
      isMockQuestion: false, order: questions.length,
    }
    await addQuestion(q)
    await createBlock('question', { questionId: q.id })
    setShowQuestionPicker(false)
  }

  const handlePickExistingFlashcard = async (flashcardId: string) => {
    await createBlock('flashcard', { flashcardId })
    setShowFlashcardPicker(false)
  }

  const handleCreateNewFlashcard = async () => {
    const card = { id: crypto.randomUUID(), front: '', back: '', order: flashcards.length }
    await addFlashcard(card)
    await createBlock('flashcard', { flashcardId: card.id })
    setShowFlashcardPicker(false)
  }

  // AI generation handlers
  const handleAcceptBlocks = async (incoming: Omit<ContentBlock, 'id' | 'order'>[]) => {
    for (let i = 0; i < incoming.length; i++) {
      await addBlock({ ...incoming[i], id: crypto.randomUUID(), order: blocks.length + i } as ContentBlock)
    }
  }

  const handleAcceptQuestions = async (incoming: Omit<Question, 'id' | 'order'>[]) => {
    for (let i = 0; i < incoming.length; i++) {
      const q: Question = { ...incoming[i], id: crypto.randomUUID(), order: questions.length + i }
      await addQuestion(q)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <p className="text-sm text-gray-400">Loading…</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">

      {/* Overview panel */}
      <OverviewPanel
        context="subtopic"
        topicId={topicId ?? ''}
        topicName={subtopic?.name ?? ''}
        subjectName={subjectName}
        data={{
          overview:   (subtopic as any)?.overview   ?? '',
          objectives: (subtopic as any)?.objectives ?? [],
        }}
        onSave={saveOverview}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Content Blocks</h2>
          <p className="text-xs text-gray-500 mt-0.5">Build the lesson block by block.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors"
        >
          <Sparkles size={12} />
          Generate with AI
        </button>
      </div>

      {/* Empty state */}
      {blocks.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded p-12 text-center mb-4">
          <p className="text-sm text-gray-500 mb-1">No content blocks yet.</p>
          <p className="text-xs text-gray-400 mb-6">Build manually or let Professor KLASS generate the lesson.</p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowSelector(true)}
              className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              <Plus size={13} /> Add Block
            </button>
            <button
              type="button"
              onClick={() => setShowGenerate(true)}
              className="flex items-center gap-1.5 text-xs border border-gray-300 text-gray-600 px-4 py-2 rounded hover:border-gray-400 transition-colors"
            >
              <Sparkles size={12} /> Generate with AI
            </button>
          </div>
        </div>
      )}

      {/* Blocks */}
      <div className="flex flex-col gap-3">
        {blocks.map(block => (
          <ContentBlockCard
            key={block.id}
            block={block}
            question={block.questionId   ? questions.find(q => q.id === block.questionId)   : undefined}
            flashcard={block.flashcardId ? flashcards.find(f => f.id === block.flashcardId) : undefined}
            onChange={updateBlock}
            onDelete={deleteBlock}
          />
        ))}
      </div>

      {blocks.length > 0 && (
        <button
          type="button"
          onClick={() => setShowSelector(true)}
          className="mt-4 w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 hover:border-gray-500 text-gray-400 hover:text-gray-600 text-xs py-3 rounded transition-colors"
        >
          <Plus size={13} /> Add Block
        </button>
      )}

      {/* Modals */}
      {showSelector && (
        <BlockTypeSelector onSelect={handleSelectType} onClose={() => setShowSelector(false)} />
      )}
      {showQuestionPicker && (
        <InlineQuestionPicker
          questions={questions}
          onPickExisting={handlePickExistingQuestion}
          onCreateNew={handleCreateNewQuestion}
          onClose={() => setShowQuestionPicker(false)}
        />
      )}
      {showFlashcardPicker && (
        <InlineFlashcardPicker
          flashcards={flashcards}
          onPickExisting={handlePickExistingFlashcard}
          onCreateNew={handleCreateNewFlashcard}
          onClose={() => setShowFlashcardPicker(false)}
        />
      )}
      {showGenerate && (
        <GenerateCourse
          params={{
            level:         'subtopic',
            name:          subtopic?.name    ?? '',
            topicName:     topic?.name       ?? '',
            subjectName,
            overview:      (subtopic as any)?.overview   ?? '',
            objectives:    (subtopic as any)?.objectives ?? [],
            chapterNumber,
            totalChapters,
          }}
          onAcceptBlocks={handleAcceptBlocks}
          onAcceptQuestions={handleAcceptQuestions}
          onClose={() => setShowGenerate(false)}
        />
      )}
    </div>
  )
}