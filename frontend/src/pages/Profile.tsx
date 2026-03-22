import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getProfile, redeemCode, changePassword, deleteAccount, sendDeleteOtp } from '../api/auth'
import { getHistory } from '../api/profile'
import type { HistoryResponse } from '../types/api'

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: '简单', MEDIUM: '中等', HARD: '困难'
}

// ── Change Password ───────────────────────────────────────

interface ChangePwdState {
  current: string
  next: string
  confirm: string
  loading: boolean
  msg: { ok: boolean; text: string } | null
}

function initChangePwd(): ChangePwdState {
  return { current: '', next: '', confirm: '', loading: false, msg: null }
}

// ── Delete Account ────────────────────────────────────────

interface DeleteState {
  open: boolean
  password: string
  code: string
  otpSent: boolean
  sendingOtp: boolean
  countdown: number
  loading: boolean
  error: string | null
}

function initDelete(): DeleteState {
  return {
    open: false, password: '', code: '', otpSent: false,
    sendingOtp: false, countdown: 0, loading: false, error: null
  }
}

// ── Main Component ────────────────────────────────────────

export function Profile() {
  const navigate = useNavigate()
  const { isGuest, quotaFree, quotaPaid, setQuota, logout } = useAuthStore()

  const [history, setHistory] = useState<HistoryResponse | null>(null)
  const [redeemInput, setRedeemInput] = useState('')
  const [redeemMsg, setRedeemMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [pwd, setPwd] = useState<ChangePwdState>(initChangePwd)
  const [del, setDel] = useState<DeleteState>(initDelete)
  const delTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isGuest) { navigate('/auth'); return }
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    try {
      const [profile, hist] = await Promise.all([getProfile(), getHistory()])
      setQuota(profile.quota_free, profile.quota_paid)
      setHistory(hist)
    } catch { /* ignore */ }
  }

  async function handleRedeem() {
    const code = redeemInput.trim().toUpperCase()
    if (!code) return
    setRedeemLoading(true); setRedeemMsg(null)
    try {
      const res = await redeemCode(code)
      setQuota(quotaFree, res.quota_paid_total)
      setRedeemMsg({ ok: true, text: `兑换成功！获得 ${res.quota_value} 局，当前余额 ${res.quota_paid_total} 局` })
      setRedeemInput('')
    } catch (e) {
      setRedeemMsg({ ok: false, text: e instanceof Error ? e.message : '兑换失败' })
    } finally { setRedeemLoading(false) }
  }

  async function handleChangePassword() {
    if (pwd.next !== pwd.confirm) {
      setPwd(s => ({ ...s, msg: { ok: false, text: '两次输入的新密码不一致' } }))
      return
    }
    if (pwd.next.length < 8) {
      setPwd(s => ({ ...s, msg: { ok: false, text: '新密码至少 8 位' } }))
      return
    }
    setPwd(s => ({ ...s, loading: true, msg: null }))
    try {
      await changePassword(pwd.current, pwd.next)
      setPwd({ ...initChangePwd(), msg: { ok: true, text: '密码修改成功' } })
    } catch (e) {
      setPwd(s => ({ ...s, loading: false, msg: { ok: false, text: e instanceof Error ? e.message : '修改失败' } }))
    }
  }

  async function handleSendDeleteOtp() {
    setDel(s => ({ ...s, sendingOtp: true, error: null }))
    try {
      await sendDeleteOtp()
      setDel(s => ({ ...s, otpSent: true, sendingOtp: false, countdown: 60 }))
      delTimerRef.current = setInterval(() => {
        setDel(s => {
          if (s.countdown <= 1) { clearInterval(delTimerRef.current!); return { ...s, countdown: 0 } }
          return { ...s, countdown: s.countdown - 1 }
        })
      }, 1000)
    } catch (e) {
      setDel(s => ({ ...s, sendingOtp: false, error: e instanceof Error ? e.message : '发送失败' }))
    }
  }

  async function handleDeleteAccount() {
    setDel(s => ({ ...s, loading: true, error: null }))
    try {
      await deleteAccount(del.password, del.code || undefined)
      logout()
      navigate('/')
    } catch (e) {
      setDel(s => ({ ...s, loading: false, error: e instanceof Error ? e.message : '注销失败' }))
    }
  }

  function handleLogout() { logout(); navigate('/') }

  return (
    <div className="min-h-dvh bg-warm-white">
      <header className="sticky top-0 bg-warm-white/90 backdrop-blur border-b border-sand/40 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link to="/" className="text-sm text-warm-mid hover:text-warm-brown">← 大厅</Link>
          <span className="font-bold text-warm-brown">个人中心</span>
          <button onClick={handleLogout} className="text-sm text-warm-mid hover:text-coral">退出</button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">
        <QuotaCard quotaFree={quotaFree} quotaPaid={quotaPaid} />
        <RedeemCard
          input={redeemInput} setInput={setRedeemInput}
          msg={redeemMsg} loading={redeemLoading}
          onRedeem={handleRedeem}
        />
        <HistoryCard history={history} />
        <ChangePwdCard pwd={pwd} setPwd={setPwd} onSubmit={handleChangePassword} />
        <DangerZone onDeleteClick={() => setDel(s => ({ ...s, open: true }))} />
      </main>

      {del.open && (
        <DeleteModal
          del={del} setDel={setDel}
          onConfirm={handleDeleteAccount}
          onSendOtp={handleSendDeleteOtp}
        />
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────

function QuotaCard({ quotaFree, quotaPaid }: { quotaFree: number; quotaPaid: number }) {
  return (
    <div className="bg-white/70 rounded-2xl border border-sand/40 p-5">
      <h2 className="font-bold text-warm-brown mb-3">游戏余额</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-sky/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-ocean">{quotaFree}</div>
          <div className="text-xs text-warm-mid mt-0.5">免费局数</div>
        </div>
        <div className="bg-sand/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-warm-brown">{quotaPaid}</div>
          <div className="text-xs text-warm-mid mt-0.5">付费局数</div>
        </div>
      </div>
    </div>
  )
}

function RedeemCard({
  input, setInput, msg, loading, onRedeem
}: {
  input: string
  setInput: (v: string) => void
  msg: { ok: boolean; text: string } | null
  loading: boolean
  onRedeem: () => void
}) {
  return (
    <div className="bg-white/70 rounded-2xl border border-sand/40 p-5">
      <h2 className="font-bold text-warm-brown mb-3">兑换码</h2>
      <div className="flex gap-2">
        <input
          type="text" value={input}
          onChange={e => setInput(e.target.value.toUpperCase())}
          placeholder="输入兑换码，如 PLAY-0005"
          onKeyDown={e => e.key === 'Enter' && onRedeem()}
          className="flex-1 px-3 py-2 rounded-xl border border-sand/60 bg-warm-white text-sm
                     focus:outline-none focus:border-ocean tracking-wider"
        />
        <button
          onClick={onRedeem} disabled={loading || !input.trim()}
          className="px-4 py-2 bg-ocean text-white rounded-xl text-sm disabled:opacity-50 hover:bg-ocean/80"
        >
          {loading ? '…' : '兑换'}
        </button>
      </div>
      {msg && (
        <div className={`mt-2 text-sm ${msg.ok ? 'text-leaf' : 'text-coral'}`}>
          {msg.ok ? '✅ ' : '❌ '}{msg.text}
        </div>
      )}
    </div>
  )
}

function HistoryCard({ history }: { history: HistoryResponse | null }) {
  return (
    <div className="bg-white/70 rounded-2xl border border-sand/40 p-5">
      <h2 className="font-bold text-warm-brown mb-3">
        游戏历史 {history ? `（共 ${history.total} 局）` : ''}
      </h2>
      {!history ? (
        <div className="text-warm-mid text-sm text-center py-4">加载中…</div>
      ) : history.sessions.length === 0 ? (
        <div className="text-warm-mid text-sm text-center py-4">还没有游戏记录</div>
      ) : (
        <div className="flex flex-col gap-2">
          {history.sessions.map(s => (
            <div key={s.id}
              className="flex items-center justify-between py-2 border-b border-sand/30 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-warm-brown truncate">{s.puzzle_title}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-warm-mid">{DIFFICULTY_LABEL[s.difficulty]}</span>
                  <span className="text-xs text-warm-mid">{s.question_count} 问</span>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ml-2 shrink-0 ${
                s.status === 'WON' ? 'bg-leaf/20 text-leaf' : 'bg-warm-mid/10 text-warm-mid'
              }`}>
                {s.status === 'WON' ? '成功' : '放弃'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ChangePwdCard({
  pwd, setPwd, onSubmit
}: {
  pwd: ChangePwdState
  setPwd: React.Dispatch<React.SetStateAction<ChangePwdState>>
  onSubmit: () => void
}) {
  const [open, setOpen] = useState(false)
  const inputCls = 'w-full px-3 py-2 rounded-xl border border-sand/60 bg-warm-white text-sm focus:outline-none focus:border-ocean'
  return (
    <div className="bg-white/70 rounded-2xl border border-sand/40 p-5">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 className="font-bold text-warm-brown">修改密码</h2>
        <span className="text-warm-mid text-sm">{open ? '收起 ▲' : '展开 ▼'}</span>
      </button>
      {open && (
        <div className="mt-4 flex flex-col gap-3">
          <input type="password" placeholder="当前密码" value={pwd.current}
            onChange={e => setPwd(s => ({ ...s, current: e.target.value }))}
            className={inputCls} />
          <input type="password" placeholder="新密码（至少 8 位）" value={pwd.next}
            onChange={e => setPwd(s => ({ ...s, next: e.target.value }))}
            className={inputCls} />
          <input type="password" placeholder="再次输入新密码" value={pwd.confirm}
            onChange={e => setPwd(s => ({ ...s, confirm: e.target.value }))}
            className={inputCls} />
          <button
            onClick={onSubmit}
            disabled={pwd.loading || !pwd.current || !pwd.next || !pwd.confirm}
            className="py-2 bg-ocean text-white rounded-xl text-sm disabled:opacity-50 hover:bg-ocean/80"
          >
            {pwd.loading ? '修改中…' : '确认修改'}
          </button>
          {pwd.msg && (
            <div className={`text-sm text-center ${pwd.msg.ok ? 'text-leaf' : 'text-coral'}`}>
              {pwd.msg.text}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DangerZone({ onDeleteClick }: { onDeleteClick: () => void }) {
  return (
    <div className="bg-white/70 rounded-2xl border border-coral/30 p-5">
      <h2 className="font-bold text-coral mb-1">危险操作</h2>
      <p className="text-xs text-warm-mid mb-3">注销账号后，游戏余额和历史记录将被删除，30 天内可联系管理员恢复。</p>
      <button
        onClick={onDeleteClick}
        className="w-full py-2 border border-coral text-coral rounded-xl text-sm hover:bg-coral hover:text-white transition-colors"
      >
        注销账号
      </button>
    </div>
  )
}

function DeleteModal({
  del, setDel, onConfirm, onSendOtp
}: {
  del: DeleteState
  setDel: React.Dispatch<React.SetStateAction<DeleteState>>
  onConfirm: () => void
  onSendOtp: () => void
}) {
  const inputCls = `w-full px-3 py-2 rounded-xl border border-sand/60 bg-warm-white text-sm
    focus:outline-none focus:border-coral mb-3`
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl">
        <h3 className="font-bold text-warm-brown text-lg mb-2">确认注销账号？</h3>
        <p className="text-sm text-warm-mid mb-1">以下内容将被清除：</p>
        <ul className="text-sm text-warm-mid mb-4 list-disc list-inside space-y-0.5">
          <li>所有游戏余额（免费局数 + 付费局数）</li>
          <li>游戏历史记录</li>
          <li>已兑换的局数</li>
        </ul>
        <p className="text-xs text-warm-mid mb-4">数据保留 30 天，如需恢复请联系管理员。</p>

        <input
          type="password"
          placeholder="输入当前密码"
          value={del.password}
          onChange={e => setDel(s => ({ ...s, password: e.target.value }))}
          className={inputCls}
        />

        {/* OTP row */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="输入邮箱验证码"
            value={del.code}
            onChange={e => setDel(s => ({ ...s, code: e.target.value.replace(/\D/g, '') }))}
            maxLength={6}
            className="flex-1 px-3 py-2 rounded-xl border border-sand/60 bg-warm-white text-sm
              focus:outline-none focus:border-coral text-center tracking-widest"
          />
          <button
            onClick={onSendOtp}
            disabled={del.sendingOtp || del.countdown > 0 || !del.password}
            className="px-3 py-2 text-xs bg-ocean text-white rounded-lg font-medium
              disabled:opacity-50 hover:bg-ocean/80 shrink-0"
          >
            {del.countdown > 0 ? `${del.countdown}s` : del.sendingOtp ? '发送中' : '获取验证码'}
          </button>
        </div>

        {del.otpSent && (
          <p className="text-xs text-green-600 text-center mb-2">验证码已发送至您的邮箱</p>
        )}

        {del.error && (
          <div className="text-coral text-sm text-center mb-3">{del.error}</div>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => setDel(initDelete())}
            className="flex-1 py-2 border border-sand/60 text-warm-mid rounded-xl text-sm hover:bg-warm-white"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={del.loading || !del.password || del.code.length < 6}
            className="flex-1 py-2 bg-coral text-white rounded-xl text-sm disabled:opacity-50 hover:bg-coral/80"
          >
            {del.loading ? '注销中…' : '确认注销'}
          </button>
        </div>
      </div>
    </div>
  )
}
