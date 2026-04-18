import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import SignalPage from './pages/SignalPage'

export default function App() {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '64px' }}>
        <Routes>
          <Route path="/"        element={<LandingPage />} />
          <Route path="/signals" element={<SignalPage />} />
          <Route path="*"        element={<LandingPage />} />
        </Routes>
      </div>
    </>
  )
}
