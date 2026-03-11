import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Question, QuestionType } from '../../types/content'

interface Props {
  questions: Question[]
  onPickExisting: (questionId: string) => void
  onCreateNew: (type: QuestionType) => void
  onClose: () => void
}

const typeLabels: Record<string, string> = {
  mcq: 'MCQ',
  truefalse: 'True / False',
  fillingap: 'Fill in the Gap',
  multiselect: 'Multi-select',
}

const questionTypes: QuestionType[] = ['mcq', 'truefalse', 'fillingap', 'multiselect']

export default function InlineQuestionPicker({ questions, onPickExisting, onCreateNew, onClose }: Props) {
  const [mode, setMode] = useState<'pick' | 'create'>('pick')

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-[480px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>

        <h3 className="text-white font-semibold mb-4">Add Question Block</h3>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('pick')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'pick'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Pick from Bank
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'create'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Create New
          </button>
        </div>

        {/* Pick from Bank */}
        {mode === 'pick' && (
          <div className="flex flex-col gap-2 overflow-y-auto">
            {questions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 text-sm mb-3">No questions in bank yet.</p>
                <button
                  onClick={() => setMode('create')}
                  className="text-purple-400 text-sm hover:text-purple-300"
                >
                  Create one instead
                </button>
              </div>
            ) : (
              questions.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => onPickExisting(q.id)}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-800 hover:border-purple-500/50 hover:bg-purple-500/5 text-left transition-colors"
                >
                  <span className="text-xs text-gray-600 mt-0.5 shrink-0">Q{index + 1}</span>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">{typeLabels[q.type]}</span>
                    <p className="text-sm text-gray-300 mt-0.5">
                      {q.questionText || 'Untitled question'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Create New */}
        {mode === 'create' && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-500 mb-1">Select question type to create:</p>
            {questionTypes.map(type => (
              <button
                key={type}
                onClick={() => onCreateNew(type)}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-purple-500/50 hover:bg-purple-500/5 text-left transition-colors"
              >
                <Plus size={14} className="text-purple-400 shrink-0" />
                <span className="text-sm text-white">{typeLabels[type]}</span>
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}