import { useParams } from 'react-router-dom'
import { CheckCircle, Globe, Lock, AlertCircle } from 'lucide-react'
import { useContentBlocks } from '../../hooks/useContentBlocks'
import { useQuestions } from '../../hooks/useQuestions'
import { useFlashcards } from '../../hooks/useFlashcards'
import { useTopic } from '../../hooks/useTopic'
import StudentBlockRenderer from './StudentBlockRenderer'

export default function ReviewPublish() {
  const { topicId } = useParams<{ topicId: string }>()
  const { blocks, loading: blocksLoading } = useContentBlocks(topicId!)
  const { questions, loading: questionsLoading } = useQuestions(topicId!)
  const { flashcards, loading: flashcardsLoading } = useFlashcards(topicId!)
  const { topic, loading: topicLoading, publish, unpublish } = useTopic(topicId!)

  const loading = blocksLoading || questionsLoading || flashcardsLoading || topicLoading

  const contentBlockCount = blocks.filter(b => !['question', 'flashcard'].includes(b.type)).length
  const questionBlockCount = blocks.filter(b => b.type === 'question').length
  const flashcardBlockCount = blocks.filter(b => b.type === 'flashcard').length

  const checks = [
    { label: 'At least 3 content blocks', passed: contentBlockCount >= 3, count: contentBlockCount },
    { label: 'At least 1 question', passed: questionBlockCount >= 1, count: questionBlockCount },
    { label: 'At least 1 flashcard', passed: flashcardBlockCount >= 1, count: flashcardBlockCount },
  ]

  const readyToPublish = checks.every(c => c.passed)
  const isPublished = topic?.status === 'published'

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
          <h2 className="text-white text-xl font-semibold">Review & Publish</h2>
          <p className="text-gray-500 text-sm mt-1">
            Preview exactly what students will see, then publish when ready.
          </p>
        </div>

        {/* Publish Button */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {isPublished ? (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Globe size={14} />
                Published
              </div>
              <button
                onClick={unpublish}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
              >
                <Lock size={14} />
                Unpublish
              </button>
            </div>
          ) : (
            <button
              onClick={publish}
              disabled={!readyToPublish}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
            >
              <Globe size={14} />
              Publish Topic
            </button>
          )}
        </div>
      </div>

      {/* Readiness Checks */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-8">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Readiness Check</p>
        <div className="flex flex-col gap-2">
          {checks.map(check => (
            <div key={check.label} className="flex items-center gap-3">
              {check.passed ? (
                <CheckCircle size={15} className="text-green-400 shrink-0" />
              ) : (
                <AlertCircle size={15} className="text-gray-600 shrink-0" />
              )}
              <span className={`text-sm ${check.passed ? 'text-gray-300' : 'text-gray-600'}`}>
                {check.label}
              </span>
              <span className={`text-xs ml-auto ${check.passed ? 'text-green-400' : 'text-gray-600'}`}>
                {check.count} found
              </span>
            </div>
          ))}
        </div>
        {!readyToPublish && (
          <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-gray-800">
            Complete the checks above before publishing.
          </p>
        )}
      </div>

      {/* Student Preview */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Student Preview</p>
        <p className="text-xs text-gray-600">This is exactly what students will experience.</p>
      </div>

      {blocks.length === 0 ? (
        <div className="border border-dashed border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-600 text-sm">No blocks yet. Build your content first.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {blocks.map((block, index) => (
            <div key={block.id}>
              <StudentBlockRenderer
                block={block}
                index={index}
                question={block.questionId ? questions.find(q => q.id === block.questionId) : undefined}
                flashcard={block.flashcardId ? flashcards.find(f => f.id === block.flashcardId) : undefined}
              />
              {index < blocks.length - 1 && (
                <div className="mt-6 border-b border-gray-900" />
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  )
}