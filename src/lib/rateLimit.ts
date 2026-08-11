const SIGNUP_COOLDOWN_KEY = 'vh-signup-last'
const SIGNUP_COOLDOWN_MS = 5_000

export function canSignUp(): boolean {
  const last = localStorage.getItem(SIGNUP_COOLDOWN_KEY)
  if (!last) return true
  return Date.now() - Number(last) >= SIGNUP_COOLDOWN_MS
}

export function recordSignUp(): void {
  localStorage.setItem(SIGNUP_COOLDOWN_KEY, String(Date.now()))
}

export function generateSecurePassword(length = 14): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const digits = '0123456789'
  const special = '!@#$%&*'
  const all = upper + lower + digits + special
  const arr = new Uint8Array(length)
  crypto.getRandomValues(arr)
  // Ensure at least one of each type
  let pw = ''
  pw += upper[arr[0] % upper.length]
  pw += lower[arr[1] % lower.length]
  pw += digits[arr[2] % digits.length]
  pw += special[arr[3] % special.length]
  for (let i = 4; i < length; i++) {
    pw += all[arr[i] % all.length]
  }
  // Shuffle
  return pw.split('').sort(() => Math.random() - 0.5).join('')
}
