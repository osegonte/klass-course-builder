import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, FileJson, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { importCurriculum, importQuestions } from '../hooks/useImport'

type FileType = 'curriculum' | 'questions' | null

interface Preview {
  type: FileType
  source: string
  exported_at: string
  // curriculum
  subjects?: number
  topics?: number
  subtopics?: number
  // questions
  questionCount?: number
}

export default function ImportCurriculum() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [jsonText, setJsonText] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [parseError, setParseError] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<any | null>(null)

  const parseJSON = (text: string) => {
    setParseError('')
    setPreview(null)
    setResult(null)
    try {
      const data = JSON.parse(text)

      // Detect file type
      if (data.subjects && Array.isArray(data.subjects)) {
        // Curriculum file
        let topicCount = 0
        let subtopicCount = 0
        for (const s of data.subjects) {
          topicCount += s.topics?.length ?? 0
          for (const t of s.topics ?? []) subtopicCount += t.subtopics?.length ?? 0
        }
        setPreview({
          type: 'curriculum',
          source: data.source ?? 'unknown',
          exported_at: data.exported_at ?? '',
          subjects: data.subjects.length,
          topics: topicCount,
          subtopics: subtopicCount,
        })
      } else if (data.questions && Array.isArray(data.questions)) {
        // Questions file
        setPreview({
          type: 'questions',
          source: data.source ?? 'unknown',
          exported_at: data.exported_at ?? '',
          questionCount: data.questions.length,
        })
      } else {
        setParseError('Unrecognised format — expected "subjects" or "questions" array.')
        return
      }

      setJsonText(text)
    } catch {
      setParseError('Could not parse JSON. Check the file format.')
    }
  }

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => parseJSON(e.target?.result as string)
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleImport = async () => {
    if (!jsonText || !preview) return
    setImporting(true)
    try {
      if (preview.type === 'curriculum') {
        const res = await importCurriculum(jsonText)
        setResult({ type: 'curriculum', ...res })
      } else {
        const res = await importQuestions(jsonText)
        setResult({ type: 'questions', ...res })
      }
    } catch (err: any) {
      setResult({ type: preview.type, inserted: 0, errors: [err.message] })
    }
    setImporting(false)
  }

  const typeLabel = preview?.type === 'questions' ? 'Questions' : 'Curriculum'

  return (
    <div className="min-h-screen bg-stone-50">

      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="w-px h-4 bg-gray-200" />
        <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">KLASS Studio</span>
        <div className="w-px h-4 bg-gray-200" />
        <span className="text-sm font-medium text-gray-900">Import</span>
      </header>

      <div className="max-w-2xl mx-auto py-12 px-6">

        <div className="mb-8 pb-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Import</h2>
          <p className="text-xs text-gray-500 mt-1">
            Accepts two file types — curriculum structure from any app, or questions sent back to KLASS.
            Re-importing is always safe, existing entries are updated not duplicated.
          </p>
        </div>

        {/* What this accepts */}
        {!preview && !result && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              {
                label: 'Curriculum file',
                desc: 'From Jamsulator or any app. Loads subjects, topics, subtopics.',
                badge: 'subjects → topics → subtopics',
              },
              {
                label: 'Questions file',
                desc: 'Questions sent back into KLASS from an external app.',
                badge: 'questions → draft queue',
              },
            ].map(item => (
              <div key={item.label} className="border border-gray-200 rounded p-4 bg-white">
                <p className="text-xs font-medium text-gray-700 mb-1">{item.label}</p>
                <p className="text-xs text-gray-400 mb-2">{item.desc}</p>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono">
                  {item.badge}
                </span>
              </div>
            ))}
          </div>
        )}

        {!result && (
          <>
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors mb-6 ${
                dragging ? 'border-gray-500 bg-gray-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <Upload size={20} className="text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 font-medium">Drop JSON file here or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">Curriculum or questions export file</p>
            </div>

            <div className="mb-2 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or paste JSON directly</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <textarea
              className="w-full border border-gray-200 rounded p-3 text-xs font-mono text-gray-700 placeholder-gray-300 outline-none focus:border-gray-400 transition-colors resize-none min-h-[100px] bg-white mt-2"
              placeholder='{ "source": "jamsulator", "subjects": [...] }'
              value={jsonText}
              onChange={e => parseJSON(e.target.value)}
            />

            {parseError && (
              <div className="flex items-center gap-2 mt-3 text-xs text-red-500">
                <AlertCircle size={13} />
                {parseError}
              </div>
            )}

            {/* Preview */}
            {preview && (
              <div className="mt-6 bg-white border border-gray-200 rounded overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-stone-50 flex items-center gap-2">
                  <FileJson size={13} className="text-gray-500" />
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    {typeLabel} Preview
                  </p>
                  <span className="ml-auto text-xs text-gray-400">{preview.source}</span>
                </div>

                <div className="divide-y divide-gray-100">
                  {preview.type === 'curriculum' && [
                    { label: 'Subjects', value: preview.subjects },
                    { label: 'Topics', value: preview.topics },
                    { label: 'Subtopics', value: preview.subtopics },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-600">{row.label}</span>
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">
                        {(row.value ?? 0).toLocaleString()}
                      </span>
                    </div>
                  ))}

                  {preview.type === 'questions' && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-600">Questions</span>
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">
                        {(preview.questionCount ?? 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="px-4 py-3 border-t border-gray-100 bg-stone-50 flex justify-end">
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="flex items-center gap-2 text-sm bg-gray-900 text-white px-5 py-2 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    {importing
                      ? <><Loader2 size={14} className="animate-spin" />Importing...</>
                      : <>Import {typeLabel.toLowerCase()}</>
                    }
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white border border-gray-200 rounded overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-stone-50 flex items-center gap-2">
              <CheckCircle size={13} className="text-gray-900" />
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Import Complete</p>
            </div>

            <div className="divide-y divide-gray-100">
              {result.type === 'curriculum' && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-600">Rows processed</span>
                  <span className="text-sm font-semibold text-gray-900">{result.inserted?.toLocaleString()}</span>
                </div>
              )}
              {result.type === 'questions' && (
                <>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-gray-600">Questions imported</span>
                    <span className="text-sm font-semibold text-gray-900">{result.total}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-gray-600">Matched to subtopic</span>
                    <span className="text-sm font-semibold text-gray-900">{result.matched}</span>
                  </div>
                  {result.unmatched > 0 && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500">Unmatched (saved without subtopic)</span>
                      <span className="text-sm text-gray-400">{result.unmatched}</span>
                    </div>
                  )}
                </>
              )}
              {result.errors?.length > 0 && (
                <div className="px-4 py-3">
                  <p className="text-xs font-medium text-red-500 mb-2">{result.errors.length} errors</p>
                  <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                    {result.errors.map((e: string, i: number) => (
                      <p key={i} className="text-xs text-red-400 font-mono">{e}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-100 bg-stone-50 flex items-center justify-between">
              <button
                onClick={() => { setResult(null); setPreview(null); setJsonText('') }}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Import another file
              </button>
              <button
                onClick={() => navigate('/')}
                className="text-xs bg-gray-900 text-white px-4 py-1.5 rounded hover:bg-gray-700 transition-colors"
              >
                {result.type === 'curriculum' ? 'View subjects →' : 'Go to studio →'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}