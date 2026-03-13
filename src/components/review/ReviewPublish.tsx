import { CheckCircle, Circle, Send, Loader2, Download } from 'lucide-react'
import { useState } from 'react'
import { useContentBlocks } from '../../hooks/useContentBlocks'
import { useQuestions } from '../../hooks/useQuestions'
import { useFlashcards } from '../../hooks/useFlashcards'
import { exportReadyQuestions, downloadJSON } from '../../hooks/useExport'
import StudentBlockRenderer from './StudentBlockRenderer'
import type { Question } from '../../types/content'

interface Props {
  subtopicId: string
  subjectId: string
}

export default function ReviewPublish({ subtopicId, subjectId }: Props) {
  const { blocks, loading: blocksLoading } = useContentBlocks(subtopicId, subjectId)
  const { questions, loading: questionsLoading, markReady, exportQuestion } = useQuestions(subtopicId, subjectId)
  const { flashcards, loading: flashcardsLoading } = useFlashcards(subtopicId, subjectId)
  const [exporting, setExporting] = useState<string | null>(null)
  const [exportingAll, setExportingAll] = useState(false)
  const [exportDone, setExportDone] = useState(false)

  const handleExportFile = async () => {
    setExportingAll(true)
    try {
      const { json, filename } = await exportReadyQuestions()
      downloadJSON(json, filename)
      setExportDone(true)
      setTimeout(() => setExportDone(false), 3000)
    } catch (err: any) {
      alert(err.message)
    }
    setExportingAll(false)
  }

  const loading = blocksLoading || questionsLoading || flashcardsLoading

  const contentCount = blocks.filter(b => !['question', 'flashcard'].includes(b.type)).length
  const readyCount = questions.filter(q => q.status === 'ready').length
  const exportedCount = questions.filter(q => q.status === 'exported').length

  const checks = [
    { label: 'At least 3 content blocks', passed: contentCount >= 3, count: contentCount },
    { label: 'At least 1 question', passed: questions.length >= 1, count: questions.length },
    { label: 'At least 1 flashcard', passed: flashcards.length >= 1, count: flashcards.length },
  ]

  const handleExport = async (q: Question) => {
    setExporting(q.id)
    await exportQuestion(q)
    setExporting(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">

      <div className="mb-8 pb-4 border-b border-gray-200 flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Review</h2>
          <p className="text-xs text-gray-500 mt-0.5">Preview the subtopic. Export ready questions as a file.</p>
        </div>
        <button
          onClick={handleExportFile}
          disabled={exportingAll || readyCount === 0}
          className="flex items-center gap-1.5 text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded hover:border-gray-500 disabled:opacity-40 transition-colors shrink-0"
          title={readyCount === 0 ? 'No questions marked as ready' : 'Export all ready questions as JSON'}
        >
          {exportingAll
            ? <Loader2 size={11} className="animate-spin" />
            : exportDone
            ? <CheckCircle size={11} />
            : <Download size={11} />
          }
          {exportDone ? 'Downloaded!' : `Export questions`}
        </button>
      </div>

      {/* Readiness checks */}
      <div className="bg-white border border-gray-200 rounded mb-6 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-stone-50">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Readiness</p>
        </div>
        <div className="divide-y divide-gray-100">
          {checks.map(check => (
            <div key={check.label} className="flex items-center gap-3 px-4 py-3">
              {check.passed
                ? <CheckCircle size={14} className="text-gray-900 shrink-0" />
                : <Circle size={14} className="text-gray-300 shrink-0" />
              }
              <span className={`text-sm flex-1 ${check.passed ? 'text-gray-700' : 'text-gray-400'}`}>
                {check.label}
              </span>
              <span className={`text-xs tabular-nums ${check.passed ? 'text-gray-900 font-medium' : 'text-gray-300'}`}>
                {check.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Questions — per-question export */}
      {questions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded mb-6 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-stone-50 flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Questions</p>
            {exportedCount > 0 && (
              <span className="text-xs text-gray-400">{exportedCount} sent to Jamsulator</span>
            )}
          </div>
          <div className="divide-y divide-gray-100">
            {questions.map((q, i) => (
              <div key={q.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xs text-gray-400 w-5 shrink-0">Q{i + 1}</span>
                <span className="text-sm text-gray-700 flex-1 truncate">{q.questionText || 'Untitled'}</span>

                {/* Draft → mark ready */}
                {q.status === 'draft' && (
                  <button
                    onClick={() => markReady(q.id)}
                    className="text-xs border border-gray-300 text-gray-500 px-2.5 py-1 rounded hover:border-gray-500 hover:text-gray-700 transition-colors shrink-0"
                  >
                    Mark ready
                  </button>
                )}

                {/* Ready → send to Jamsulator */}
                {q.status === 'ready' && (
                  <button
                    onClick={() => handleExport(q)}
                    disabled={exporting === q.id}
                    className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-2.5 py-1 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors shrink-0"
                  >
                    {exporting === q.id
                      ? <Loader2 size={11} className="animate-spin" />
                      : <Send size={11} />
                    }
                    Send
                  </button>
                )}

                {/* Exported */}
                {q.status === 'exported' && (
                  <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                    <CheckCircle size={11} />
                    Sent
                  </span>
                )}
              </div>
            ))}
          </div>

          {readyCount > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 bg-stone-50 flex justify-end">
              <button
                onClick={async () => {
                  for (const q of questions.filter(q => q.status === 'ready')) {
                    await handleExport(q)
                  }
                }}
                className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
              >
                <Send size={11} />
                Send all ready ({readyCount})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Student preview */}
      <div className="mb-4 pb-2 border-b border-gray-200">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Student Preview</p>
      </div>

      {blocks.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded p-10 text-center">
          <p className="text-sm text-gray-400">No content yet. Add blocks in the Content tab.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="divide-y divide-gray-100">
            {blocks.map((block, index) => (
              <div key={block.id} className="p-6">
                <StudentBlockRenderer
                  block={block}
                  index={index}
                  question={block.questionId ? questions.find(q => q.id === block.questionId) : undefined}
                  flashcard={block.flashcardId ? flashcards.find(f => f.id === block.flashcardId) : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}