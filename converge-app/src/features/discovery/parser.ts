// Rule-based understanding of typed answers (no LLM). It reads two things from each
// phrase: WHAT it's about (topic) and HOW STRONGLY the person feels (from their wording).
// It only falls back to "Not sure" when it can't tell how strongly they feel.
import type { Preference, PreferenceCategory, PreferencePriority } from '../../types'

type Pref = Omit<Preference, 'id'>
export interface Parsed {
  prefs: Pref[]
  budget?: { ideal: number; maximum: number }
  /** labels the AI couldn't classify, so it asks the user to */
  unsure: string[]
}

const MUST = /\b(must|need|needs|have to|has to|definitely|absolutely|non[- ]?negotiable|deal[- ]?breaker|can'?t|cannot|won'?t|never|only|essential|important)\b/
const FLEX = /\b(anything|whatever|don'?t mind|do not mind|either|flexible|open to|any\b|no preference|fine with|ok with|okay with|easy ?going|not fussy|doesn'?t matter|up to (you|the group))\b/
const PREFER = /\b(prefer|would like|i'?d like|ideally|rather|love|want|wanna|like|hope|nice|keen|would be great|maybe)\b/
const NEGATE = /^(no|not|avoid|without|skip|hate|dislike|don'?t (want|like)|do not (want|like)|nothing|never|anything but|please no|rather not)\b/

/** Topic matchers: [regex, category, label]. Earlier entries win. */
const TOPICS: { re: RegExp; cat: PreferenceCategory; label: string; steps?: number[] }[] = [
  // destination
  { re: /\b(goa|beachy?|sea|coast)\b.*\b(coorg|hills?)\b|\b(coorg|hills?)\b.*\b(goa)\b|\bboth\b/, cat: 'destination', label: 'Goa or Coorg', steps: [1] },
  { re: /\bgoa\b/, cat: 'destination', label: 'Goa' },
  { re: /\bcoorg|kodagu|madikeri\b/, cat: 'destination', label: 'Coorg' },
  // dates / timing
  { re: /\b(back|return|home)\b.*\bsun(day)?\b|\bsun(day)? (night|evening)\b|\bwork on mon(day)?\b|\bmonday (morning )?(office|work)\b/, cat: 'dates', label: 'Back in Bengaluru by Sun night' },
  { re: /\b(fri(day)? (evening|night)|after work|leave late)\b/, cat: 'dates', label: 'Leave Fri evening at the earliest' },
  { re: /\bmon(day)? (is )?(fine|ok|okay)|can (come back|return) (on )?mon(day)?|take mon(day)? off\b/, cat: 'dates', label: 'Can return Monday' },
  { re: /\b(all|full) (3|three) days\b|\bwhole (weekend|trip)\b/, cat: 'dates', label: 'Free all three days' },
  { re: /\bdates?\b.*\bflexible\b|\bflexible\b.*\bdates?\b/, cat: 'dates', label: 'Dates: flexible' },
  // stay (beach/pool mean "stay" only when asked about the stay)
  { re: /\b(near|close to|by|on) the (beach|sea)\b|\bbeach ?(side|front)\b|\bsea ?view\b/, cat: 'stay', label: 'Stay near the beach', steps: [4] },
  { re: /\bbeach\b/, cat: 'stay', label: 'Stay near the beach', steps: [4] },
  { re: /\b(resort|pool|luxur|5 ?star|five star|fancy|comfortable|comfort)\w*/, cat: 'stay', label: 'A nice resort', steps: [4] },
  { re: /\b(hostel|budget|cheap|basic|simple|backpack)\w*/, cat: 'stay', label: 'Budget stay is fine', steps: [4] },
  { re: /\b(villa|homestay|home ?stay|airbnb|cottage|estate)\b/, cat: 'stay', label: 'Villa or homestay', steps: [4] },
  { re: /\b(own|private|separate) (room|bed)\b/, cat: 'stay', label: 'Own room', steps: [4] },
  { re: /\b(clean|safe|hygien)\w*/, cat: 'stay', label: 'Clean & safe', steps: [4] },
  // style
  { re: /\b(relax|chill|laid ?back|slow|lazy|unwind|rest)\w*/, cat: 'style', label: 'Relaxed pace' },
  { re: /\b(adventur|thrill|adrenaline|active|action|packed)\w*/, cat: 'style', label: 'Adventure-packed' },
  { re: /\b(quiet|peace|calm|nature|green|hills?|mountain|offbeat)\w*/, cat: 'style', label: 'Quiet, nature' },
  // wants / avoids (activities and things)
  { re: /\b(club|clubbing|party|parties|nightlife|pub|bar|drinks?|loud)\w*/, cat: 'want', label: 'Nightlife' },
  { re: /\b(scuba|diving|dive|snorkel\w*|water ?sports?|jet ?ski|parasail\w*|kayak\w*|surf\w*)\b/, cat: 'want', label: 'Water sports' },
  { re: /\b(trek|trekking|hike|hiking|waterfall)\w*/, cat: 'want', label: 'A trek or hike' },
  { re: /\b(sunset|sunrise)\b/, cat: 'want', label: 'A sunset by the sea' },
  { re: /\b(sea ?food|food|eat|cuisine|thali|restaurant|cafe|café|local dishes)\w*/, cat: 'want', label: 'Good local food' },
  { re: /\b(beach|beaches|sea|ocean|swim|swimming)\b/, cat: 'want', label: 'Beach time' },
  { re: /\b(road ?trip|long drive|driving|bus journey|long journey)\w*/, cat: 'want', label: 'Long road trips' },
  { re: /\b(early (start|morning)|wake up early)\b/, cat: 'want', label: 'Early starts' },
  { re: /\b(shopping|market|flea)\w*/, cat: 'want', label: 'Markets & shopping' },
  { re: /\b(spa|massage)\w*/, cat: 'want', label: 'Spa time' },
  { re: /\b(crowd|touristy|tourist trap)\w*/, cat: 'want', label: 'Crowded tourist spots' },
  { re: /\b(photo|photography|instagram)\w*/, cat: 'want', label: 'Photo spots' },
  { re: /\b(church|fort|heritage|history|museum)\w*/, cat: 'want', label: 'Heritage & history' },
]

const STEP_DEFAULT_CAT: PreferenceCategory[] = ['style', 'destination', 'dates', 'budget', 'stay', 'want']
const FLEX_LABEL: (string | null)[] = ['Open to any kind of weekend', 'Goa or Coorg', 'Dates: flexible', null, 'Stay: anything works', null]

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const tidy = (s: string) =>
  cap(
    s
      .replace(/^(i|we)('?d| would| really| also)? (like|want|need|prefer|love|hope)( to have| to| for| a| an)?\s*/i, '')
      .replace(/^(honestly|frankly|i think|i guess|um+|well|please|maybe|just|also|definitely|absolutely|ideally)[, ]+/i, '')
      .replace(/^(avoid|no|not|without|skip|nothing|never|don'?t want|do not want|rather not)\s+/i, '')
      .replace(/[.!?]+$/, '')
      .trim(),
  )

function strength(t: string, negated: boolean): PreferencePriority | null {
  if (MUST.test(t) || (negated && /\b(never|absolutely|definitely|no way)\b/.test(t))) return 'must-have'
  if (FLEX.test(t)) return 'flexible'
  if (PREFER.test(t) || negated) return 'prefer'
  return null
}

/** Money: "15k", "12-15k", "₹12,000", "1.2 lakh", "under 14k", "around 10000". */
export function parseBudget(text: string): { ideal: number; maximum: number } | null {
  const t = text.toLowerCase().replace(/,/g, '').replace(/₹|rs\.?|inr/g, ' ')
  const vals: number[] = []
  for (const m of t.matchAll(/(\d+(?:\.\d+)?)\s*(k|thousand|l|lakh|lac)?\b/g)) {
    let n = parseFloat(m[1])
    const unit = m[2]
    if (unit === 'k' || unit === 'thousand') n *= 1000
    else if (unit === 'l' || unit === 'lakh' || unit === 'lac') n *= 100000
    else if (n < 1000) n *= 1000 // "12-15" in a budget answer means thousands
    vals.push(Math.round(n))
  }
  if (vals.length === 0) return null
  if (vals.length >= 2) {
    const [lo, hi] = [Math.min(vals[0], vals[1]), Math.max(vals[0], vals[1])]
    return { ideal: Math.round((lo + (hi - lo) / 2) / 500) * 500, maximum: hi }
  }
  const n = vals[0]
  const isMax = /\b(under|below|max|maximum|at most|upto|up to|no more than|less than|not more than|cap)\b/.test(t)
  return { ideal: Math.round((isMax ? n * 0.85 : n) / 500) * 500, maximum: isMax ? n : Math.round((n * 1.15) / 500) * 500 }
}

export function parseAnswer(step: number, text: string): Parsed {
  const raw = text.trim()
  const lower = raw.toLowerCase()

  if (step === 3) {
    const b = parseBudget(raw)
    if (b) return { prefs: [{ category: 'budget', label: `Up to ₹${Math.round(b.maximum / 1000)}K total`, priority: 'must-have' }], budget: b, unsure: [] }
    if (FLEX.test(lower)) return { prefs: [{ category: 'budget', label: 'Budget: flexible', priority: 'flexible' }], unsure: [] }
    return { prefs: [{ category: 'budget', label: 'Budget: not sure yet', priority: 'not-sure' }], unsure: ['Budget'] }
  }

  // Split into phrases so "Goa, but no clubbing" becomes two preferences.
  const clauses = lower
    .split(/\s*(?:[,;.!]|\bbut\b|\band also\b|\balso\b|\bplus\b|\bas well as\b|\band\b(?=\s+(?:no|not|avoid|don'?t|without|i|we|definitely|maybe)\b))\s*/)
    .map((c) => c.trim())
    .filter((c) => c.length > 1)

  const prefs: Pref[] = []
  const unsure: string[] = []
  const seen = new Set<string>()
  const leftovers: string[] = []
  const push = (x: Pref) => {
    const key = x.category + x.label
    if (!seen.has(key)) { seen.add(key); prefs.push(x) }
  }

  for (const clause of clauses.length ? clauses : [lower]) {
    const neutral = /\b(no preference|not sure|don'?t mind|doesn'?t matter|no problem|no issue|not fussy)\b/.test(clause)
    const negated = !neutral && (NEGATE.test(clause) || /\b(avoid|hate|not into|not a fan of|without|skip|no)\b/.test(clause))
    const s = strength(clause, negated)
    let matched = false
    const cats = new Set<PreferenceCategory>()
    for (const tp of TOPICS) {
      if (tp.steps && !tp.steps.includes(step)) continue
      if (!tp.re.test(clause)) continue
      // one destination / date / stay / style per phrase; several "wants" can stack
      if (tp.cat !== 'want' && cats.has(tp.cat)) continue
      cats.add(tp.cat)
      matched = true
      if (negated && (tp.cat === 'want' || tp.cat === 'style')) {
        push({ category: 'avoid', label: tp.label, priority: s ?? 'prefer' })
      } else if (negated && tp.cat === 'destination') {
        push({ category: 'destination', label: `Not ${tp.label}`, priority: s ?? 'prefer' })
      } else {
        // A topic was recognised; with no strength words, assume a normal preference.
        push({ category: tp.cat, label: tp.label, priority: s ?? (tp.cat === 'dates' && tp.label.startsWith('Back') ? 'must-have' : 'prefer') })
      }
    }
    if (!matched) {
      if (/^(yes|yeah|yep|sure|ok|okay|fine|works|sounds good)\b/.test(clause) && step === 2) {
        push({ category: 'dates', label: 'Free all three days', priority: 'flexible' })
        continue
      }
      if (/^(nothing|none|no|nope|nah|not really|all good|that'?s it)( really| much| at all| else)?$/.test(clause)) continue
      // "Anything works" answers map to the open version of the question.
      if (s === 'flexible' && FLEX_LABEL[step]) { push({ category: STEP_DEFAULT_CAT[step], label: FLEX_LABEL[step]!, priority: 'flexible' }); continue }
      const label = tidy(clause)
      if (!label) continue
      // A phrase with no topic or strength next to others is usually a reason ("too far"): hold it back.
      if (!s && clauses.length > 1) { leftovers.push(label); continue }
      const cat: PreferenceCategory = negated ? 'avoid' : STEP_DEFAULT_CAT[step]
      if (s) push({ category: cat, label, priority: s })
      else { push({ category: cat, label, priority: 'not-sure' }); unsure.push(label) }
    }
  }

  // Nothing else understood: keep the held-back phrases rather than dropping what the user said.
  if (prefs.length === 0 && leftovers.length) {
    for (const l of leftovers) push({ category: STEP_DEFAULT_CAT[step], label: l, priority: 'not-sure' })
    return { prefs, unsure: leftovers }
  }
  if (prefs.length === 0 && step === 5) return { prefs: [], unsure: [] }
  if (prefs.length === 0) {
    const label = tidy(raw) || raw
    return { prefs: [{ category: STEP_DEFAULT_CAT[step], label, priority: 'not-sure' }], unsure: [label] }
  }
  return { prefs, unsure }
}
