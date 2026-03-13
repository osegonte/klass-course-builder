import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Loader2, Download } from 'lucide-react'
import { useProjects } from '../hooks/useProjects'
import { supabase } from '../lib/supabase'

interface TopicEntry {
  id: string
  name: string
  objectives: string
  subtopics: { id: string; name: string }[]
}

type Mode = 'manual' | 'import'

export default function CreateProject() {
  const navigate = useNavigate()
  const { createProject } = useProjects()

  const [mode, setMode] = useState<Mode>('manual')
  const [projectName, setProjectName] = useState('')
  const [source, setSource] = useState<'manual' | 'jamsulator' | 'school'>('manual')
  const [topics, setTopics] = useState<TopicEntry[]>([makeEmptyTopic()])
  const [importJson, setImportJson] = useState('')
  const [importError, setImportError] = useState('')
  const [saving, setSaving] = useState(false)

  // ── Manual helpers ──────────────────────────────────────────────────────────

  function makeEmptyTopic(): TopicEntry {
    return { id: crypto.randomUUID(), name: '', objectives: '', subtopics: [{ id: crypto.randomUUID(), name: '' }] }
  }

  const addTopic = () => setTopics(prev => [...prev, makeEmptyTopic()])

  const removeTopic = (id: string) => setTopics(prev => prev.filter(t => t.id !== id))

  const updateTopic = (id: string, fields: Partial<TopicEntry>) =>
    setTopics(prev => prev.map(t => t.id === id ? { ...t, ...fields } : t))

  const addSubtopic = (topicId: string) =>
    setTopics(prev => prev.map(t =>
      t.id === topicId
        ? { ...t, subtopics: [...t.subtopics, { id: crypto.randomUUID(), name: '' }] }
        : t
    ))

  const removeSubtopic = (topicId: string, subId: string) =>
    setTopics(prev => prev.map(t =>
      t.id === topicId
        ? { ...t, subtopics: t.subtopics.filter(s => s.id !== subId) }
        : t
    ))

  const updateSubtopic = (topicId: string, subId: string, name: string) =>
    setTopics(prev => prev.map(t =>
      t.id === topicId
        ? { ...t, subtopics: t.subtopics.map(s => s.id === subId ? { ...s, name } : s) }
        : t
    ))

  // ── Import JSON parser ──────────────────────────────────────────────────────

  const parseImportJSON = () => {
    setImportError('')
    try {
      const parsed = JSON.parse(importJson)
      // Accept either the full cs_imports payload or a raw catalog
      const catalog = parsed.payload ?? parsed
      if (!catalog.topics || !Array.isArray(catalog.topics)) {
        setImportError('JSON must have a "topics" array.')
        return
      }
      setProjectName(prev => prev || (catalog.subject ? `${catalog.subject}` : ''))
      setSource('jamsulator')
      const mapped: TopicEntry[] = catalog.topics.map((t: any) => ({
        id: t.id ?? crypto.randomUUID(),
        name: t.name ?? '',
        objectives: Array.isArray(t.objectives) ? t.objectives.join(', ') : '',
        subtopics: (t.subtopics ?? []).map((s: any) => ({
          id: s.id ?? crypto.randomUUID(),
          name: s.name ?? '',
        })),
      }))
      setTopics(mapped)
      setMode('manual') // switch to manual for review before saving
    } catch {
      setImportError('Invalid JSON. Please check the format.')
    }
  }

  // ── Load pending cs_imports ─────────────────────────────────────────────────

  const [imports, setImports] = useState<any[]>([])
  const [loadingImports, setLoadingImports] = useState(false)

  const loadPendingImports = async () => {
    setLoadingImports(true)
    const { data } = await supabase
      .from('cs_imports')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    setImports(data ?? [])
    setLoadingImports(false)
  }

  const applyImport = (row: any) => {
    setImportJson(JSON.stringify(row.payload, null, 2))
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!projectName.trim()) return
    const hasTopics = topics.some(t => t.name.trim())
    if (!hasTopics) return

    setSaving(true)

    // 1. Create project
    const project = await createProject({
      name: projectName.trim(),
      source,
      status: 'active',
    })

    if (!project) { setSaving(false); return }

    // 2. Insert topics + subtopics in order
    for (let ti = 0; ti < topics.length; ti++) {
      const t = topics[ti]
      if (!t.name.trim()) continue

      const objectives = t.objectives
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)

      const { data: topicRow } = await supabase
        .from('cs_topics')
        .insert({
          project_id: project.id,
          name: t.name.trim(),
          objectives,
          external_id: t.id.length === 36 ? t.id : null, // keep if looks like original UUID
          order: ti,
        })
        .select()
        .single()

      if (!topicRow) continue

      for (let si = 0; si < t.subtopics.length; si++) {
        const s = t.subtopics[si]
        if (!s.name.trim()) continue

        await supabase.from('cs_subtopics').insert({
          topic_id: topicRow.id,
          project_id: project.id,
          name: s.name.trim(),
          external_id: s.id.length === 36 ? s.id : null,
          order: si,
        })
      }
    }

    // 3. Mark cs_import as processed if we came from one
    if (source === 'jamsulator' && importJson) {
      try {
        const parsed = JSON.parse(importJson)
        if (parsed.id) {
          await supabase
            .from('cs_imports')
            .update({ status: 'processed' })
            .eq('id', parsed.id)
        }
      } catch { /* not from an import row */ }
    }

    navigate(`/project/${project.id}`)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <header className="h-12 bg-gray-900 border-b border-gray-800 flex items-center px-6 gap-4">
        <button onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-300 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-purple-400 tracking-wide">KLASS Studio</span>
        <div className="w-px h-4 bg-gray-800" />
        <span className="text-sm text-gray-400">New Project</span>
      </header>

      <div className="max-w-3xl mx-auto py-10 px-6">

        <div className="mb-8">
          <h1 className="text-white text-xl font-semibold">Create Project</h1>
          <p className="text-gray-500 text-sm mt-1">Add a catalog manually or paste a JSON import.</p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-8">
          {(['manual', 'import'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); if (m === 'import') loadPendingImports() }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === m
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {m === 'manual' ? 'Manual Entry' : 'Import JSON'}
            </button>
          ))}
        </div>

        {/* ── Import mode ── */}
        {mode === 'import' && (
          <div className="flex flex-col gap-4 mb-8">

            {/* Pending imports from cs_imports table */}
            {loadingImports && <p className="text-gray-600 text-sm">Checking for pending imports...</p>}
            {imports.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Pending Imports</p>
                {imports.map(row => (
                  <button
                    key={row.id}
                    onClick={() => applyImport(row)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-purple-500/50 text-left transition-colors"
                  >
                    <Download size={14} className="text-purple-400 shrink-0" />
                    <div>
                      <p className="text-sm text-white">{row.payload?.subject ?? 'Unknown subject'}</p>
                      <p className="text-xs text-gray-600">From: {row.source} · {new Date(row.created_at).toLocaleDateString()}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500 uppercase tracking-wide">Or paste JSON directly</p>
            <textarea
              className="w-full bg-gray-800 text-white text-xs font-mono rounded-lg p-4 placeholder-gray-600 outline-none resize-none border border-gray-700 focus:border-gray-500 min-h-[220px]"
              placeholder={'{\n  "subject": "Mathematics",\n  "topics": [...]\n}'}
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
            />
            {importError && <p className="text-red-400 text-sm">{importError}</p>}
            <button
              onClick={parseImportJSON}
              disabled={!importJson.trim()}
              className="self-start flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Parse & Review
            </button>
          </div>
        )}

        {/* ── Manual / review mode ── */}
        {mode === 'manual' && (
          <div className="flex flex-col gap-6">

            {/* Project name + source */}
            <div className="flex flex-col gap-3">
              <input
                className="w-full bg-gray-800 text-white text-sm rounded-lg p-3 placeholder-gray-600 outline-none border border-gray-700 focus:border-gray-500"
                placeholder="Project name, e.g. Jamsulator — Mathematics 2026"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
              />
              <div className="flex gap-2">
                {(['manual', 'jamsulator', 'school'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSource(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      source === s
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'border-gray-700 text-gray-500 hover:border-gray-500'
                    }`}
                  >
                    {s === 'manual' ? 'Manual' : s === 'jamsulator' ? 'Jamsulator' : 'School'}
                  </button>
                ))}
              </div>
            </div>

            {/* Topics + subtopics */}
            <div className="flex flex-col gap-4">
              {topics.map((topic, ti) => (
                <div key={topic.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">

                  {/* Topic header */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs text-gray-600 w-5 shrink-0">T{ti + 1}</span>
                    <input
                      className="flex-1 bg-gray-800 text-white text-sm rounded-lg p-2 placeholder-gray-600 outline-none border border-gray-700 focus:border-gray-500"
                      placeholder="Topic name"
                      value={topic.name}
                      onChange={e => updateTopic(topic.id, { name: e.target.value })}
                    />
                    <button
                      onClick={() => removeTopic(topic.id)}
                      className="text-gray-700 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Objectives */}
                  <div className="mb-3 pl-8">
                    <input
                      className="w-full bg-gray-800 text-gray-400 text-xs rounded-lg p-2 placeholder-gray-600 outline-none border border-gray-700 focus:border-gray-500"
                      placeholder="Objectives (comma-separated, optional)"
                      value={topic.objectives}
                      onChange={e => updateTopic(topic.id, { objectives: e.target.value })}
                    />
                  </div>

                  {/* Subtopics */}
                  <div className="pl-8 flex flex-col gap-2">
                    {topic.subtopics.map((sub, si) => (
                      <div key={sub.id} className="flex items-center gap-2">
                        <span className="text-xs text-gray-700 w-4 shrink-0">↳</span>
                        <input
                          className="flex-1 bg-gray-800 text-white text-sm rounded-md p-2 placeholder-gray-600 outline-none border border-gray-700 focus:border-gray-500"
                          placeholder={`Subtopic ${si + 1}`}
                          value={sub.name}
                          onChange={e => updateSubtopic(topic.id, sub.id, e.target.value)}
                        />
                        <button
                          onClick={() => removeSubtopic(topic.id, sub.id)}
                          className="text-gray-700 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addSubtopic(topic.id)}
                      className="flex items-center gap-1.5 text-xs text-purple-500 hover:text-purple-400 transition-colors mt-1 w-fit"
                    >
                      <Plus size={12} />
                      Add subtopic
                    </button>
                  </div>

                </div>
              ))}
            </div>

            <button
              onClick={addTopic}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors w-fit"
            >
              <Plus size={14} />
              Add Topic
            </button>

            {/* Save */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
              <button
                onClick={handleSave}
                disabled={!projectName.trim() || saving}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm px-5 py-2.5 rounded-lg transition-colors"
              >
                {saving ? (
                  <><Loader2 size={14} className="animate-spin" /> Saving...</>
                ) : (
                  'Create Project'
                )}
              </button>
              <button
                onClick={() => navigate('/')}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}