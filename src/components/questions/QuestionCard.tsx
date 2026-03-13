import { useState } from 'react'
import { Trash2, Plus, X } from 'lucide-react'
import type { Question, QuestionOption } from '../../types/content'

interface Props {
  question: Question
  index: number
  onChange: (updated: Question) => void
  onDelete: (id: string) => void
}

const typeLabels: Record<string, string> = {
  mcq: 'MCQ', truefalse: 'True / False', fillingap: 'Fill in Gap', multiselect: 'Multi-select',
}

const inputClass = "w-full text-sm text-gray-900 placeholder-gray-300 border border-gray-200 rounded p-2.5 outline-none focus:border-gray-400 transition-colors bg-white"

export default function QuestionCard({ question, index, onChange, onDelete }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const update = (fields: Partial<Question>) => onChange({ ...question, ...fields })

  const addOption = () => {
    const newOption: QuestionOption = { id: crypto.randomUUID(), text: '' }
    update({ options: [...question.options, newOption] })
  }

  const updateOption = (id: string, text: string) =>
    update({ options: question.options.map(o => o.id === id ? { ...o, text } : o) })

  const deleteOption = (id: string) =>
    update({ options: question.options.filter(o => o.id !== id) })

  return (
    <div className="bg-white border border-gray-200 rounded overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 bg-stone-50">
        <span className="text-xs text-gray-400 w-5 shrink-0">Q{index + 1}</span>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-widest w-20 shrink-0">
          {typeLabels[question.type]}
        </span>
        <span className="flex-1 text-sm text-gray-400 truncate">
          {question.questionText || 'New question...'}
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded border ${
          question.status === 'exported' ? 'border-gray-300 text-gray-400'
          : question.status === 'ready' ? 'border-gray-900 text-gray-900'
          : 'border-gray-200 text-gray-300'
        }`}>
          {question.status}
        </span>
        <button onClick={() => setCollapsed(!collapsed)} className="text-xs text-gray-400 hover:text-gray-600 ml-1">
          {collapsed ? 'Show' : 'Hide'}
        </button>
        <button onClick={() => onDelete(question.id)} className="text-gray-300 hover:text-red-400 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 flex flex-col gap-3">

          <textarea
            className={inputClass}
            placeholder="Write your question here..."
            value={question.questionText}
            onChange={e => update({ questionText: e.target.value })}
            rows={3}
          />

          {(question.type === 'mcq' || question.type === 'multiselect') && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-400">Options — click circle to mark correct</p>
              {question.options.map(option => (
                <div key={option.id} className="flex items-center gap-2">
                  <button
                    onClick={() => update({ correctAnswer: option.id })}
                    className={`w-4 h-4 rounded-full border shrink-0 transition-colors ${
                      question.correctAnswer === option.id
                        ? 'bg-gray-900 border-gray-900'
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                  />
                  <input
                    className={inputClass}
                    placeholder={`Option ${question.options.indexOf(option) + 1}`}
                    value={option.text}
                    onChange={e => updateOption(option.id, e.target.value)}
                  />
                  <button onClick={() => deleteOption(option.id)} className="text-gray-300 hover:text-red-400">
                    <X size={13} />
                  </button>
                </div>
              ))}
              <button onClick={addOption} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors w-fit">
                <Plus size={12} />Add Option
              </button>
            </div>
          )}

          {question.type === 'truefalse' && (
            <div className="flex gap-2">
              {['True', 'False'].map(val => (
                <button
                  key={val}
                  onClick={() => update({ correctAnswer: val })}
                  className={`px-5 py-2 rounded border text-sm transition-colors ${
                    question.correctAnswer === val
                      ? 'bg-gray-900 border-gray-900 text-white'
                      : 'border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          )}

          {question.type === 'fillingap' && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-gray-400">Use ___ in the question text to mark the gap</p>
              <input
                className={inputClass}
                placeholder="Correct answer..."
                value={question.correctAnswer}
                onChange={e => update({ correctAnswer: e.target.value })}
              />
            </div>
          )}

          <textarea
            className={inputClass}
            placeholder="Explanation shown after student answers (optional)..."
            value={question.hint}
            onChange={e => update({ hint: e.target.value })}
            rows={2}
          />

          {/* Mark ready toggle */}
          {question.status === 'draft' && (
            <div className="flex justify-end">
              <button
                onClick={() => update({ status: 'ready' })}
                className="text-xs border border-gray-900 text-gray-900 px-3 py-1 rounded hover:bg-gray-900 hover:text-white transition-colors"
              >
                Mark as Ready
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  )
}