import { useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { useParams } from 'react-router-dom'
import type { ContentBlock, BlockType, QuestionType } from '../../types/content'
import { useContentBlocks } from '../../hooks/useContentBlocks'
import { useQuestions } from '../../hooks/useQuestions'
import { useFlashcards } from '../../hooks/useFlashcards'
import ContentBlockCard from './ContentBlockCard'
import BlockTypeSelector from './BlockTypeSelector'
import InlineQuestionPicker from './InlineQuestionPicker'
import InlineFlashcardPicker from './InlineFlashcardPicker'
import GenerateFromText from './GenerateFromText'

export default function ContentBuilder() {
  const { topicId } = useParams<{ topicId: string }>()
  const { blocks, loading, addBlock, updateBlock, deleteBlock } = useContentBlocks(topicId!)
  const { questions, addQuestion } = useQuestions(topicId!)
  const { flashcards, addFlashcard } = useFlashcards(topicId!)

  const [showSelector, setShowSelector] = useState(false)
  const [showQuestionPicker, setShowQuestionPicker] = useState(false)
  const [showFlashcardPicker, setShowFlashcardPicker] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)

  const handleSelectType = (type: BlockType) => {
    setShowSelector(false)
    if (type === 'question') {
      setShowQuestionPicker(true)
      return
    }
    if (type === 'flashcard') {
      setShowFlashcardPicker(true)
      return
    }
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
      explanation: '',
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
    const newCard = {
      id: crypto.randomUUID(),
      front: '',
      back: '',
      order: flashcards.length,
    }
    await addFlashcard(newCard)
    await createBlock('flashcard', { flashcardId: newCard.id })
    setShowFlashcardPicker(false)
  }

  const handleGenerate = async (generatedBlocks: ContentBlock[]) => {
    for (const block of generatedBlocks) {
      await addBlock(block)
    }
    setShowGenerate(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-white text-xl font-semibold">Content Builder</h2>
          <p className="text-gray-500 text-sm mt-1">
            Build the learning experience block by block. Add content, questions, and flashcards in sequence.
          </p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm px-3 py-2 rounded-lg transition-colors shrink-0"
        >
          <Sparkles size={14} className="text-purple-400" />
          Generate from text
        </button>
      </div>

      {/* Empty State */}
      {blocks.length === 0 && (
        <div className="border border-dashed border-gray-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <div className="text-gray-600 text-sm mb-2">No blocks yet. Start building your topic.</div>
          <div className="text-gray-700 text-xs mb-6">Add blocks manually or generate from text using AI.</div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSelector(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Add First Block
            </button>
            <button
              onClick={() => setShowGenerate(true)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <Sparkles size={14} className="text-purple-400" />
              Generate from text
            </button>
          </div>
        </div>
      )}

      {/* Block List */}
      <div className="flex flex-col gap-4">
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

      {/* Add Block Button */}
      {blocks.length > 0 && (
        <button
          onClick={() => setShowSelector(true)}
          className="mt-6 w-full flex items-center justify-center gap-2 border border-dashed border-gray-800 hover:border-purple-500 text-gray-600 hover:text-purple-400 text-sm py-3 rounded-xl transition-colors"
        >
          <Plus size={16} />
          Add Block
        </button>
      )}

      {/* Modals */}
      {showSelector && (
        <BlockTypeSelector
          onSelect={handleSelectType}
          onClose={() => setShowSelector(false)}
        />
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
        <GenerateFromText
          onGenerate={handleGenerate}
          onClose={() => setShowGenerate(false)}
          existingCount={blocks.length}
        />
      )}

    </div>
  )
}