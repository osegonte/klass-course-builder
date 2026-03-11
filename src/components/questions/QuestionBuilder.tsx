import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useParams } from 'react-router-dom'
import type { Question, QuestionType } from '../../types/content'
import { useQuestions } from '../../hooks/useQuestions'
import QuestionCard from './QuestionCard'
import QuestionTypeSelector from './QuestionTypeSelector'

export default function QuestionBuilder() {
  const { topicId } = useParams<{ topicId: string }>()
  const { questions, loading, addQuestion, updateQuestion, deleteQuestion } = useQuestions(topicId!)
  const [showSelector, setShowSelector] = useState(false)

  const handleAdd = async (type: QuestionType) => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      type,
      questionText: '',
      options: type === 'mcq' || type === 'multiselect'
        ? [
            { id: crypto.randomUUID(), text: '' },
            { id: crypto.randomUUID(), text: '' },
          ]
        : [],
      correctAnswer: '',
      explanation: '',
      order: questions.length,
    }
    await addQuestion(newQuestion)
    setShowSelector(false)
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

      <div className="mb-8">
        <h2 className="text-white text-xl font-semibold">Question Builder</h2>
        <p className="text-gray-500 text-sm mt-1">
          Create questions for this topic. You'll place them into the content flow in the Placement section.
        </p>
      </div>

      {questions.length === 0 && (
        <div className="border border-dashed border-gray-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <div className="text-gray-600 text-sm mb-4">No questions yet. Start building your question bank.</div>
          <button
            onClick={() => setShowSelector(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add First Question
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
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
          className="mt-6 w-full flex items-center justify-center gap-2 border border-dashed border-gray-800 hover:border-purple-500 text-gray-600 hover:text-purple-400 text-sm py-3 rounded-xl transition-colors"
        >
          <Plus size={16} />
          Add Question
        </button>
      )}

      {showSelector && (
        <QuestionTypeSelector
          onSelect={handleAdd}
          onClose={() => setShowSelector(false)}
        />
      )}

    </div>
  )
}