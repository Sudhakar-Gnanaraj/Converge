import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Lock, Send, Sparkles } from 'lucide-react'
import { useStore } from '../../app/store'
import { Button, Header, Typing, cx } from '../../components/ui'
import { STEPS } from './script'
import { PreferenceChip, PreferenceEditor } from './PreferenceEditor'
import type { Preference } from '../../types'

export function DiscoveryScreen() {
  const { s, back, answer, go } = useStore()
  const [text, setText] = useState('')
  const [editing, setEditing] = useState<Preference | null>(null)
  const [trayOpen, setTrayOpen] = useState(true)
  const endRef = useRef<HTMLDivElement>(null)
  const step = STEPS[s.chatStep]
  const done = s.chatStep >= STEPS.length

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [s.chat.length, s.aiTyping])

  const send = () => {
    const t = text.trim()
    if (!t) return
    answer(t, false)
    setText('')
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div className="sticky top-0 z-20">
      <Header
        sticky={false}
        title="Your private AI"
        subtitle="Only you can see this chat"
        onBack={back}
        right={<span className="mr-1 grid h-8 w-8 place-items-center rounded-full bg-white/10"><Lock size={15} /></span>}
      />

      {/* What I understood — always visible, always editable */}
      <div className="border-b border-line bg-white/95 backdrop-blur">
        <button onClick={() => setTrayOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-2.5">
          <span className="text-[13px] font-semibold">What I understood <span className="font-normal text-muted">· {s.myPrefs.length}</span></span>
          <span className="flex items-center gap-1 text-[12px] text-muted">
            Tap to edit <ChevronDown size={15} className={cx('transition', !trayOpen && '-rotate-90')} />
          </span>
        </button>
        {trayOpen && (
          <div className="flex flex-wrap gap-1.5 px-4 pb-3">
            {s.myPrefs.length === 0 ? (
              <p className="text-[12.5px] text-muted">Your preferences will appear here as we talk. You can correct anything.</p>
            ) : (
              s.myPrefs.map((p) => <PreferenceChip key={p.id} p={p} onClick={() => setEditing(p)} />)
            )}
          </div>
        )}
      </div>
      </div>

      <div className="flex-1 space-y-3 px-4 py-4">
        {s.chat.map((m) => (
          <div key={m.id} className={cx('anim-rise flex', m.from === 'me' ? 'justify-end' : 'justify-start')}>
            {m.from === 'ai' ? (
              <div className="max-w-[86%] space-y-1.5">
                {m.text && (
                  <div className="rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-[14px] leading-snug shadow-[0_1px_2px_rgba(16,24,40,.06)]">
                    {m.text}
                  </div>
                )}
                {m.extracted && m.extracted.length > 0 && (
                  <p className="flex flex-wrap items-center gap-1 pl-1 text-[11.5px] text-ai">
                    <Sparkles size={12} /> Noted: {m.extracted.join(' · ')}
                  </p>
                )}
              </div>
            ) : (
              <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-brand px-3.5 py-2.5 text-[14px] text-white">{m.text}</div>
            )}
          </div>
        ))}
        {s.aiTyping && (
          <div className="flex"><div className="rounded-2xl rounded-tl-md bg-white px-4 py-3"><Typing /></div></div>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 z-10 border-t border-line bg-white px-3 pt-2.5 pb-4">
        {done ? (
          <Button className="w-full" onClick={() => go({ name: 'privacy' })}>Review & choose what to share</Button>
        ) : (
          <>
            {step?.hint && !s.aiTyping && (
              <p className="mb-1.5 flex items-center gap-1 px-1 text-[11.5px] text-private"><Lock size={11} /> {step.hint}</p>
            )}
            {step && !s.aiTyping && (
              <div className="no-scrollbar -mx-3 mb-2 flex gap-1.5 overflow-x-auto px-3">
                {step.replies.map((r) => (
                  <button key={r} onClick={() => answer(r, true)} className="shrink-0 rounded-full border border-brand/40 bg-brand-soft px-3 py-1.5 text-[13px] font-medium text-brand-dark transition active:scale-95">
                    {r}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Or type in your own words…"
                disabled={s.aiTyping}
                className="h-11 flex-1 rounded-full border border-line bg-bg px-4 text-[14px] outline-none focus:border-brand"
              />
              <button onClick={send} disabled={!text.trim() || s.aiTyping} aria-label="Send" className="grid h-11 w-11 place-items-center rounded-full bg-brand text-white disabled:opacity-40">
                <Send size={17} />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[11px] text-muted">Question {Math.min(s.chatStep + 1, STEPS.length)} of {STEPS.length} · nothing is shared until you confirm</p>
          </>
        )}
      </div>
      <PreferenceEditor pref={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
