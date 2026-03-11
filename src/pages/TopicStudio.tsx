import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom'
import { BookOpen, HelpCircle, Layers, CheckSquare } from 'lucide-react'
import ContentBuilder from '../components/content/ContentBuilder'
import QuestionBuilder from '../components/questions/QuestionBuilder'
import FlashcardBuilder from '../components/flashcards/FlashcardBuilder'
import ReviewPublish from '../components/review/ReviewPublish'
import { useTopic } from '../hooks/useTopic'

const tools = [
  { icon: BookOpen, label: 'Content', path: 'content' },
  { icon: HelpCircle, label: 'Questions', path: 'questions' },
  { icon: Layers, label: 'Flashcards', path: 'flashcards' },
  { icon: CheckSquare, label: 'Review', path: 'review' },
]

export default function TopicStudio() {
  const navigate = useNavigate()
  const location = useLocation()
  const { topicId } = useParams()
  const { topic } = useTopic(topicId!)

  const goTo = (path: string) => {
    navigate(`/topic/${topicId}/${path}`)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Top Bar */}
      <header className="h-12 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-4 shrink-0">
        <span className="text-sm font-semibold text-purple-400 tracking-wide">KLASS Studio</span>
        <div className="w-px h-4 bg-gray-800" />
        <span className="text-sm text-gray-200 font-medium">
          {topic?.title || 'Loading...'}
        </span>
        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${
          topic?.status === 'published'
            ? 'bg-green-500/10 text-green-400 border-green-500/30'
            : 'bg-gray-800 text-gray-400 border-gray-700'
        }`}>
          {topic?.status === 'published' ? 'Published' : 'Draft'}
        </span>
        <div className="ml-auto text-xs text-gray-600">All changes saved</div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Icon Sidebar */}
        <aside className="w-12 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 gap-1">
          {tools.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname.includes(`/${path}`)
            return (
              <button
                key={path}
                onClick={() => goTo(path)}
                title={label}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors group relative
                  ${isActive
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-800 hover:text-gray-300'
                  }`}
              >
                <Icon size={18} />
                <span className="absolute left-11 bg-gray-800 text-gray-200 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-gray-700">
                  {label}
                </span>
              </button>
            )
          })}
        </aside>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto bg-gray-950">
          <Routes>
            <Route path="content" element={<ContentBuilder />} />
            <Route path="questions" element={<QuestionBuilder />} />
            <Route path="flashcards" element={<FlashcardBuilder />} />
            <Route path="review" element={<ReviewPublish />} />
            <Route index element={<Navigate to="content" replace />} />
          </Routes>
        </main>

      </div>
    </div>
  )
}