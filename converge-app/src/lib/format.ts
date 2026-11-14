export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
export const signed = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + inr(Math.abs(n))
export const now = () => new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
export const uid = () => Math.random().toString(36).slice(2, 9)

/** How a preference reads on screen; "avoid" items are prefixed so they cannot be misread as wants. */
export const prefText = (p: { category: string; label: string }) => (p.category === 'avoid' && !/^avoid/i.test(p.label) ? `Avoid: ${p.label}` : p.label)
