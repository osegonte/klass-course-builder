import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import SubjectsHome from './pages/SubjectsHome'
import SubjectDetail from './pages/SubjectDetail'
import TopicDetail from './pages/TopicDetail'
import SubtopicStudio from './pages/SubtopicStudio'
import { Loader2 } from 'lucide-react'

function App() {
  const { user, loading } = useAuth()

  // Wait for Supabase to restore session before rendering anything
  // This prevents the flash where subjects load before the auth token is attached
  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <Loader2 size={20} className="text-gray-400 animate-spin" />
    </div>
  )

  if (!user) return <AuthPage />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                                                         element={<SubjectsHome />} />
        <Route path="/subject/:subjectId"                                       element={<SubjectDetail />} />
        <Route path="/subject/:subjectId/topic/:topicId"                        element={<TopicDetail />} />
        <Route path="/subject/:subjectId/topic/:topicId/subtopic/:subtopicId/*" element={<SubtopicStudio />} />
        <Route path="*"                                                         element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App