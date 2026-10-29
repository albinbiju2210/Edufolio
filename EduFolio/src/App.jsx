
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Portfolio from './pages/Portfolio'
import ProfileEditor from './pages/ProfileEditor'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/portfolio/:username" element={<Portfolio />} />
        <Route
          path="/profile/edit/:username"
          element={<ProfileEditor />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App