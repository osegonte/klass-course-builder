import { useNavigate } from 'react-router-dom'
import { ChevronRight, Upload, RefreshCw } from 'lucide-react'
import { useSubjects } from '../hooks/useStructure'

export default function ProjectsHome() {
  const navigate = useNavigate()
  const { subjects, loading, refetch } = useSubjects()

  return (
    <div className="min-h-screen bg-stone-50">

      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-sm font-semibold tracking-widest uppercase text-gray-900">KLASS Studio</h1>
        <p className="text-xs text-gray-400 mt-0.5">Course Content Builder</p>
      </header>

      <div className="max-w-2xl mx-auto py-12 px-6 flex flex-col gap-10">

        {/* Subjects */}
        <section>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Subjects</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {subjects.length > 0
                  ? `${subjects.length} subject${subjects.length !== 1 ? 's' : ''} — select one to build content`
                  : 'Import a curriculum file to get started'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refetch}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1"
                title="Refresh"
              >
                <RefreshCw size={13} />
              </button>
              <button
                onClick={() => navigate('/import')}
                className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
              >
                <Upload size={11} />
                Import Curriculum
              </button>
            </div>
          </div>

          {loading && (
            <div className="border border-gray-200 rounded bg-white divide-y divide-gray-100">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-5 h-2.5 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {!loading && subjects.length === 0 && (
            <div className="border border-dashed border-gray-300 rounded p-10 text-center">
              <p className="text-sm text-gray-500 mb-1">No subjects yet.</p>
              <p className="text-xs text-gray-400 mb-5">
                Export a curriculum JSON from Jamsulator or any connected app,
                then import it here.
              </p>
              <button
                onClick={() => navigate('/import')}
                className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors mx-auto"
              >
                <Upload size={12} />
                Import Curriculum
              </button>
            </div>
          )}

          {!loading && subjects.length > 0 && (
            <div className="flex flex-col divide-y divide-gray-100 border border-gray-200 rounded bg-white overflow-hidden">
              {subjects.map((subject, index) => (
                <button
                  key={subject.id}
                  onClick={() => navigate(`/project/${subject.id}`)}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors text-left group"
                >
                  <span className="text-xs text-gray-300 w-5 shrink-0 tabular-nums">{index + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{subject.name}</p>
                    {subject.source && (
                      <p className="text-xs text-gray-400 mt-0.5">from {subject.source}</p>
                    )}
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Standalone workspaces — future */}
        <section>
          <div className="mb-4 pb-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Standalone Workspaces</h2>
            <p className="text-xs text-gray-400 mt-0.5">Build without connecting an external app</p>
          </div>
          <div className="border border-dashed border-gray-200 rounded p-6 text-center">
            <p className="text-xs text-gray-400">Coming soon</p>
          </div>
        </section>

      </div>
    </div>
  )
}