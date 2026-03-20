import { Routes, Route } from 'react-router-dom'

function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<div>游戏大厅 — 待实现</div>} />
      <Route path="/game/:id" element={<div>游戏页面 — 待实现</div>} />
      <Route path="/result/:id" element={<div>汤底揭晓 — 待实现</div>} />
      <Route path="/profile" element={<div>个人中心 — 待实现</div>} />
      <Route path="/auth" element={<div>登录注册 — 待实现</div>} />
    </Routes>
  )
}

export default App
