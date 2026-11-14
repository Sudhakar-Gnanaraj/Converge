// Deterministic "Personal AI" conversation for the demo. No LLM, no network.
import type { Preference, PreferenceCategory, PreferencePriority } from '../../types'

export interface Extract {
  prefs: Omit<Preference, 'id'>[]
  budget?: { ideal: number; maximum: number }
}

export interface Step {
  ai: string
  replies: string[]
  /** hint shown under the composer */
  hint?: string
  extract: (reply: string) => Extract
}

const p = (category: PreferenceCategory, label: string, priority: PreferencePriority): Omit<Preference, 'id'> => ({ category, label, priority })

export const STEPS: Step[] = [
  {
    ai: 'Hi Riya. This chat is private — only you can see it. Alex has started planning a long weekend, Fri 11 – Sun 13 Dec. What kind of weekend are you hoping for?',
    replies: ['Relaxed — beach and good food', 'Adventure-packed', 'Quiet, nature, no rush'],
    extract: (r) => {
      const t = r.toLowerCase()
      if (t.includes('adventure')) return { prefs: [p('style', 'Adventure-packed', 'prefer')] }
      if (t.includes('quiet') || t.includes('nature')) return { prefs: [p('style', 'Quiet, nature', 'prefer')] }
      const out = [p('style', 'Relaxed pace', 'prefer')]
      if (t.includes('beach')) out.push(p('want', 'Beach time', 'prefer'))
      if (t.includes('food')) out.push(p('want', 'Good local food', 'prefer'))
      return { prefs: out }
    },
  },
  {
    ai: 'Nice. Goa and Coorg are on the table. How do you feel about them?',
    replies: ['Leaning Goa', 'Leaning Coorg', 'Either works for me'],
    extract: (r) => {
      const t = r.toLowerCase()
      if (t.includes('goa')) return { prefs: [p('destination', 'Goa', 'prefer')] }
      if (t.includes('coorg')) return { prefs: [p('destination', 'Coorg', 'prefer')] }
      return { prefs: [p('destination', 'Goa or Coorg', 'flexible')] }
    },
  },
  {
    ai: 'Can you do all three days, and do you need to be back by a certain time?',
    replies: ['All 3 days, back Sunday night', 'Fully flexible', 'Can only leave Friday evening'],
    extract: (r) => {
      const t = r.toLowerCase()
      if (t.includes('flexible')) return { prefs: [p('dates', 'Dates: flexible', 'flexible')] }
      if (t.includes('evening')) return { prefs: [p('dates', 'Leave Fri evening at the earliest', 'must-have')] }
      return { prefs: [p('dates', 'Back in Bengaluru by Sun night', 'must-have')] }
    },
  },
  {
    ai: 'What total budget feels comfortable — travel and stay included? This stays with me unless you choose to share it.',
    hint: 'Private by default. You’ll choose what the group sees next.',
    replies: ['₹8–12K', '₹10–14K', '₹14–20K'],
    extract: (r) => {
      const nums = (r.match(/\d+/g) ?? []).map(Number)
      if (nums.length >= 2) {
        const [lo, hi] = nums.map((n) => (n < 1000 ? n * 1000 : n))
        return { prefs: [p('budget', `Up to ₹${hi / 1000}K total`, 'must-have')], budget: { ideal: lo + Math.round((hi - lo) / 2 / 1000) * 1000, maximum: hi } }
      }
      if (nums.length === 1) {
        const n = nums[0] < 1000 ? nums[0] * 1000 : nums[0]
        return { prefs: [p('budget', `Up to ₹${Math.round(n / 1000)}K total`, 'must-have')], budget: { ideal: Math.round(n * 0.85), maximum: n } }
      }
      return { prefs: [p('budget', 'Budget: not sure yet', 'not-sure')] }
    },
  },
  {
    ai: 'Got it. I’ve marked that maximum as a must-have — I’ll never suggest going above it without asking you first. Where would you like to stay?',
    replies: ['Clean and safe is enough', 'Near the beach', 'A nice resort'],
    extract: (r) => {
      const t = r.toLowerCase()
      if (t.includes('beach')) return { prefs: [p('stay', 'Stay near the beach', 'prefer')] }
      if (t.includes('resort')) return { prefs: [p('stay', 'A nice resort', 'prefer')] }
      return { prefs: [p('stay', 'Stay: clean & safe, location flexible', 'flexible')] }
    },
  },
  {
    ai: 'Last one. Anything you definitely want — or want to avoid?',
    replies: ['Want: a sunset by the sea', 'Avoid: late-night clubbing', 'Avoid: long road trips'],
    extract: (r) => {
      const t = r.toLowerCase()
      if (t.startsWith('avoid')) return { prefs: [p('avoid', r.replace(/^avoid:\s*/i, ''), 'prefer')] }
      if (t.startsWith('want')) return { prefs: [p('want', r.replace(/^want:\s*/i, ''), 'prefer')] }
      return { prefs: [p('want', r, 'not-sure')] }
    },
  },
]

export const CLOSING =
  'Here’s what I understood. Tap any card to fix the wording or change how strongly you feel. Next, you’ll choose exactly what the group can see.'

const STEP_CATEGORY: PreferenceCategory[] = ['style', 'destination', 'dates', 'budget', 'stay', 'want']

/**
 * Free-text answers: budget numbers are parsed; anything else keeps the user's own
 * words and is marked "Not sure" so they classify it themselves (AI doesn't guess strength).
 */
export function parseFreeText(step: number, text: string): Extract & { unsure: boolean } {
  if (step === 3) return { ...STEPS[3].extract(text), unsure: !/\d/.test(text) }
  const t = text.trim()
  const avoid = /^(avoid|no |not |don'?t)/i.test(t)
  return { prefs: [p(avoid ? 'avoid' : STEP_CATEGORY[step], t.charAt(0).toUpperCase() + t.slice(1), 'not-sure')], unsure: true }
}
