import { useState } from 'react'
import { Eye, Lock, ShieldCheck, Sparkles } from 'lucide-react'
import { useStore } from '../../app/store'
import { ME } from '../../data/mockTrip'
import { BottomBar, Button, Card, Header, SectionTitle, Toggle, cx } from '../../components/ui'
import { GroupProfileCard } from '../../components/GroupProfileCard'
import { budgetLabel, myGroupProfile } from '../../lib/privacy'
import { PreferenceChip, PreferenceEditor } from '../discovery/PreferenceEditor'
import { inr } from '../../lib/format'
import type { BudgetVisibility, Preference } from '../../types'

export function PrivacyScreen() {
  const { s, back, setVisibility, setShare, setPreApproval, confirmPrivacy, resetTo } = useStore()
  const [editing, setEditing] = useState<Preference | null>(null)
  const me = s.members.find((m) => m.id === ME)!
  const profile = myGroupProfile(ME, me.name, s.myPrefs, s.share, s.budget, s.visibility)
  const budgetPref = s.myPrefs.find((p) => p.category === 'budget')
  const others = s.myPrefs.filter((p) => p.category !== 'budget')
  const hasBudget = s.budget.maximum != null

  const options: { v: BudgetVisibility; title: string; desc: string }[] = [
    { v: 'private', title: 'Keep it private', desc: 'Your AI only says whether an option fits your comfort range. No numbers.' },
    { v: 'range', title: 'Share a range', desc: hasBudget ? `The group sees ${budgetLabel('range', s.budget).replace('Shared a range · ', '')}.` : 'Add a budget first.' },
    { v: 'exact', title: 'Share the exact amount', desc: hasBudget ? `The group sees ${inr(s.budget.maximum!)}.` : 'Add a budget first.' },
  ]

  const finish = () => {
    confirmPrivacy()
    if (!s.privacyDone) resetTo([{ name: 'home' }, { name: 'trip', tab: 'overview' }])
    else back()
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <Header title="Choose what the group sees" subtitle="Step 2 of 2 · you can change this any time" onBack={back} />
      <div className="flex-1 px-4 pb-6">
        <SectionTitle>Your budget</SectionTitle>
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            {budgetPref ? <PreferenceChip p={budgetPref} onClick={() => setEditing(budgetPref)} /> : <span className="text-[13px] text-muted">No budget added</span>}
            <span className="flex items-center gap-1 text-[11.5px] font-semibold text-private"><Lock size={12} /> Stored privately</span>
          </div>
          <div className="space-y-2" role="radiogroup" aria-label="Budget sharing">
            {options.map((o) => {
              const disabled = o.v !== 'private' && !hasBudget
              return (
                <button
                  key={o.v}
                  role="radio"
                  aria-checked={s.visibility === o.v}
                  disabled={disabled}
                  onClick={() => setVisibility(o.v)}
                  className={cx('flex w-full items-start gap-3 rounded-xl border p-3 text-left transition disabled:opacity-40', s.visibility === o.v ? 'border-brand bg-brand-soft' : 'border-line')}
                >
                  <span className={cx('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2', s.visibility === o.v ? 'border-brand' : 'border-line')}>
                    {s.visibility === o.v && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold">
                      {o.title} {o.v === 'private' && <span className="ml-1 rounded bg-ok-soft px-1.5 py-0.5 text-[10.5px] font-bold text-ok">Default</span>}
                    </span>
                    <span className="block text-[12.5px] text-muted">{o.desc}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-ai-soft p-3 text-[12.5px] text-ai">
            <Sparkles size={14} className="mt-0.5 shrink-0" />
            <p>
              Your exact budget stays private. The group assistant only receives the compatibility guidance you allow, like “stretches some budgets”. It never says how many people or who.
            </p>
          </div>
        </Card>

        <SectionTitle>Your preferences</SectionTitle>
        <Card className="divide-y divide-line">
          {others.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0"><PreferenceChip p={p} onClick={() => setEditing(p)} /></div>
              <label className="flex shrink-0 items-center gap-2 text-[12px] text-muted">
                {s.share[p.id] === false ? 'Private' : 'Shared'}
                <Toggle on={s.share[p.id] !== false} onChange={(v) => setShare(p.id, v)} label={`Share ${p.label}`} />
              </label>
            </div>
          ))}
          {others.length === 0 && <p className="px-4 py-3 text-[13px] text-muted">No preferences yet. Go back to the chat to add some.</p>}
        </Card>

        <SectionTitle>Fewer notifications</SectionTitle>
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-[14px] font-semibold"><ShieldCheck size={16} className="text-ok" /> Pre-approve within my limits</p>
              <p className="mt-1 text-[12.5px] text-muted">
                Approve on my behalf <b>only</b> if every must-have is met and the cost is within my comfort range. Anything else still waits for me. Shown to the group as “Approved via limits”.
              </p>
            </div>
            <Toggle on={me.preApproval} onChange={setPreApproval} label="Pre-approve within my limits" />
          </div>
        </Card>

        <SectionTitle><span className="flex items-center gap-1.5"><Eye size={14} /> Preview: what the group sees</span></SectionTitle>
        <GroupProfileCard member={me} profile={profile} />
        <p className="mt-2 px-1 text-[12px] text-muted">This is the only information about you the group AI and other members receive.</p>
      </div>
      <BottomBar>
        <Button className="w-full" onClick={finish}>{s.privacyDone ? 'Save changes' : 'Confirm & share with group'}</Button>
      </BottomBar>
      <PreferenceEditor pref={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
