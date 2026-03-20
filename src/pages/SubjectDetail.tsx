import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, ChevronRight, BookOpen, Circle } from 'lucide-react'
import { useSubject, useTopics } from '../hooks/useStructure'
import type { CourseStatus } from '../types/content'

const STATUS_LABEL: Record<CourseStatus, string> = {
  draft:       'Draft',
  in_progress: 'In Progress',
  complete:    'Complete',
  published:   'Published',
}

const STATUS_STYLE: Record<CourseStatus, string> = {
  draft:       'bg-gray-100 text-gray-500',
  in_progress: 'bg-yellow-100 text-yellow-700',
  complete:    'bg-blue-100 text-blue-700',
  published:   'bg-green-100 text-green-700',
}

function NewTopicModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, desc: string) => Promise<void> }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onCreate(name.trim(), desc.trim())
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-gray-900">New Course</h2>
        <p className="text-xs text-gray-400">Each course is a self-contained topic teachers will build out completely.</p>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Course name</label>
          <input
            autoFocus
            className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="e.g. Cell Biology, Differentiation, Indices"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Description <span className="text-gray-400">(optional)</span></label>
          <input
            className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="Brief overview of what this course covers"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-xs text-gray-500 px-3 py-1.5 rounded hover:bg-gray-100">Cancel</button>
          <button
            onClick={submit}
            disabled={!name.trim() || saving}
            className="text-xs bg-gray-900 text-white px-4 py-1.5 rounded hover:bg-gray-700 disabled:opacity-40"
          >
            {saving ? 'Creating…' : 'Create Course'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SubjectDetail() {
  const navigate = useNavigate()
  const { subjectId } = useParams<{ subjectId: string }>()
  const { subject, loading: subjectLoading } = useSubject(subjectId!)
  const { topics, loading: topicsLoading, createTopic } = useTopics(subjectId!)
  const [showModal, setShowModal] = useState(false)

  const loading = subjectLoading || topicsLoading

  // Course completion summary
  const summary = {
    total:       topics.length,
    draft:       topics.filter(t => t.status === 'draft').length,
    in_progress: topics.filter(t => t.status === 'in_progress').length,
    complete:    topics.filter(t => t.status === 'complete').length,
    published:   topics.filter(t => t.status === 'published').length,
  }

  const handleCreate = async (name: string, desc: string) => {
    const topic = await createTopic(name, desc)
    if (topic) navigate(`/subject/${subjectId}/topic/${topic.id}`)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-700">
          <ArrowLeft size={15} />
        </button>
        <div className="w-px h-4 bg-gray-200" />
        <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">KLASS</span>
        {subject && (
          <>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-medium text-gray-700">{subject.name}</span>
          </>
        )}
      </header>

      <div className="max-w-2xl mx-auto py-10 px-6 flex flex-col gap-8">

        {/* Subject header + progress summary */}
        {subject && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{subject.name}</h1>
                {subject.description && <p className="text-xs text-gray-400 mt-0.5">{subject.description}</p>}
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 shrink-0 ml-4"
              >
                <Plus size={11} />
                New Course
              </button>
            </div>

            {summary.total > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-gray-400">{summary.total} course{summary.total !== 1 ? 's' : ''}</span>
                {(['published', 'complete', 'in_progress', 'draft'] as CourseStatus[]).map(s => (
                  summary[s] > 0 && (
                    <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[s]}`}>
                      {summary[s]} {STATUS_LABEL[s]}
                    </span>
                  )
                ))}
              </div>
            )}
          </div>
        )}

        {/* Courses list */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Courses</h2>

          {loading && (
            <div className="border border-gray-200 rounded bg-white divide-y divide-gray-100">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-4">
                  <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {!loading && topics.length === 0 && (
            <div className="border border-dashed border-gray-300 rounded p-10 text-center">
              <BookOpen size={24} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-1">No courses yet.</p>
              <p className="text-xs text-gray-400 mb-5">
                Create your first course. You'll write the introduction, then expand into subtopics.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 mx-auto"
              >
                <Plus size={12} />
                New Course
              </button>
            </div>
          )}

          {!loading && topics.length > 0 && (
            <div className="flex flex-col divide-y divide-gray-100 border border-gray-200 rounded bg-white overflow-hidden">
              {topics.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => navigate(`/subject/${subjectId}/topic/${topic.id}`)}
                  className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Circle
                      size={8}
                      className={`shrink-0 ${
                        topic.status === 'published'   ? 'fill-green-500 text-green-500' :
                        topic.status === 'complete'    ? 'fill-blue-500 text-blue-500' :
                        topic.status === 'in_progress' ? 'fill-yellow-500 text-yellow-500' :
                        'fill-gray-300 text-gray-300'
                      }`}
                    />
                    <span className="text-sm font-medium text-gray-900 truncate">{topic.name}</span>
                    {!topic.introComplete && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded shrink-0">Intro needed</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium hidden sm:inline ${STATUS_STYLE[topic.status]}`}>
                      {STATUS_LABEL[topic.status]}
                    </span>
                    <ChevronRight size={14} className="text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {showModal && (
        <NewTopicModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}
    </div>
  )
}