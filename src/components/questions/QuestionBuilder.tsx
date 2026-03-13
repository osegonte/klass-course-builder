import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Question, QuestionType } from '../../types/content'
import { useQuestions } from '../../hooks/useQuestions'
import QuestionCard from './QuestionCard'
import QuestionTypeSelector from './QuestionTypeSelector'

interface Props { subtopicId: string; subjectId: string }

export default function QuestionBuilder({ subtopicId, subjectId }: Props) {
  const { questions, loading, addQuestion, updateQuestion, deleteQuestion } = useQuestions(subtopicId, subjectId)
  const [showSelector, setShowSelector] = useState(false)

  const handleAdd = async (type: QuestionType) => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      type,
      questionText: '',
      options: type === 'mcq' || type === 'multiselect'
        ? [{ id: crypto.randomUUID(), text: '' }, { id: crypto.randomUUID(), text: '' }]
        : [],
      correctAnswer: '',
      hint: '',
      status: 'draft',
      order: questions.length,
    }
    await addQuestion(newQuestion)
    setShowSelector(false)
  }

  if (loading) return <div className="flex items-center justify-center h-48"><p className="text-sm text-gray-400">Loading...</p></div>

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">

      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Questions</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {questions.length} question{questions.length !== 1 ? 's' : ''} · questions sync to Jamsulator automatically when ready
          </p>
        </div>
        <button
          onClick={() => setShowSelector(true)}
          className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
        >
          <Plus size={13} />
          Add Question
        </button>
      </div>

      {questions.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded p-12 text-center">
          <p className="text-sm text-gray-500 mb-4">No questions yet.</p>
          <button
            onClick={() => setShowSelector(true)}
            className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors mx-auto"
          >
            <Plus size={13} />
            Add First Question
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            onChange={updateQuestion}
            onDelete={deleteQuestion}
          />
        ))}
      </div>

      {questions.length > 0 && (
        <button
          onClick={() => setShowSelector(true)}
          className="mt-4 w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 hover:border-gray-500 text-gray-400 hover:text-gray-600 text-xs py-3 rounded transition-colors"
        >
          <Plus size={13} />
          Add Question
        </button>
      )}

      {showSelector && (
        <QuestionTypeSelector onSelect={handleAdd} onClose={() => setShowSelector(false)} />
      )}
    </div>
  )
}