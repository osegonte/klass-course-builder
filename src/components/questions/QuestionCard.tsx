import { useState } from 'react'
import { Trash2, Plus, X, ImageIcon } from 'lucide-react'
import type { Question, QuestionOption } from '../../types/content'

interface Props {
  question: Question
  index: number
  onChange: (updated: Question) => void
  onDelete: (id: string) => void
}

const typeLabels: Record<string, string> = {
  mcq: 'MCQ',
  truefalse: 'True / False',
  fillingap: 'Fill in the Gap',
  multiselect: 'Multi-select',
}

const typeBadge: Record<string, string> = {
  mcq: 'bg-purple-500/20 text-purple-300',
  truefalse: 'bg-gray-700 text-gray-300',
  fillingap: 'bg-purple-400/10 text-purple-400',
  multiselect: 'bg-gray-600/30 text-gray-300',
}

export default function QuestionCard({ question, index, onChange, onDelete }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const update = (fields: Partial<Question>) => {
    onChange({ ...question, ...fields })
  }

  const addOption = () => {
    const newOption: QuestionOption = {
      id: crypto.randomUUID(),
      text: '',
    }
    update({ options: [...question.options, newOption] })
  }

  const updateOption = (id: string, text: string) => {
    update({
      options: question.options.map(o => o.id === id ? { ...o, text } : o)
    })
  }

  const deleteOption = (id: string) => {
    update({ options: question.options.filter(o => o.id !== id) })
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <span className="text-xs text-gray-600 w-5">Q{index + 1}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeBadge[question.type]}`}>
          {typeLabels[question.type]}
        </span>
        <span className="flex-1 text-sm text-gray-400 truncate">
          {question.questionText || 'New question...'}
        </span>
        <button onClick={() => setCollapsed(!collapsed)} className="text-gray-600 hover:text-gray-400 text-xs">
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
        <button onClick={() => onDelete(question.id)} className="text-gray-600 hover:text-red-400 transition-colors">
          <Trash2 size={15} />
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 flex flex-col gap-4">

          {/* Question Text */}
          <textarea
            className="w-full bg-gray-800 text-white text-sm rounded-lg p-3 placeholder-gray-600 outline-none resize-none border border-gray-700 focus:border-gray-500 min-h-[80px]"
            placeholder="Write your question here..."
            value={question.questionText}
            onChange={e => update({ questionText: e.target.value })}
          />

          {/* Image upload placeholder */}
          <button className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-400 transition-colors w-fit">
            <ImageIcon size={14} />
            Attach image (coming soon)
          </button>

          {/* MCQ / Multi-select options */}
          {(question.type === 'mcq' || question.type === 'multiselect') && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-500">Options — click the circle to mark correct answer</p>
              {question.options.map(option => (
                <div key={option.id} className="flex items-center gap-2">
                  <button
                    onClick={() => update({ correctAnswer: option.id })}
                    className={`w-4 h-4 rounded-full border shrink-0 transition-colors ${
                      question.correctAnswer === option.id
                        ? 'bg-purple-500 border-purple-500'
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                  />
                  <input
                    className="flex-1 bg-gray-800 text-white text-sm rounded-md p-2 placeholder-gray-600 outline-none border border-gray-700 focus:border-gray-500"
                    placeholder={`Option ${question.options.indexOf(option) + 1}`}
                    value={option.text}
                    onChange={e => updateOption(option.id, e.target.value)}
                  />
                  <button onClick={() => deleteOption(option.id)} className="text-gray-600 hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={addOption}
                className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors mt-1"
              >
                <Plus size={14} />
                Add Option
              </button>
            </div>
          )}

          {/* True / False */}
          {question.type === 'truefalse' && (
            <div className="flex gap-3">
              {['True', 'False'].map(val => (
                <button
                  key={val}
                  onClick={() => update({ correctAnswer: val })}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    question.correctAnswer === val
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'border-gray-700 text-gray-500 hover:border-gray-500'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          )}

          {/* Fill in the Gap */}
          {question.type === 'fillingap' && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-500">Use ___ in the question text to mark the gap</p>
              <input
                className="w-full bg-gray-800 text-white text-sm rounded-lg p-3 placeholder-gray-600 outline-none border border-gray-700 focus:border-gray-500"
                placeholder="Correct answer..."
                value={question.correctAnswer}
                onChange={e => update({ correctAnswer: e.target.value })}
              />
            </div>
          )}

          {/* Explanation */}
          <textarea
            className="w-full bg-gray-800 text-white text-sm rounded-lg p-3 placeholder-gray-600 outline-none resize-none border border-gray-700 focus:border-gray-500 min-h-[60px]"
            placeholder="Explanation shown after student answers (optional)..."
            value={question.explanation}
            onChange={e => update({ explanation: e.target.value })}
          />

        </div>
      )}
    </div>
  )
}
