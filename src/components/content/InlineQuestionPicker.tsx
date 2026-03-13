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
  mcq: 'MCQ', truefalse: 'True/False', fillingap: 'Fill in Gap', multiselect: 'Multi-select',
}
const questionTypes: QuestionType[] = ['mcq', 'truefalse', 'fillingap', 'multiselect']

export default function InlineQuestionPicker({ questions, onPickExisting, onCreateNew, onClose }: Props) {
  const [mode, setMode] = useState<'pick' | 'create'>('pick')

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-lg p-5 w-[440px] max-h-[80vh] flex flex-col shadow-lg" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Question Block</h3>

        <div className="flex gap-1.5 mb-4">
          {(['pick', 'create'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 rounded text-xs font-medium border transition-colors ${
                mode === m ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {m === 'pick' ? 'Pick Existing' : 'Create New'}
            </button>
          ))}
        </div>

        {mode === 'pick' && (
          <div className="flex flex-col gap-1.5 overflow-y-auto">
            {questions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400 mb-2">No questions in bank yet.</p>
                <button onClick={() => setMode('create')} className="text-xs text-gray-600 underline">Create one</button>
              </div>
            ) : (
              questions.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => onPickExisting(q.id)}
                  className="flex items-start gap-3 p-3 rounded border border-gray-200 hover:border-gray-400 text-left transition-colors"
                >
                  <span className="text-xs text-gray-400 shrink-0 mt-0.5">Q{index + 1}</span>
                  <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wide">{typeLabels[q.type]}</span>
                    <p className="text-sm text-gray-700 mt-0.5">{q.questionText || 'Untitled question'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {mode === 'create' && (
          <div className="flex flex-col gap-1.5">
            {questionTypes.map(type => (
              <button
                key={type}
                onClick={() => onCreateNew(type)}
                className="flex items-center gap-2 p-3 rounded border border-gray-200 hover:border-gray-400 text-left transition-colors"
              >
                <Plus size={13} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700">{typeLabels[type]}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}