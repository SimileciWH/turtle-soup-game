import { Routes, Route } from 'react-router-dom'
import { Lobby } from './pages/Lobby'
import { Auth } from './pages/Auth'
import { Game } from './pages/Game'
import { Result } from './pages/Result'
import { Profile } from './pages/Profile'

function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/game/:id" element={<Game />} />
      <Route path="/result/:id" element={<Result />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  )
}

export default App
