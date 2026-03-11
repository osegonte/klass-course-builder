import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import TopicStudio from './pages/TopicStudio'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/topic/:topicId/*" element={<TopicStudio />} />
        <Route path="*" element={<Navigate to="/topic/11111111-1111-1111-1111-111111111111" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App