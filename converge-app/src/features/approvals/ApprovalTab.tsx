import { useState } from 'react'
import { Bell, Check, CircleCheck, Handshake, History, ShieldCheck, ThumbsDown, Undo2 } from 'lucide-react'
import { useStore } from '../../app/store'
import { ME } from '../../data/mockTrip'
import { AiTag, Avatar, Button, Card, EstimateLabel, KIND_ICON, PrivateNote, Progress, SectionTitle, Sheet, StatusBadge, cx } from '../../components/ui'
import { APPROVED, approvalCount, isFinal, totalPP } from '../../lib/proposalRules'
import { useMyFit } from '../../lib/selectors'
import { FIT_COPY } from '../../lib/privacy'
import { inr } from '../../lib/format'
import { AiWorking } from '../trip/OverviewTab'
import { ViewAsToggle } from '../trip/TripScreen'
import { FitPill } from '../proposals/OptionsTab'

const CHANGE_REASONS = ['Stay', 'Price', 'Travel times', 'Activities', 'Something else']

export function ApprovalTab() {
  const { s, current, decide, nudge, go, toast } = useStore()
  const myFit = useMyFit()(current)
  const [sheet, setSheet] = useState<null | 'changes' | 'reject' | 'approve-warning'>(null)
  const [reason, setReason] = useState<string>('Price')
  const [note, setNote] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  if (s.optionsState !== 'ready')
    return (
      <div className="pt-4">
        {s.optionsState === 'generating' ? <AiWorking /> : (
          <Card className="p-5 text-center">
            <CircleCheck size={22} className="mx-auto text-muted" />
            <p className="mt-2 text-[15px] font-semibold">Nothing to decide yet</p>
            <p className="mt-1 text-[13px] text-muted">A proposal appears here once everyone has shared preferences.</p>
          </Card>
        )}
      </div>
    )

  const final = isFinal(s.decisions, s.members, current.version)
  const { approved, total } = approvalCount(s.decisions, s.members, current.version)
  const mine = s.decisions[ME]
  const iApproved = APPROVED.includes(mine?.status)
  const prev = s.versions.length > 1 ? s.versions[s.versions.length - 2] : null

  const onApprove = () => {
    if (myFit === 'above' && s.viewAs === 'me') { setSheet('approve-warning'); return }
    decide('approved')
    toast('Approved. You’ll be notified only if something material changes.')
  }

  return (
    <div className="pt-1">
      <ViewAsToggle />

      <Card className={cx('mt-3 p-4', final && 'border-ok/40 bg-ok-soft')}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Version {current.version} · {current.name}</p>
            <p className={cx('mt-0.5 text-[18px] font-bold', final ? 'text-ok' : 'text-ink')}>
              {final ? 'Approved by everyone' : `${approved} of ${total} approved`}
            </p>
          </div>
          {final && <span className="anim-pop grid h-10 w-10 place-items-center rounded-full bg-ok text-white"><Check size={22} strokeWidth={3} /></span>}
        </div>
        <div className="mt-2"><Progress value={approved} total={total} tone={final ? 'ok' : 'brand'} /></div>
        <p className="mt-2 text-[12.5px] text-muted">
          {final ? 'Every active member explicitly approved this version. Nothing is booked yet.' : 'Final only when every active member approves. Silence never counts as a yes.'}
        </p>
        {final && s.booking === 'idle' && <Button className="mt-3 w-full" onClick={() => go({ name: 'booking' })}>Review & book</Button>}
      </Card>

      {current.changeSummary && prev && (
        <Card className="mt-3 border-ai/20 bg-ai-soft p-4">
          <AiTag label={`What changed since v${prev.version}`} />
          <ul className="mt-1.5 space-y-1 text-[13px]">
            {current.changeSummary.map((c) => <li key={c} className="flex gap-2"><span className="text-ai">•</span>{c}</li>)}
            <li className="flex gap-2"><span className="text-ai">•</span>Per person: {inr(totalPP(prev))} → <b>{inr(totalPP(current))}</b></li>
          </ul>
          <p className="mt-2 text-[12px] text-muted">This is a material change, so earlier approvals were reset. Everything else is as before.</p>
        </Card>
      )}

      <SectionTitle>What you&rsquo;re approving</SectionTitle>
      <Card className="p-4" onClick={() => go({ name: 'proposal', id: current.id })}>
        <div className="space-y-2">
          {current.components.filter((c) => !c.optional).map((c) => (
            <div key={c.id} className="flex items-center gap-2.5 text-[13.5px]">
              <span className="text-brand-dark">{KIND_ICON[c.kind]({ size: 15 })}</span>
              <span className="flex-1">{c.title}</span>
              <span className="text-muted">{inr(c.pricePP)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <span className="text-[13px] text-muted">Estimated per person</span>
          <span className="text-[17px] font-bold">{inr(totalPP(current))}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5"><FitPill p={current} /><span className="text-[12px] text-muted">+ optional extras you join</span></div>
        <EstimateLabel className="mt-2" />
      </Card>

      {s.viewAs === 'me' && myFit && (
        <div className="mt-3"><PrivateNote>Your AI: this version is <b>{FIT_COPY[myFit].toLowerCase()}</b>. {myFit === 'above' ? 'You don’t have to agree just because others have. Ask for a compromise; nobody will see why.' : ''}</PrivateNote></div>
      )}

      <SectionTitle>Members</SectionTitle>
      <Card className="divide-y divide-line">
        {s.members.map((m) => {
          const d = s.decisions[m.id]
          const status = !m.active ? null : d?.proposalVersion === current.version ? d.status : 'pending'
          const waiting = m.active && m.id !== ME && status && !APPROVED.includes(status)
          return (
            <div key={m.id} className={cx('flex items-center gap-3 px-4 py-3', !m.active && 'opacity-50')}>
              <Avatar m={m} size={32} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium">{m.id === ME ? 'You' : m.name}{m.role === 'organiser' && <span className="ml-1.5 text-[11px] text-muted">Organiser</span>}</p>
                {!m.active ? <p className="text-[12px] text-muted">Stepped out · not counted</p> : d?.note ? <p className="truncate text-[12px] text-muted">{d.note}</p> : m.preApproval && status !== 'approved-via-limits' ? <p className="text-[12px] text-muted">Pre-approval on · applies only within their limits</p> : null}
              </div>
              {status && <StatusBadge status={status} />}
              {waiting && status !== 'rejected' && (
                <button onClick={() => nudge(m.id)} disabled={s.nudged[m.id]} aria-label={`Remind ${m.name}`} className="grid h-8 w-8 place-items-center rounded-full text-brand-dark hover:bg-brand-soft disabled:text-line">
                  <Bell size={15} />
                </button>
              )}
            </div>
          )
        })}
      </Card>
      <p className="mt-2 px-1 text-[12px] text-muted">Reminders: one per member per decision. Alex set a deadline of Wed 18 Nov, 9 PM.</p>

      <button onClick={() => setShowHistory((x) => !x)} className="mt-5 flex items-center gap-1.5 px-1 text-[13px] font-semibold text-muted">
        <History size={14} /> Recent activity ({s.activity.length})
      </button>
      {showHistory && (
        <Card className="mt-2 divide-y divide-line">
          {s.activity.slice(0, 12).map((a) => (
            <div key={a.id} className="flex gap-3 px-4 py-2.5 text-[12.5px]">
              <span className="w-12 shrink-0 text-muted">{a.at}</span>
              <span className={cx({ good: 'text-ok', bad: 'text-bad', warn: 'text-warn', ai: 'text-ai', neutral: 'text-ink' }[a.tone ?? 'neutral'])}>{a.text}</span>
            </div>
          ))}
        </Card>
      )}

      {!final && s.booking === 'idle' && (
        <div className="sticky bottom-0 -mx-4 mt-5 border-t border-line bg-white/95 px-4 pt-3 pb-4 backdrop-blur">
          {iApproved ? (
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ok"><Check size={16} /> You approved v{current.version}</p>
              <Button size="sm" variant="ghost" icon={<Undo2 size={14} />} onClick={() => { decide('review-needed'); toast('Approval withdrawn') }}>Undo</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[1.3fr_1.1fr_.7fr] gap-2">
                <Button variant="secondary" size="sm" className="px-1.5 whitespace-nowrap" onClick={() => setSheet('changes')}>Request changes</Button>
                <Button variant="ok" size="sm" icon={<Check size={15} />} onClick={onApprove}>Approve</Button>
                <Button variant="danger" size="sm" onClick={() => setSheet('reject')} >Reject</Button>
              </div>
              <button onClick={() => go({ name: 'common-ground' })} className="mt-2 flex w-full items-center justify-center gap-1.5 text-[12.5px] font-semibold text-brand-dark">
                <Handshake size={14} /> Ask the AI to find common ground
              </button>
            </>
          )}
        </div>
      )}

      <Sheet open={sheet === 'changes'} onClose={() => setSheet(null)} title="Request changes">
        <p className="mb-2 text-[12.5px] text-muted">The group sees your request and the part it&rsquo;s about. Your budget is never shown.</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {CHANGE_REASONS.map((r) => (
            <button key={r} onClick={() => setReason(r)} className={cx('rounded-full border px-3 py-1 text-[13px]', reason === r ? 'border-navy bg-navy text-white' : 'border-line')}>{r}</button>
          ))}
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Optional note for the group" className="w-full rounded-xl border border-line p-3 text-[14px] outline-none focus:border-brand" />
        <Button className="mt-3 w-full" onClick={() => {
          decide('changes-requested', note.trim() || `Wants a change to: ${reason.toLowerCase()}`)
          setSheet(null); setNote('')
          if (reason === 'Price' || reason === 'Stay') go({ name: 'common-ground' })
        }}>{reason === 'Price' || reason === 'Stay' ? 'Send & find a compromise' : 'Send request'}</Button>
      </Sheet>

      <Sheet open={sheet === 'reject'} onClose={() => setSheet(null)} title={`Reject v${current.version}?`}>
        <p className="text-[13.5px]">The group will see that you rejected this version. Your AI will privately ask what would change your mind, so the next version can work for you.</p>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setSheet(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" icon={<ThumbsDown size={15} />} onClick={() => { decide('rejected'); setSheet(null); go({ name: 'common-ground' }) }}>Reject</Button>
        </div>
      </Sheet>

      <Sheet open={sheet === 'approve-warning'} onClose={() => setSheet(null)} title="Before you approve">
        <PrivateNote>This version is above the maximum you set as a must-have. Approving is your call. Nobody will see this warning.</PrivateNote>
        <div className="mt-3 grid gap-2">
          <Button icon={<Handshake size={16} />} onClick={() => { setSheet(null); go({ name: 'common-ground' }) }}>Find a compromise first</Button>
          <Button variant="secondary" icon={<ShieldCheck size={16} />} onClick={() => { decide('approved'); setSheet(null); toast('Approved') }}>Approve anyway</Button>
        </div>
      </Sheet>
    </div>
  )
}
