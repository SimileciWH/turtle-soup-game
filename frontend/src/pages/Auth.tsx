import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  register, verifyRegistration,
  login, forgotPassword, resetPassword,
  getProfile
} from '../api/auth'
import { clearGuestToken, getOrCreateGuestToken } from '../utils/guestToken'

type Mode = 'login' | 'register' | 'forgot'

const OTP_COOLDOWN = 60

export function Auth() {
  const navigate = useNavigate()
  const { setToken, setQuota } = useAuthStore()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [emailNotFound, setEmailNotFound] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setOtpSent(false)
    setCountdown(0)
    setCode('')
    setPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setEmailNotFound(false)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  function startCountdown() {
    setCountdown(OTP_COOLDOWN)
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); timerRef.current = null; return 0 }
        return prev - 1
      })
    }, 1000)
  }

  async function handleSendRegisterOtp() {
    if (!email || password.length < 8 || password !== confirmPassword) return
    setSendingOtp(true); setError(null)
    try {
      const guestToken = getOrCreateGuestToken() ?? undefined
      await register(email, password, guestToken)
      setOtpSent(true)
      startCountdown()
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送失败')
    } finally { setSendingOtp(false) }
  }

  async function handleRegisterVerify() {
    setLoading(true); setError(null)
    try {
      const guestToken = getOrCreateGuestToken() ?? undefined
      const { token } = await verifyRegistration(email, code, guestToken)
      await finishAuth(token)
    } catch (e) {
      setError(e instanceof Error ? e.message : '验证失败')
    } finally { setLoading(false) }
  }

  async function handleLogin() {
    setLoading(true); setError(null); setEmailNotFound(false)
    try {
      const { token } = await login(email, password)
      await finishAuth(token)
    } catch (e) {
      if (e instanceof Error && e.message.includes('尚未注册')) {
        setEmailNotFound(true)
        setError('该邮箱尚未注册')
      } else {
        setError(e instanceof Error ? e.message : '登录失败')
      }
    } finally { setLoading(false) }
  }

  async function handleSendForgotOtp() {
    if (!email) return
    setSendingOtp(true); setError(null)
    try {
      await forgotPassword(email)
      setOtpSent(true)
      startCountdown()
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送失败')
    } finally { setSendingOtp(false) }
  }

  async function handleResetVerify() {
    setLoading(true); setError(null)
    try {
      const { token } = await resetPassword(email, code, newPassword)
      await finishAuth(token)
    } catch (e) {
      setError(e instanceof Error ? e.message : '重置失败')
    } finally { setLoading(false) }
  }

  async function finishAuth(token: string) {
    clearGuestToken()
    setToken(token, false)
    const profile = await getProfile()
    setQuota(profile.quota_free, profile.quota_paid)
    navigate('/')
  }

  const inputCls = `w-full px-4 py-2.5 rounded-xl border border-sand/60 bg-warm-white
    focus:outline-none focus:border-ocean text-sm`

  const sendBtnCls = `px-3 py-2 text-xs rounded-lg font-medium transition-colors shrink-0
    disabled:opacity-50`

  return (
    <div className="min-h-dvh bg-warm-white flex items-center justify-center px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-sm bg-white/80 rounded-2xl border border-sand/40 p-8 shadow-sm">

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🐢</div>
          <h1 className="font-bold text-warm-brown text-xl">
            {mode === 'login' ? '登录' : mode === 'register' ? '注册' : '找回密码'}
          </h1>
        </div>

        {/* Mode tabs */}
        {mode !== 'forgot' && (
          <div className="flex mb-6 bg-warm-white rounded-xl overflow-hidden border border-sand/40">
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 text-sm font-medium transition-colors
                  ${mode === m ? 'bg-ocean text-white' : 'text-warm-mid hover:text-warm-brown'}`}
              >
                {m === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-4">

          {/* Email — all modes */}
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setEmailNotFound(false) }}
            placeholder="请输入邮箱"
            className={inputCls}
            onKeyDown={e => e.key === 'Enter' && mode === 'login' && handleLogin()}
          />

          {/* ── LOGIN ─────────────────────────────────── */}
          {mode === 'login' && (
            <>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码"
                className={inputCls}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <button
                onClick={handleLogin}
                disabled={loading || !email || !password}
                className="w-full py-2.5 bg-ocean text-white rounded-xl font-medium
                  disabled:opacity-50 hover:bg-ocean/80 transition-colors"
              >
                {loading ? '登录中…' : '登录'}
              </button>
              {emailNotFound && (
                <button
                  onClick={() => { switchMode('register') }}
                  className="text-sm text-ocean hover:underline text-center"
                >
                  该邮箱未注册，前往注册 →
                </button>
              )}
              <button
                onClick={() => switchMode('forgot')}
                className="text-sm text-warm-mid hover:text-warm-brown text-center"
              >
                忘记密码？
              </button>
            </>
          )}

          {/* ── REGISTER (single page) ────────────────── */}
          {mode === 'register' && (
            <>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="设置密码（至少 8 位）"
                className={inputCls}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="确认密码"
                className={inputCls}
              />
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-coral -mt-2">两次密码不一致</p>
              )}

              {/* OTP row: input + send button */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="输入验证码"
                  maxLength={6}
                  className={`${inputCls} text-center tracking-widest`}
                />
                <button
                  onClick={handleSendRegisterOtp}
                  disabled={
                    sendingOtp || countdown > 0 ||
                    !email || password.length < 8 || password !== confirmPassword
                  }
                  className={`${sendBtnCls} bg-ocean text-white hover:bg-ocean/80`}
                >
                  {countdown > 0 ? `${countdown}s` : sendingOtp ? '发送中' : '获取验证码'}
                </button>
              </div>

              {otpSent && (
                <p className="text-xs text-green-600 text-center">
                  验证码已发送至 {email}
                </p>
              )}

              <button
                onClick={handleRegisterVerify}
                disabled={loading || !email || password.length < 8 || code.length < 6}
                className="w-full py-2.5 bg-ocean text-white rounded-xl font-medium
                  disabled:opacity-50 hover:bg-ocean/80 transition-colors"
              >
                {loading ? '验证中…' : '完成注册'}
              </button>
            </>
          )}

          {/* ── FORGOT (single page) ─────────────────── */}
          {mode === 'forgot' && (
            <>
              {/* OTP row */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="输入验证码"
                  maxLength={6}
                  className={`${inputCls} text-center tracking-widest`}
                />
                <button
                  onClick={handleSendForgotOtp}
                  disabled={sendingOtp || countdown > 0 || !email}
                  className={`${sendBtnCls} bg-ocean text-white hover:bg-ocean/80`}
                >
                  {countdown > 0 ? `${countdown}s` : sendingOtp ? '发送中' : '发送验证码'}
                </button>
              </div>

              {otpSent && (
                <p className="text-xs text-green-600 text-center">
                  验证码已发送至 {email}
                </p>
              )}

              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="设置新密码（至少 8 位）"
                className={inputCls}
              />

              <button
                onClick={handleResetVerify}
                disabled={loading || !email || code.length < 6 || newPassword.length < 8}
                className="w-full py-2.5 bg-ocean text-white rounded-xl font-medium
                  disabled:opacity-50 hover:bg-ocean/80 transition-colors"
              >
                {loading ? '重置中…' : '重置密码'}
              </button>

              <button
                onClick={() => switchMode('login')}
                className="text-sm text-warm-mid hover:text-warm-brown text-center"
              >
                ← 返回登录
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="mt-3 p-2 bg-coral/10 text-coral rounded-lg text-sm text-center">
            {error}
          </div>
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
