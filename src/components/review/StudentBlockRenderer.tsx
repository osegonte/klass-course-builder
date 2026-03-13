import { useState } from 'react'
import type { ContentBlock, Question, Flashcard } from '../../types/content'

interface Props {
  block: ContentBlock
  question?: Question
  flashcard?: Flashcard
  index: number
}

const typeLabels: Record<string, string> = {
  mcq: 'Multiple Choice', truefalse: 'True or False',
  fillingap: 'Fill in the Gap', multiselect: 'Multi-select',
}

function QuestionInteractive({ question }: { question: Question }) {
  const [selected, setSelected] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [fillAnswer, setFillAnswer] = useState('')

  const isCorrect = () => {
    if (question.type === 'fillingap') return fillAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
    return selected === question.correctAnswer
  }

  const handleSubmit = () => {
    if (question.type === 'fillingap' && !fillAnswer.trim()) return
    if (question.type !== 'fillingap' && !selected) return
    setSubmitted(true)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-900">{question.questionText}</p>

      {(question.type === 'mcq' || question.type === 'multiselect') && (
        <div className="flex flex-col gap-1.5">
          {question.options.map(opt => {
            const isSelected = selected === opt.id
            const isCorrectOpt = submitted && opt.id === question.correctAnswer
            const isWrong = submitted && isSelected && opt.id !== question.correctAnswer
            return (
              <button
                key={opt.id}
                onClick={() => !submitted && setSelected(opt.id)}
                className={`flex items-center gap-3 p-2.5 rounded border text-left text-sm transition-colors ${
                  isCorrectOpt ? 'border-gray-900 bg-gray-50 text-gray-900'
                  : isWrong ? 'border-red-300 bg-red-50 text-red-700'
                  : isSelected ? 'border-gray-400 bg-stone-50 text-gray-900'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full border shrink-0 ${
                  isCorrectOpt ? 'bg-gray-900 border-gray-900'
                  : isWrong ? 'bg-red-400 border-red-400'
                  : isSelected ? 'bg-gray-500 border-gray-500'
                  : 'border-gray-300'
                }`} />
                {opt.text}
              </button>
            )
          })}
        </div>
      )}

      {question.type === 'truefalse' && (
        <div className="flex gap-2">
          {['True', 'False'].map(val => {
            const isSelected = selected === val
            const isCorrectOpt = submitted && val === question.correctAnswer
            const isWrong = submitted && isSelected && val !== question.correctAnswer
            return (
              <button
                key={val}
                onClick={() => !submitted && setSelected(val)}
                className={`flex-1 py-2 rounded border text-sm transition-colors ${
                  isCorrectOpt ? 'border-gray-900 bg-gray-50 text-gray-900 font-medium'
                  : isWrong ? 'border-red-300 bg-red-50 text-red-700'
                  : isSelected ? 'border-gray-400 text-gray-900'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {val}
              </button>
            )
          })}
        </div>
      )}

      {question.type === 'fillingap' && (
        <input
          className={`w-full text-sm border rounded p-2.5 outline-none transition-colors ${
            submitted ? isCorrect() ? 'border-gray-900' : 'border-red-300' : 'border-gray-200 focus:border-gray-400'
          }`}
          placeholder="Type your answer..."
          value={fillAnswer}
          onChange={e => !submitted && setFillAnswer(e.target.value)}
          disabled={submitted}
        />
      )}

      {submitted && (
        <div className={`rounded border p-3 text-sm ${isCorrect() ? 'border-gray-300 bg-stone-50' : 'border-red-200 bg-red-50'}`}>
          <p className={`font-medium ${isCorrect() ? 'text-gray-900' : 'text-red-700'}`}>
            {isCorrect() ? 'Correct.' : 'Incorrect.'}
          </p>
          {question.hint && <p className="text-gray-600 mt-1 text-xs">{question.hint}</p>}
          {!isCorrect() && <p className="text-xs text-gray-500 mt-1">Answer: {question.options.find(o => o.id === question.correctAnswer)?.text || question.correctAnswer}</p>}
        </div>
      )}

      <div>
        {!submitted ? (
          <button onClick={handleSubmit} disabled={!selected && !fillAnswer.trim()} className="text-xs border border-gray-900 text-gray-900 px-4 py-1.5 rounded hover:bg-gray-900 hover:text-white disabled:opacity-30 transition-colors">
            Submit
          </button>
        ) : (
          <button onClick={() => { setSelected(''); setFillAnswer(''); setSubmitted(false) }} className="text-xs border border-gray-300 text-gray-500 px-4 py-1.5 rounded hover:border-gray-500 transition-colors">
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}

function FlashcardInteractive({ flashcard }: { flashcard: Flashcard }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <div
      onClick={() => setFlipped(!flipped)}
      className={`cursor-pointer select-none min-h-[100px] rounded border flex flex-col items-center justify-center p-6 text-center transition-colors ${
        flipped ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-900 hover:border-gray-400'
      }`}
    >
      <p className="text-xs uppercase tracking-widest mb-2 opacity-50">{flipped ? 'Back' : 'Front'} — tap to flip</p>
      <p className="text-sm">{flipped ? flashcard.back : flashcard.front}</p>
    </div>
  )
}

export default function StudentBlockRenderer({ block, question, flashcard }: Props) {
  return (
    <div>
      {block.type === 'definition' && (
        <div className="border-l-2 border-gray-900 pl-4">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Definition</p>
          <p className="text-base font-semibold text-gray-900">{block.title}</p>
          <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">{block.body}</p>
          {block.analogy && <p className="text-sm text-gray-500 mt-2 italic">{block.analogy}</p>}
        </div>
      )}

      {block.type === 'explanation' && (
        <div>
          {block.title && <p className="text-sm font-medium text-gray-900 mb-1.5">{block.title}</p>}
          <p className="text-sm text-gray-700 leading-relaxed">{block.body}</p>
        </div>
      )}

      {block.type === 'formula' && (
        <div className="border border-gray-200 rounded p-4 bg-stone-50">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">{block.title}</p>
          <p className="text-lg font-mono text-center text-gray-900 py-2">{block.body}</p>
          {block.breakdown && <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-gray-200 leading-relaxed">{block.breakdown}</p>}
        </div>
      )}

      {block.type === 'example' && (
        <div>
          {block.title && <p className="text-sm font-medium text-gray-900 mb-2">{block.title}</p>}
          <div className="flex flex-col gap-2">
            {(block.steps || []).map((step, i) => (
              <div key={step.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center shrink-0">
                    <span className="text-xs text-gray-500">{i + 1}</span>
                  </div>
                  {i < (block.steps || []).length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="pb-2">
                  <p className="text-sm font-mono text-gray-900">{step.expression}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{step.talkingPoint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {block.type === 'keypoint' && (
        <div className="border border-gray-900 rounded p-4">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-1.5">Key Point</p>
          <p className="text-sm text-gray-900 leading-relaxed">{block.body}</p>
        </div>
      )}

      {block.type === 'note' && (
        <div className="border border-gray-200 rounded p-4 bg-stone-50">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1.5">Note</p>
          <p className="text-sm text-gray-600 leading-relaxed">{block.body}</p>
        </div>
      )}

      {block.type === 'question' && question && (
        <div className="border border-gray-200 rounded p-4">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">{typeLabels[question.type]}</p>
          <QuestionInteractive question={question} />
        </div>
      )}

      {block.type === 'flashcard' && flashcard && (
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Flashcard</p>
          <FlashcardInteractive flashcard={flashcard} />
        </div>
      )}
    </div>
  )
}