import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  register, verifyRegistration,
  login, resetPassword,
  getProfile
} from '../api/auth'
import { clearGuestToken, getOrCreateGuestToken } from '../utils/guestToken'

type Mode = 'login' | 'register' | 'forgot'
type Step = 'form' | 'verify'

export function Auth() {
  const navigate = useNavigate()
  const { setToken, setQuota } = useAuthStore()

  const [mode, setMode] = useState<Mode>('login')
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  function switchMode(next: Mode) {
    setMode(next)
    setStep('form')
    setError(null)
    setSuccessMsg(null)
    setCode('')
    setPassword('')
    setNewPassword('')
  }

  async function handleLogin() {
    setLoading(true); setError(null)
    try {
      const { token } = await login(email, password)
      await finishAuth(token)
    } catch (e) {
      setError(e instanceof Error ? e.message : '登录失败')
    } finally { setLoading(false) }
  }

  async function handleRegisterSend() {
    setLoading(true); setError(null)
    try {
      const guestToken = getOrCreateGuestToken() ?? undefined
      const { token } = await register(email, password, guestToken)
      await finishAuth(token)
    } catch (e) {
      setError(e instanceof Error ? e.message : '注册失败')
    } finally { setLoading(false) }
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

  async function handleForgotSend() {
    setError('找回密码功能暂时不可用，如需帮助请联系管理员')
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

  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white/80 rounded-2xl border border-sand/40 p-8 shadow-sm">

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🐢</div>
          <h1 className="font-bold text-warm-brown text-xl">
            {mode === 'login' ? '登录' : mode === 'register' ? '注册' : '找回密码'}
          </h1>
        </div>

        {/* Mode tabs (only show on form step) */}
        {step === 'form' && mode !== 'forgot' && (
          <div className="flex mb-6 bg-warm-white rounded-xl overflow-hidden border border-sand/40">
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 text-sm font-medium transition-colors
                  ${mode === m
                    ? 'bg-ocean text-white'
                    : 'text-warm-mid hover:text-warm-brown'
                  }`}
              >
                {m === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-4">

          {/* Email field — always shown on form step */}
          {step === 'form' && (
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              className="w-full px-4 py-2.5 rounded-xl border border-sand/60 bg-warm-white
                focus:outline-none focus:border-ocean text-sm"
              onKeyDown={e => e.key === 'Enter' && handlePrimaryAction()}
            />
          )}

          {/* Password field — login and register */}
          {step === 'form' && mode !== 'forgot' && (
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'register' ? '设置密码（至少 8 位）' : '请输入密码'}
              className="w-full px-4 py-2.5 rounded-xl border border-sand/60 bg-warm-white
                focus:outline-none focus:border-ocean text-sm"
              onKeyDown={e => e.key === 'Enter' && handlePrimaryAction()}
            />
          )}

          {/* OTP input — verify step */}
          {step === 'verify' && (
            <>
              <p className="text-sm text-warm-mid text-center">
                验证码已发送至 <span className="text-warm-brown font-medium">{email}</span>
              </p>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="请输入 6 位验证码"
                maxLength={6}
                className="w-full px-4 py-2.5 rounded-xl border border-sand/60 bg-warm-white
                  focus:outline-none focus:border-ocean text-sm text-center tracking-widest"
                onKeyDown={e => e.key === 'Enter' && handleVerifyAction()}
              />
            </>
          )}

          {/* New password — forgot verify step */}
          {step === 'verify' && mode === 'forgot' && (
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="设置新密码（至少 8 位）"
              className="w-full px-4 py-2.5 rounded-xl border border-sand/60 bg-warm-white
                focus:outline-none focus:border-ocean text-sm"
              onKeyDown={e => e.key === 'Enter' && handleVerifyAction()}
            />
          )}

          {/* Primary action button */}
          <button
            onClick={step === 'form' ? handlePrimaryAction : handleVerifyAction}
            disabled={loading || !canSubmit()}
            className="w-full py-2.5 bg-ocean text-white rounded-xl font-medium
              disabled:opacity-50 hover:bg-ocean/80 transition-colors"
          >
            {loading ? '处理中…' : getPrimaryLabel()}
          </button>

          {/* Secondary actions */}
          {step === 'form' && mode === 'login' && (
            <button
              onClick={() => switchMode('forgot')}
              className="text-sm text-warm-mid hover:text-warm-brown text-center"
            >
              忘记密码？
            </button>
          )}

          {step === 'verify' && (
            <button
              onClick={() => { setStep('form'); setCode(''); setError(null) }}
              className="text-sm text-warm-mid hover:text-warm-brown text-center"
            >
              重新输入邮箱
            </button>
          )}

          {mode === 'forgot' && step === 'form' && (
            <button
              onClick={() => switchMode('login')}
              className="text-sm text-warm-mid hover:text-warm-brown text-center"
            >
              ← 返回登录
            </button>
          )}
        </div>

        {successMsg && (
          <div className="mt-3 p-2 bg-green-50 text-green-700 rounded-lg text-sm text-center">
            {successMsg}
          </div>
        )}

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

  function handlePrimaryAction() {
    if (mode === 'login') return handleLogin()
    if (mode === 'register') return handleRegisterSend()
    return handleForgotSend()
  }

  function handleVerifyAction() {
    if (mode === 'register') return handleRegisterVerify()
    return handleResetVerify()
  }

  function canSubmit(): boolean {
    if (!email) return false
    if (step === 'verify') {
      if (code.length < 6) return false
      if (mode === 'forgot' && newPassword.length < 8) return false
      return true
    }
    if (mode === 'forgot') return true
    return password.length >= 8
  }

  function getPrimaryLabel(): string {
    if (step === 'verify') {
      return mode === 'forgot' ? '重置密码' : '验证并登录'
    }
    if (mode === 'login') return '登录'
    if (mode === 'register') return '立即注册'
    return '发送验证码'
  }
}
