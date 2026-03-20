import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { QuotaBadge } from '../common/QuotaBadge'

export function Header() {
  const { isGuest, quotaFree, quotaPaid, logout } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-10 bg-warm-white/90 backdrop-blur border-b border-sand/40 px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-warm-brown text-lg">
          <span>🐢</span>
          <span>海龟汤像素馆</span>
        </Link>

        <div className="flex items-center gap-3">
          <QuotaBadge free={quotaFree} paid={quotaPaid} />

          {isGuest ? (
            <Link
              to="/auth"
              className="text-sm text-ocean hover:text-warm-brown transition-colors"
            >
              登录 / 注册
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="text-sm text-ocean hover:text-warm-brown transition-colors">
                个人中心
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-warm-mid hover:text-warm-brown transition-colors"
              >
                退出
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
