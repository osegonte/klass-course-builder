import { useState } from 'react'
import type { ContentBlock, Question, Flashcard } from '../../types/content'

interface Props {
  block: ContentBlock
  question?: Question
  flashcard?: Flashcard
  index: number
}

const typeLabels: Record<string, string> = {
  mcq: 'Multiple Choice',
  truefalse: 'True or False',
  fillingap: 'Fill in the Gap',
  multiselect: 'Multi-select',
}

function QuestionInteractive({ question }: { question: Question }) {
  const [selected, setSelected] = useState<string>('')
  const [submitted, setSubmitted] = useState(false)
  const [fillAnswer, setFillAnswer] = useState('')

  const isCorrect = () => {
    if (question.type === 'fillingap') {
      return fillAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
    }
    return selected === question.correctAnswer
  }

  const handleSubmit = () => {
    if (question.type === 'fillingap' && !fillAnswer.trim()) return
    if (question.type !== 'fillingap' && !selected) return
    setSubmitted(true)
  }

  const handleReset = () => {
    setSelected('')
    setFillAnswer('')
    setSubmitted(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-white text-base">{question.questionText}</p>

      {/* MCQ / Multiselect */}
      {(question.type === 'mcq' || question.type === 'multiselect') && (
        <div className="flex flex-col gap-2">
          {question.options.map(opt => {
            const isSelected = selected === opt.id
            const isCorrectOption = submitted && opt.id === question.correctAnswer
            const isWrongSelection = submitted && isSelected && opt.id !== question.correctAnswer

            return (
              <button
                key={opt.id}
                onClick={() => !submitted && setSelected(opt.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                  isCorrectOption
                    ? 'border-green-500/50 bg-green-500/10 text-green-300'
                    : isWrongSelection
                    ? 'border-red-500/50 bg-red-500/10 text-red-300'
                    : isSelected
                    ? 'border-purple-500/50 bg-purple-500/10 text-white'
                    : 'border-gray-700 text-gray-300 hover:border-gray-600'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${
                  isCorrectOption
                    ? 'border-green-500 bg-green-500'
                    : isWrongSelection
                    ? 'border-red-500 bg-red-500'
                    : isSelected
                    ? 'border-purple-500 bg-purple-500'
                    : 'border-gray-600'
                }`}>
                  {(isSelected || isCorrectOption) && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-sm">{opt.text}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* True / False */}
      {question.type === 'truefalse' && (
        <div className="flex gap-3">
          {['True', 'False'].map(val => {
            const isSelected = selected === val
            const isCorrectOption = submitted && val === question.correctAnswer
            const isWrongSelection = submitted && isSelected && val !== question.correctAnswer

            return (
              <button
                key={val}
                onClick={() => !submitted && setSelected(val)}
                className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  isCorrectOption
                    ? 'border-green-500/50 bg-green-500/10 text-green-300'
                    : isWrongSelection
                    ? 'border-red-500/50 bg-red-500/10 text-red-300'
                    : isSelected
                    ? 'border-purple-500/50 bg-purple-500/10 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {val}
              </button>
            )
          })}
        </div>
      )}

      {/* Fill in the Gap */}
      {question.type === 'fillingap' && (
        <input
          className={`w-full bg-gray-800 text-white text-sm rounded-lg p-3 outline-none border transition-colors ${
            submitted
              ? isCorrect()
                ? 'border-green-500/50'
                : 'border-red-500/50'
              : 'border-gray-700 focus:border-gray-500'
          }`}
          placeholder="Type your answer..."
          value={fillAnswer}
          onChange={e => !submitted && setFillAnswer(e.target.value)}
          disabled={submitted}
        />
      )}

      {/* Feedback */}
      {submitted && (
        <div className={`rounded-lg p-3 border ${
          isCorrect()
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <p className={`text-sm font-medium ${isCorrect() ? 'text-green-300' : 'text-red-300'}`}>
            {isCorrect() ? 'Correct!' : 'Not quite.'}
          </p>
          {question.explanation && (
            <p className="text-sm text-gray-400 mt-1">{question.explanation}</p>
          )}
          {!isCorrect() && question.type !== 'fillingap' && (
            <p className="text-xs text-gray-500 mt-1">
              Correct answer: {question.options.find(o => o.id === question.correctAnswer)?.text || question.correctAnswer}
            </p>
          )}
          {!isCorrect() && question.type === 'fillingap' && (
            <p className="text-xs text-gray-500 mt-1">Correct answer: {question.correctAnswer}</p>
          )}
        </div>
      )}

      {/* Submit / Try Again */}
      <div className="flex gap-2">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selected && !fillAnswer.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
          >
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
      className="cursor-pointer select-none"
    >
      <div className={`relative min-h-[140px] rounded-xl border transition-all duration-300 flex flex-col items-center justify-center p-6 text-center ${
        flipped
          ? 'bg-purple-900/20 border-purple-500/30'
          : 'bg-gray-800 border-gray-700'
      }`}>
        <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
          {flipped ? 'Back' : 'Front'} — tap to flip
        </p>
        <p className="text-white text-base">
          {flipped ? flashcard.back : flashcard.front}
        </p>
      </div>
    </div>
  )
}

export default function StudentBlockRenderer({ block, question, flashcard }: Props) {
  return (
    <div className="flex flex-col gap-3">

      {/* Definition */}
      {block.type === 'definition' && (
        <div className="border-l-2 border-purple-500/50 pl-4">
          <p className="text-xs text-purple-400 uppercase tracking-wide mb-1">Definition</p>
          <p className="text-white font-semibold text-base">{block.title}</p>
          <p className="text-gray-300 text-sm mt-2 leading-relaxed">{block.body}</p>
          {block.analogy && (
            <p className="text-gray-500 text-sm mt-2 italic">💡 {block.analogy}</p>
          )}
        </div>
      )}

      {/* Explanation */}
      {block.type === 'explanation' && (
        <div>
          {block.title && (
            <p className="text-white font-medium mb-2">{block.title}</p>
          )}
          <p className="text-gray-300 text-sm leading-relaxed">{block.body}</p>
        </div>
      )}

      {/* Formula */}
      {block.type === 'formula' && (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{block.title}</p>
          <p className="text-white font-mono text-lg text-center py-3">{block.body}</p>
          {block.breakdown && (
            <p className="text-gray-400 text-sm mt-3 pt-3 border-t border-gray-700 leading-relaxed">
              {block.breakdown}
            </p>
          )}
        </div>
      )}

      {/* Example */}
      {block.type === 'example' && (
        <div>
          {block.title && (
            <p className="text-white font-medium mb-3">{block.title}</p>
          )}
          <div className="flex flex-col gap-3">
            {(block.steps || []).map((step, i) => (
              <div key={step.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <span className="text-xs text-purple-300">{i + 1}</span>
                  </div>
                  {i < (block.steps || []).length - 1 && (
                    <div className="w-px flex-1 bg-gray-800 mt-1" />
                  )}
                </div>
                <div className="pb-3">
                  <p className="text-white font-mono text-sm">{step.expression}</p>
                  <p className="text-gray-400 text-sm mt-1">{step.talkingPoint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Point */}
      {block.type === 'keypoint' && (
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
          <p className="text-xs text-purple-400 uppercase tracking-wide mb-2">Key Point</p>
          <p className="text-white text-sm leading-relaxed">{block.body}</p>
        </div>
      )}

      {/* Note */}
      {block.type === 'note' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Note</p>
          <p className="text-gray-400 text-sm leading-relaxed">{block.body}</p>
        </div>
      )}

      {/* Question */}
      {block.type === 'question' && question && (
        <div className="bg-gray-900 border border-purple-600/20 rounded-xl p-4">
          <p className="text-xs text-purple-400 uppercase tracking-wide mb-3">
            {typeLabels[question.type]}
          </p>
          <QuestionInteractive question={question} />
        </div>
      )}

      {/* Flashcard */}
      {block.type === 'flashcard' && flashcard && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Flashcard</p>
          <FlashcardInteractive flashcard={flashcard} />
        </div>
      )}

    </div>
  )
}