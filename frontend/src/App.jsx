import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './components/AuthContext'
import Auth from './pages/Authentication/Authentication'
import Dashboard from './pages/Dashboard/Dashboard'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App