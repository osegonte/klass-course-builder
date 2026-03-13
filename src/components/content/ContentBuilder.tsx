import { useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import type { ContentBlock, BlockType, QuestionType } from '../../types/content'
import { useContentBlocks } from '../../hooks/useContentBlocks'
import { useQuestions } from '../../hooks/useQuestions'
import { useFlashcards } from '../../hooks/useFlashcards'
import ContentBlockCard from './ContentBlockCard'
import BlockTypeSelector from './BlockTypeSelector'
import InlineQuestionPicker from './InlineQuestionPicker'
import InlineFlashcardPicker from './InlineFlashcardPicker'
import GenerateFromText from './GenerateFromText'
import AILessonGenerator from './AILessonGenerator'

import { useTopicRow, useSubtopicRow, useSubtopicsFromStructure } from '../../hooks/useStructure'
import { useTopicIntro } from '../../hooks/useTopicIntro'
import type { Sources } from './SourcesPanel'

interface Props { subtopicId: string; subjectId: string; topicId?: string; subjectName?: string }

export default function ContentBuilder({ subtopicId, subjectId, topicId, subjectName }: Props) {
  const { blocks, loading, addBlock, updateBlock, deleteBlock } = useContentBlocks(subtopicId, subjectId)
  const { questions, addQuestion } = useQuestions(subtopicId, subjectId)
  const { flashcards, addFlashcard } = useFlashcards(subtopicId, subjectId)
  const { topic } = useTopicRow(topicId ?? '')
  const { subtopic } = useSubtopicRow(subtopicId)
  const { intro: topicIntro } = useTopicIntro(topicId ?? '', subjectId)
  const { subtopics: allSubtopics } = useSubtopicsFromStructure(topicId ?? '')

  const topicSources: Sources | undefined = topicIntro ? {
    transcript: topicIntro.source_transcript ?? '',
    textbook: topicIntro.source_textbook ?? '',
    extra: topicIntro.source_extra ?? '',
  } : undefined

  const topicContext = topicIntro && (topicIntro.overview || topicIntro.why_it_matters) ? {
    overview: topicIntro.overview,
    why_it_matters: topicIntro.why_it_matters,
    prerequisites: topicIntro.prerequisites,
  } : undefined

  const chapterNumber = allSubtopics.findIndex(s => s.id === subtopicId) + 1 || undefined
  const totalChapters = allSubtopics.length || undefined

  const [showSelector, setShowSelector] = useState(false)
  const [showQuestionPicker, setShowQuestionPicker] = useState(false)
  const [showFlashcardPicker, setShowFlashcardPicker] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)

  const handleAcceptAIBlocks = async (incoming: Omit<ContentBlock, 'id' | 'order'>[]) => {
    for (let i = 0; i < incoming.length; i++) {
      await addBlock({
        ...incoming[i],
        id: crypto.randomUUID(),
        order: blocks.length + i,
      } as ContentBlock)
    }
    setShowAIGenerator(false)
  }

  const handleSelectType = (type: BlockType) => {
    setShowSelector(false)
    if (type === 'question') { setShowQuestionPicker(true); return }
    if (type === 'flashcard') { setShowFlashcardPicker(true); return }
    createBlock(type)
  }

  const createBlock = async (type: BlockType, extra?: Partial<ContentBlock>) => {
    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      type,
      title: '',
      body: '',
      order: blocks.length,
      steps: type === 'example' ? [] : undefined,
      ...extra,
    }
    await addBlock(newBlock)
  }

  const handlePickExistingQuestion = async (questionId: string) => {
    await createBlock('question', { questionId })
    setShowQuestionPicker(false)
  }

  const handleCreateNewQuestion = async (type: QuestionType) => {
    const newQuestion = {
      id: crypto.randomUUID(),
      type,
      questionText: '',
      options: type === 'mcq' || type === 'multiselect'
        ? [{ id: crypto.randomUUID(), text: '' }, { id: crypto.randomUUID(), text: '' }]
        : [],
      correctAnswer: '',
      hint: '',
      status: 'draft' as const,
      order: questions.length,
    }
    await addQuestion(newQuestion)
    await createBlock('question', { questionId: newQuestion.id })
    setShowQuestionPicker(false)
  }

  const handlePickExistingFlashcard = async (flashcardId: string) => {
    await createBlock('flashcard', { flashcardId })
    setShowFlashcardPicker(false)
  }

  const handleCreateNewFlashcard = async () => {
    const newCard = { id: crypto.randomUUID(), front: '', back: '', order: flashcards.length }
    await addFlashcard(newCard)
    await createBlock('flashcard', { flashcardId: newCard.id })
    setShowFlashcardPicker(false)
  }

  const handleGenerate = async (generatedBlocks: ContentBlock[]) => {
    for (const block of generatedBlocks) await addBlock(block)
    setShowGenerate(false)
  }

  if (loading) return <div className="flex items-center justify-center h-48"><p className="text-sm text-gray-400">Loading...</p></div>

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Content</h2>
          <p className="text-xs text-gray-500 mt-0.5">Build the lesson block by block.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAIGenerator(v => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors border ${
              showAIGenerator
                ? 'bg-gray-900 text-white border-gray-900'
                : 'text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            <Sparkles size={12} />
            AI Generate
          </button>
        </div>
      </div>

      {/* Empty */}
      {blocks.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded p-12 text-center">
          <p className="text-sm text-gray-500 mb-1">No content blocks yet.</p>
          <p className="text-xs text-gray-400 mb-6">Add blocks manually or generate from source text.</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowSelector(true)}
              className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              <Plus size={13} />
              Add Block
            </button>
            <button
              onClick={() => setShowAIGenerator(true)}
              className="flex items-center gap-1.5 text-xs border border-gray-300 text-gray-600 px-4 py-2 rounded hover:border-gray-400 transition-colors"
            >
              <Sparkles size={12} />
              AI Generate
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
            question={block.questionId ? questions.find(q => q.id === block.questionId) : undefined}
            flashcard={block.flashcardId ? flashcards.find(f => f.id === block.flashcardId) : undefined}
            onChange={updateBlock}
            onDelete={deleteBlock}
          />
        ))}
      </div>

      {blocks.length > 0 && (
        <button
          onClick={() => setShowSelector(true)}
          className="mt-4 w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 hover:border-gray-500 text-gray-400 hover:text-gray-600 text-xs py-3 rounded transition-colors"
        >
          <Plus size={13} />
          Add Block
        </button>
      )}

      {showSelector && <BlockTypeSelector onSelect={handleSelectType} onClose={() => setShowSelector(false)} />}
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
        <GenerateFromText
          onGenerate={handleGenerate}
          onClose={() => setShowGenerate(false)}
          existingCount={blocks.length}
        />
      )}

      {showAIGenerator && (
        <div className="mt-6">
          <AILessonGenerator
            subtopicName={subtopic?.name ?? ''}
            topicName={topic?.name ?? ''}
            subjectName={subjectName}
            objectives={topic?.objectives ?? []}
            topicSources={topicSources}
            topicContext={topicContext}
            chapterNumber={chapterNumber}
            totalChapters={totalChapters}
            onAcceptBlocks={handleAcceptAIBlocks}
            onClose={() => setShowAIGenerator(false)}
          />
        </div>
      )}
    </div>
  )
}