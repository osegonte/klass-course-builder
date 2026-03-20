import { useState } from 'react'
import { CheckCircle, Circle, Loader2, Download, Eye } from 'lucide-react'
import { useContentBlocks } from '../../hooks/useContentBlocks'
import { useQuestions } from '../../hooks/useQuestions'
import { useFlashcards } from '../../hooks/useFlashcards'
import { exportQuestions, downloadJSON } from '../../hooks/useExport'
import StudentBlockRenderer from './StudentBlockRenderer'
import type { ExportFormat } from '../../types/content'

interface Props {
  subtopicId: string
  topicId: string
  subjectId: string
}

const FORMAT_LABELS: Record<ExportFormat, string> = {
  jamsulator_json: 'Jamsulator JSON',
  generic_json:    'Generic JSON',
  scorm:           'SCORM (coming soon)',
}

export default function ReviewPublish({ subtopicId, topicId, subjectId }: Props) {
  const { blocks, loading: blocksLoading } = useContentBlocks(subtopicId)
  const { questions, loading: questionsLoading, markReady, markExported } = useQuestions(subtopicId)
  const { flashcards, loading: flashcardsLoading } = useFlashcards(subtopicId)

  const [exporting, setExporting] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('generic_json')
  const [consumerName, setConsumerName] = useState('')
  const [tab, setTab] = useState<'review' | 'preview'>('review')

  const loading = blocksLoading || questionsLoading || flashcardsLoading

  const contentCount  = blocks.filter(b => !['question', 'flashcard'].includes(b.type)).length
  const readyCount    = questions.filter(q => q.status === 'ready').length
  const exportedCount = questions.filter(q => q.status === 'exported').length

  const checks = [
    { label: 'At least 3 content blocks', passed: contentCount >= 3,       count: contentCount },
    { label: 'At least 1 question',       passed: questions.length >= 1,   count: questions.length },
    { label: 'At least 1 flashcard',      passed: flashcards.length >= 1,  count: flashcards.length },
  ]

  const handleExport = async () => {
    setExporting(true)
    try {
      const { json, filename } = await exportQuestions(
        subjectId, topicId, format, consumerName || undefined
      )
      downloadJSON(json, filename)
      const exportedIds = questions.filter(q => q.status === 'ready').map(q => q.id)
      await markExported(exportedIds)
      setExportDone(true)
      setTimeout(() => setExportDone(false), 3000)
    } catch (err: any) {
      alert(err.message)
    }
    setExporting(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <p className="text-sm text-gray-400">Loading…</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 mb-8">
        {(['review', 'preview'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'text-gray-900 border-gray-900' : 'text-gray-400 border-transparent hover:text-gray-700'
            }`}
          >
            {t === 'preview' && <Eye size={12} />}
            {t === 'review' ? 'Readiness & Export' : 'Student Preview'}
          </button>
        ))}
      </div>

      {/* ── REVIEW TAB ──────────────────────────────────────────── */}
      {tab === 'review' && (
        <div className="flex flex-col gap-6">

          {/* Readiness checks */}
          <div className="bg-white border border-gray-200 rounded overflow-hidden">
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

          {/* Questions — mark ready */}
          {questions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-stone-50 flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Questions</p>
                {exportedCount > 0 && (
                  <span className="text-xs text-gray-400">{exportedCount} exported</span>
                )}
              </div>
              <div className="divide-y divide-gray-100">
                {questions.map((q, i) => (
                  <div key={q.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xs text-gray-400 w-5 shrink-0">Q{i + 1}</span>
                    <span className="text-sm text-gray-700 flex-1 truncate">{q.questionText || 'Untitled'}</span>

                    {q.status === 'draft' && (
                      <button
                        onClick={() => markReady(q.id)}
                        className="text-xs border border-gray-300 text-gray-500 px-2.5 py-1 rounded hover:border-gray-500 hover:text-gray-700 transition-colors shrink-0"
                      >
                        Mark ready
                      </button>
                    )}
                    {q.status === 'ready' && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded shrink-0">Ready</span>
                    )}
                    {q.status === 'exported' && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                        <CheckCircle size={11} /> Exported
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export */}
          <div className="bg-white border border-gray-200 rounded overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-stone-50">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Export</p>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Format</label>
                <select
                  value={format}
                  onChange={e => setFormat(e.target.value as ExportFormat)}
                  className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  {(Object.keys(FORMAT_LABELS) as ExportFormat[]).map(f => (
                    <option key={f} value={f} disabled={f === 'scorm'}>
                      {FORMAT_LABELS[f]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Consumer name <span className="text-gray-400">(optional)</span></label>
                <input
                  className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="e.g. Jamsulator, Lagos Grammar School"
                  value={consumerName}
                  onChange={e => setConsumerName(e.target.value)}
                />
              </div>
              <button
                onClick={handleExport}
                disabled={exporting || readyCount === 0}
                className="flex items-center justify-center gap-2 text-xs bg-gray-900 text-white px-4 py-2.5 rounded hover:bg-gray-700 disabled:opacity-40 transition-colors"
                title={readyCount === 0 ? 'No questions marked as ready' : `Export ${readyCount} ready question${readyCount !== 1 ? 's' : ''}`}
              >
                {exporting
                  ? <Loader2 size={12} className="animate-spin" />
                  : exportDone
                  ? <CheckCircle size={12} />
                  : <Download size={12} />
                }
                {exportDone
                  ? 'Downloaded!'
                  : readyCount > 0
                  ? `Export ${readyCount} ready question${readyCount !== 1 ? 's' : ''}`
                  : 'No ready questions'
                }
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ── PREVIEW TAB ─────────────────────────────────────────── */}
      {tab === 'preview' && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-gray-400">
            This is exactly what a student sees when consuming this subtopic.
          </p>

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
      )}
    </div>
  )
}