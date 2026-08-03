const SIGNUP_COOLDOWN_KEY = 'vh-signup-last'
const SIGNUP_COOLDOWN_MS = 30_000

export function canSignUp(): boolean {
  const last = localStorage.getItem(SIGNUP_COOLDOWN_KEY)
  if (!last) return true
  return Date.now() - Number(last) >= SIGNUP_COOLDOWN_MS
}

export function recordSignUp(): void {
  localStorage.setItem(SIGNUP_COOLDOWN_KEY, String(Date.now()))
}
