import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Question, QuestionType } from '../../types/content'
import { useQuestions } from '../../hooks/useQuestions'
import QuestionCard from './QuestionCard'
import QuestionTypeSelector from './QuestionTypeSelector'

interface Props { subtopicId: string }

export default function QuestionBuilder({ subtopicId }: Props) {
  const { questions, loading, addQuestion, updateQuestion, deleteQuestion } = useQuestions(subtopicId)
  const [showTypeSelector, setShowTypeSelector] = useState(false)

  const handleSelectType = async (type: QuestionType) => {
    setShowTypeSelector(false)
    const newQuestion: Question = {
      id:             crypto.randomUUID(),
      type,
      questionText:   '',
      options:        type === 'mcq' || type === 'multiselect'
        ? [
            { id: crypto.randomUUID(), text: '' },
            { id: crypto.randomUUID(), text: '' },
            { id: crypto.randomUUID(), text: '' },
            { id: crypto.randomUUID(), text: '' },
          ]
        : [],
      correctAnswer:  '',
      hint:           '',
      status:         'draft',
      isMockQuestion: false,
      order:          questions.length,
    }
    await addQuestion(newQuestion)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <p className="text-sm text-gray-400">Loading…</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Questions</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {questions.length > 0
              ? `${questions.length} question${questions.length !== 1 ? 's' : ''} — draft, mark ready when done`
              : 'Add questions to test understanding of this subtopic.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowTypeSelector(true)}
          className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
        >
          <Plus size={12} /> Add Question
        </button>
      </div>

      {questions.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded p-10 text-center">
          <p className="text-sm text-gray-500 mb-1">No questions yet.</p>
          <p className="text-xs text-gray-400 mb-5">Add MCQ, true/false, or fill-in-the-gap questions.</p>
          <button
            type="button"
            onClick={() => setShowTypeSelector(true)}
            className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 mx-auto"
          >
            <Plus size={12} /> Add Question
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            onChange={updateQuestion}
            onDelete={deleteQuestion}
          />
        ))}
      </div>

      {showTypeSelector && (
        <QuestionTypeSelector
          onSelect={handleSelectType}
          onClose={() => setShowTypeSelector(false)}
        />
      )}
    </div>
  )
}