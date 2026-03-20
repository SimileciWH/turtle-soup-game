import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { sendEmailCode, verifyEmailCode, getProfile } from '../api/auth'
import { clearGuestToken } from '../utils/guestToken'

type Step = 'email' | 'code'

export function Auth() {
  const navigate = useNavigate()
  const { setToken, setQuota } = useAuthStore()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend() {
    if (!email) return
    setLoading(true)
    setError(null)
    try {
      await sendEmailCode(email)
      setStep('code')
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    if (!code) return
    setLoading(true)
    setError(null)
    try {
      const guestToken = localStorage.getItem('hgt_guest_token') ?? undefined
      const { token } = await verifyEmailCode(email, code, guestToken)
      clearGuestToken()
      setToken(token, false)
      const profile = await getProfile()
      setQuota(profile.quota_free, profile.quota_paid)
      navigate('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : '验证失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white/80 rounded-2xl border border-sand/40 p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🐢</div>
          <h1 className="font-bold text-warm-brown text-xl">登录 / 注册</h1>
          <p className="text-sm text-warm-mid mt-1">输入邮箱，免密码登录</p>
        </div>

        {step === 'email' ? (
          <div className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              className="w-full px-4 py-2.5 rounded-xl border border-sand/60 bg-warm-white focus:outline-none focus:border-ocean text-sm"
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={loading || !email}
              className="w-full py-2.5 bg-ocean text-white rounded-xl font-medium disabled:opacity-50 hover:bg-ocean/80 transition-colors"
            >
              {loading ? '发送中…' : '发送验证码'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-warm-mid text-center">
              验证码已发送至 <span className="text-warm-brown font-medium">{email}</span>
            </p>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="请输入 6 位验证码"
              maxLength={6}
              className="w-full px-4 py-2.5 rounded-xl border border-sand/60 bg-warm-white focus:outline-none focus:border-ocean text-sm text-center tracking-widest"
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
            />
            <button
              onClick={handleVerify}
              disabled={loading || code.length < 6}
              className="w-full py-2.5 bg-ocean text-white rounded-xl font-medium disabled:opacity-50 hover:bg-ocean/80 transition-colors"
            >
              {loading ? '验证中…' : '登录'}
            </button>
            <button
              onClick={() => { setStep('email'); setCode(''); setError(null) }}
              className="text-sm text-warm-mid hover:text-warm-brown text-center"
            >
              重新输入邮箱
            </button>
          </div>
        )}

        {error && (
          <div className="mt-3 p-2 bg-coral/10 text-coral rounded-lg text-sm text-center">{error}</div>
        )}

        <button
          onClick={() => navigate(-1)}
          className="mt-4 w-full text-sm text-warm-mid hover:text-warm-brown text-center"
        >
          返回大厅
        </button>
      </div>
    </div>
  )
}
