import { EyeOff, Wallet } from 'lucide-react'
import type { GroupProfile, Member } from '../types'
import { PRIORITY_LABEL } from '../app/store'
import { Avatar, PRIORITY_STYLE, cx } from './ui'
import { prefText } from '../lib/format'

/** Group-facing. Receives only a GroupProfile, which by construction holds no private amounts. */
export function GroupProfileCard({ member, profile, compact }: { member: Member; profile: GroupProfile; compact?: boolean }) {
  return (
    <div className={cx('rounded-2xl border border-line bg-white', compact ? 'p-3' : 'p-4')}>
      <div className="flex items-center gap-2.5">
        <Avatar m={member} size={compact ? 30 : 36} />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold">
            {member.name}
            {member.role === 'organiser' && <span className="ml-1.5 text-[11px] font-medium text-muted">Organiser</span>}
          </p>
          <p className="flex items-center gap-1 text-[12px] text-muted">
            <Wallet size={12} /> {profile.budgetLabel}
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {profile.sharedPreferences.map((p) => (
          <span key={p.id} className="inline-flex items-center gap-1 rounded-full border border-line py-0.5 pr-2 pl-0.5 text-[12px]">
            <span className={cx('rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase', PRIORITY_STYLE[p.priority])}>{PRIORITY_LABEL[p.priority]}</span>
            {prefText(p)}
          </span>
        ))}
        {profile.hiddenCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-bg px-2 py-0.5 text-[12px] text-muted">
            <EyeOff size={11} /> {profile.hiddenCount} kept private
          </span>
        )}
      </div>
    </div>
  )
}
