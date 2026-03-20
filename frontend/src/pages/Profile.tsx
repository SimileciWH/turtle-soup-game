import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getProfile, redeemCode } from '../api/auth'
import { getHistory } from '../api/profile'
import type { HistoryResponse } from '../types/api'

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: '简单', MEDIUM: '中等', HARD: '困难'
}

export function Profile() {
  const navigate = useNavigate()
  const { isGuest, quotaFree, quotaPaid, setQuota, logout } = useAuthStore()

  const [history, setHistory] = useState<HistoryResponse | null>(null)
  const [redeemInput, setRedeemInput] = useState('')
  const [redeemMsg, setRedeemMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [redeemLoading, setRedeemLoading] = useState(false)

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
    setRedeemLoading(true)
    setRedeemMsg(null)
    try {
      const res = await redeemCode(code)
      setQuota(quotaFree, res.quota_paid_total)
      setRedeemMsg({ ok: true, text: `兑换成功！获得 ${res.quota_value} 局，当前余额 ${res.quota_paid_total} 局` })
      setRedeemInput('')
    } catch (e) {
      setRedeemMsg({ ok: false, text: e instanceof Error ? e.message : '兑换失败' })
    } finally {
      setRedeemLoading(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-warm-white">
      {/* Header */}
      <header className="sticky top-0 bg-warm-white/90 backdrop-blur border-b border-sand/40 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link to="/" className="text-sm text-warm-mid hover:text-warm-brown">← 大厅</Link>
          <span className="font-bold text-warm-brown">个人中心</span>
          <button onClick={handleLogout} className="text-sm text-warm-mid hover:text-coral">退出</button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Quota card */}
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

        {/* Redeem card */}
        <div className="bg-white/70 rounded-2xl border border-sand/40 p-5">
          <h2 className="font-bold text-warm-brown mb-3">兑换码</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={redeemInput}
              onChange={e => setRedeemInput(e.target.value.toUpperCase())}
              placeholder="输入兑换码，如 TEST-0001"
              onKeyDown={e => e.key === 'Enter' && handleRedeem()}
              className="flex-1 px-3 py-2 rounded-xl border border-sand/60 bg-warm-white text-sm
                         focus:outline-none focus:border-ocean tracking-wider"
            />
            <button
              onClick={handleRedeem}
              disabled={redeemLoading || !redeemInput.trim()}
              className="px-4 py-2 bg-ocean text-white rounded-xl text-sm disabled:opacity-50 hover:bg-ocean/80"
            >
              {redeemLoading ? '…' : '兑换'}
            </button>
          </div>
          {redeemMsg && (
            <div className={`mt-2 text-sm ${redeemMsg.ok ? 'text-leaf' : 'text-coral'}`}>
              {redeemMsg.ok ? '✅ ' : '❌ '}{redeemMsg.text}
            </div>
          )}
        </div>

        {/* History */}
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
                <div
                  key={s.id}
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
      </main>
    </div>
  )
}
