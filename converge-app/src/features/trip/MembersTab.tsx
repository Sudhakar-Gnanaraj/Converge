import { useState } from 'react'
import { Copy, Link2, MessageCircle, UserPlus } from 'lucide-react'
import { useStore } from '../../app/store'
import { Avatar, Button, Card, SectionTitle, Sheet } from '../../components/ui'
import { GroupProfileCard } from '../../components/GroupProfileCard'
import { useGroupProfiles } from '../../lib/selectors'

export function MembersTab() {
  const { s, toast } = useStore()
  const profiles = useGroupProfiles()
  const [invite, setInvite] = useState(false)

  return (
    <div className="pt-1">
      <SectionTitle action={<Button size="sm" variant="ghost" icon={<UserPlus size={15} />} onClick={() => setInvite(true)}>Invite</Button>}>
        {s.members.filter((m) => m.active).length} members · equal say
      </SectionTitle>
      <p className="-mt-1 mb-3 px-1 text-[12.5px] text-muted">
        Alex organises (invites, deadlines) but can&rsquo;t approve for anyone. Every active member must approve before anything is final.
      </p>
      <div className="space-y-2">
        {profiles.map((p) => (
          <GroupProfileCard key={p.memberId} member={s.members.find((m) => m.id === p.memberId)!} profile={p} compact />
        ))}
        {s.members.filter((m) => m.active && !m.setupDone).map((m) => (
          <Card key={m.id} className="flex items-center gap-2.5 p-3">
            <Avatar m={m} size={30} />
            <div>
              <p className="text-[14px] font-semibold">{m.name}</p>
              <p className="text-[12px] text-muted">Hasn&rsquo;t shared preferences yet</p>
            </div>
          </Card>
        ))}
        {s.members.filter((m) => !m.active).map((m) => (
          <Card key={m.id} className="flex items-center gap-2.5 p-3 opacity-60">
            <Avatar m={m} size={30} />
            <div>
              <p className="text-[14px] font-semibold">{m.name}</p>
              <p className="text-[12px] text-muted">Stepped out of this trip</p>
            </div>
          </Card>
        ))}
      </div>

      <Sheet open={invite} onClose={() => setInvite(false)} title="Invite friends">
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-bg px-3 py-3 text-[13px]">
            <Link2 size={15} className="text-muted" /> <span className="flex-1 truncate">converge.example/join/GOA-DEC-6F</span>
            <button onClick={() => { setInvite(false); toast('Link copied (demo)') }} aria-label="Copy link"><Copy size={15} /></button>
          </div>
          <Button className="w-full" icon={<MessageCircle size={16} />} onClick={() => { setInvite(false); toast('Share sheet would open here (demo)') }}>Share to group chat</Button>
          <p className="text-[12px] text-muted">Friends can respond from the link without installing anything. They&rsquo;ll only be notified when their decision is needed.</p>
        </div>
      </Sheet>
    </div>
  )
}
