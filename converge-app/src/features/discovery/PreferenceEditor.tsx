import { useEffect, useState } from 'react'
import { Lock, Trash2 } from 'lucide-react'
import { PRIORITY_LABEL, useStore } from '../../app/store'
import { Button, PRIORITY_STYLE, Sheet, cx } from '../../components/ui'
import type { Preference, PreferencePriority } from '../../types'
import { prefText } from '../../lib/format'

const PRIORITY_HELP: Record<PreferencePriority, string> = {
  'must-have': 'Hard limit. Every proposal must respect it, and the AI will ask you before ever treating it as flexible.',
  prefer: 'Important to you, but you’re open to trading it for something else.',
  flexible: 'Happy with whatever works for the group.',
  'not-sure': 'The AI will check with you before relying on it.',
}

export function PreferenceChip({ p, onClick }: { p: Preference; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="anim-pop inline-flex max-w-full items-center gap-1.5 rounded-full border border-line bg-white py-1 pr-2.5 pl-1 text-left text-[12.5px] transition hover:border-brand/50">
      <span className={cx('rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide', PRIORITY_STYLE[p.priority])}>{PRIORITY_LABEL[p.priority]}</span>
      {p.category === 'budget' && <Lock size={11} className="shrink-0 text-private" />}
      <span className="truncate">{prefText(p)}</span>
    </button>
  )
}

export function PreferenceEditor({ pref, onClose }: { pref: Preference | null; onClose: () => void }) {
  const { updatePref, removePref, s, setBudget } = useStore()
  const [label, setLabel] = useState('')
  const [priority, setPriority] = useState<PreferencePriority>('prefer')
  const [ideal, setIdeal] = useState('')
  const [max, setMax] = useState('')

  useEffect(() => {
    if (!pref) return
    setLabel(pref.label)
    setPriority(pref.priority)
    setIdeal(s.budget.ideal ? String(s.budget.ideal) : '')
    setMax(s.budget.maximum ? String(s.budget.maximum) : '')
  }, [pref, s.budget])

  if (!pref) return null
  const isBudget = pref.category === 'budget'

  const save = () => {
    let nextLabel = label.trim() || pref.label
    if (isBudget) {
      const i = Number(ideal) || null
      const m = Number(max) || null
      setBudget({ ideal: i, maximum: m })
      if (m) nextLabel = `Up to ₹${Math.round(m / 1000)}K total`
    }
    updatePref(pref.id, { label: nextLabel, priority })
    onClose()
  }

  return (
    <Sheet open={!!pref} onClose={onClose} title={isBudget ? 'Your budget (private)' : 'Edit preference'}>
      <div className="space-y-4">
        {isBudget ? (
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[12px] font-medium text-muted">Comfortable (ideal)</span>
              <div className="mt-1 flex h-11 items-center rounded-xl border border-line px-3 focus-within:border-brand">
                <span className="text-muted">₹</span>
                <input inputMode="numeric" value={ideal} onChange={(e) => setIdeal(e.target.value.replace(/\D/g, ''))} className="w-full pl-1 outline-none" />
              </div>
            </label>
            <label className="block">
              <span className="text-[12px] font-medium text-muted">Absolute maximum</span>
              <div className="mt-1 flex h-11 items-center rounded-xl border border-line px-3 focus-within:border-brand">
                <span className="text-muted">₹</span>
                <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} className="w-full pl-1 outline-none" />
              </div>
            </label>
            <p className="col-span-2 flex items-start gap-1.5 text-[12px] text-private">
              <Lock size={12} className="mt-0.5 shrink-0" /> These numbers stay in your private context. You choose what the group sees on the next screen.
            </p>
          </div>
        ) : (
          <label className="block">
            <span className="text-[12px] font-medium text-muted">In your words</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-line px-3 outline-none focus:border-brand" />
          </label>
        )}
        <div>
          <p className="mb-1.5 text-[12px] font-medium text-muted">How strongly do you feel?</p>
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(PRIORITY_LABEL) as PreferencePriority[]).map((k) => (
              <button key={k} onClick={() => setPriority(k)} className={cx('rounded-xl border px-1 py-2 text-[12px] font-semibold transition', priority === k ? 'border-navy bg-navy text-white' : 'border-line text-ink')}>
                {PRIORITY_LABEL[k]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[12.5px] text-muted">{PRIORITY_HELP[priority]}</p>
        </div>
        <div className="flex gap-2">
          {!isBudget && (
            <Button variant="danger" onClick={() => { removePref(pref.id); onClose() }} icon={<Trash2 size={15} />}>Remove</Button>
          )}
          <Button className="flex-1" onClick={save}>Save</Button>
        </div>
      </div>
    </Sheet>
  )
}
