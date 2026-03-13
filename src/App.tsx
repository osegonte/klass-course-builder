import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProjectsHome from './pages/ProjectsHome'
import ProjectDetail from './pages/ProjectDetail'
import TopicDetail from './pages/TopicDetail'
import SubtopicStudio from './pages/SubtopicStudio'
import ImportCurriculum from './pages/ImportCurriculum'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectsHome />} />
        <Route path="/import" element={<ImportCurriculum />} />
        <Route path="/project/:projectId" element={<ProjectDetail />} />
        <Route path="/project/:projectId/topic/:topicId" element={<TopicDetail />} />
        <Route path="/project/:projectId/topic/:topicId/subtopic/:subtopicId/*" element={<SubtopicStudio />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App