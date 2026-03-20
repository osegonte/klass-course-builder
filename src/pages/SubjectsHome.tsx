import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus, RefreshCw, BookOpen } from 'lucide-react'
import { useSubjects } from '../hooks/useStructure'
import { useAuth, signOut } from '../hooks/useAuth'

function NewSubjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, desc: string) => Promise<void> }) {
  const [name, setName]   = useState('')
  const [desc, setDesc]   = useState('')
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
        <h2 className="text-sm font-semibold text-gray-900">New Subject</h2>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Subject name</label>
          <input
            autoFocus
            className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="e.g. Mathematics, English Language"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Description <span className="text-gray-400">(optional)</span></label>
          <input
            className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="e.g. Core curriculum for SS2"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="text-xs text-gray-500 px-3 py-1.5 rounded hover:bg-gray-100">Cancel</button>
          <button
            type="button"
            onClick={submit}
            disabled={!name.trim() || saving}
            className="text-xs bg-gray-900 text-white px-4 py-1.5 rounded hover:bg-gray-700 disabled:opacity-40"
          >
            {saving ? 'Creating…' : 'Create Subject'}
          </button>
        </div>
      </div>
    </div>
  )
}


function SignOutButton() {
  const { user } = useAuth()
  const [signing, setSigning] = useState(false)

  const handleSignOut = async () => {
    setSigning(true)
    await signOut()
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 hidden sm:inline">{user?.email}</span>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signing}
        className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-2.5 py-1 rounded hover:border-gray-400 transition-colors"
      >
        {signing ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  )
}

export default function SubjectsHome() {
  const navigate    = useNavigate()
  const { subjects, loading, refetch, createSubject } = useSubjects()
  const [showModal, setShowModal] = useState(false)

  const handleCreate = async (name: string, desc: string) => {
    const subject = await createSubject(name, desc)
    if (subject) navigate(`/subject/${subject.id}`)
  }

  // Split into priority and other, demo last
  const priority = subjects.filter(s => s.isPriority && !s.name.startsWith('[DEMO]'))
  const others   = subjects.filter(s => !s.isPriority && !s.name.startsWith('[DEMO]'))
  const demo     = subjects.filter(s => s.name.startsWith('[DEMO]'))

  const SubjectRow = ({ subject }: { subject: typeof subjects[0] }) => (
    <button
      key={subject.id}
      type="button"
      onClick={() => navigate(`/subject/${subject.id}`)}
      className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <BookOpen size={14} className={`shrink-0 ${subject.isPriority ? 'text-gray-700' : 'text-gray-300'}`} />
        <span className={`text-sm font-medium truncate ${subject.isPriority ? 'text-gray-900' : 'text-gray-600'}`}>
          {subject.name}
        </span>
        {subject.isPriority && (
          <span className="text-xs bg-gray-900 text-white px-1.5 py-0.5 rounded shrink-0 hidden sm:inline">Core</span>
        )}
        {subject.name.startsWith('[DEMO]') && (
          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded shrink-0">Demo</span>
        )}
      </div>
      <ChevronRight size={14} className="text-gray-400 shrink-0" />
    </button>
  )

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold tracking-widest uppercase text-gray-900">KLASS Studio</h1>
            <p className="text-xs text-gray-400 mt-0.5">Course Content Builder</p>
          </div>
          <SignOutButton />
        </div>
      </header>

      <div className="max-w-2xl mx-auto py-12 px-6 flex flex-col gap-8">
        <section>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Subjects</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {subjects.filter(s => !s.name.startsWith('[DEMO]')).length > 0
                  ? `${subjects.filter(s => !s.name.startsWith('[DEMO]')).length} subjects`
                  : 'No subjects yet'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={refetch} className="text-gray-400 hover:text-gray-700 p-1" title="Refresh">
                <RefreshCw size={13} />
              </button>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700"
              >
                <Plus size={11} /> New Subject
              </button>
            </div>
          </div>

          {loading && (
            <div className="border border-gray-200 rounded bg-white divide-y divide-gray-100">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-4 h-3 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {!loading && subjects.length === 0 && (
            <div className="border border-dashed border-gray-300 rounded p-10 text-center">
              <BookOpen size={24} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-1">No subjects yet.</p>
              <p className="text-xs text-gray-400 mb-5">Create your first subject to start building courses.</p>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 mx-auto"
              >
                <Plus size={12} /> New Subject
              </button>
            </div>
          )}

          {!loading && subjects.length > 0 && (
            <div className="flex flex-col gap-4">

              {/* Priority subjects */}
              {priority.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 px-1">Core subjects</p>
                  <div className="flex flex-col divide-y divide-gray-100 border border-gray-200 rounded bg-white overflow-hidden">
                    {priority.map(s => <SubjectRow key={s.id} subject={s} />)}
                  </div>
                </div>
              )}

              {/* Other subjects */}
              {others.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 px-1">All subjects</p>
                  <div className="flex flex-col divide-y divide-gray-100 border border-gray-200 rounded bg-white overflow-hidden">
                    {others.map(s => <SubjectRow key={s.id} subject={s} />)}
                  </div>
                </div>
              )}

              {/* Demo subjects */}
              {demo.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 px-1">Demo</p>
                  <div className="flex flex-col divide-y divide-gray-100 border border-gray-200 rounded bg-white overflow-hidden">
                    {demo.map(s => <SubjectRow key={s.id} subject={s} />)}
                  </div>
                </div>
              )}

            </div>
          )}
        </section>
      </div>

      {showModal && (
        <NewSubjectModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}
    </div>
  )
}