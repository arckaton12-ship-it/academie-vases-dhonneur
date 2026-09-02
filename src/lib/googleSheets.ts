export async function sendEnrollmentToSheets(student: {
  first_name: string
  last_name: string
  email: string
  class_name?: string
  role: string
}) {
  const url = import.meta.env.VITE_GOOGLE_SHEETS_URL
  if (!url) return
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'enrollment',
        ...student,
        enrolled_at: new Date().toISOString(),
      }),
    })
  } catch {
    // Silent fail — sheets is best-effort
  }
}

export async function sendBilanToGoogleSheets(bilan: {
  student_name: string
  week_number: number
  resume_done: boolean
  meditation_status: string
  meditation_days: number
  evangelisation_status: string
  contact_name?: string | null
  contact_phone?: string | null
  bilan_day?: number | null
}) {
  const url = import.meta.env.VITE_GOOGLE_SHEETS_URL
  if (!url) return
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'weekly_bilan',
        ...bilan,
        submitted_at: new Date().toISOString(),
      }),
    })
  } catch {
    // Silent fail — sheets is best-effort
  }
}
