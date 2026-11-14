import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MessagingPanel } from '@/components/MessagingPanel'
import { sendBroadcastMessage } from '@/lib/messaging'
import { useAdminDashboardContext } from '@/pages/admin/AdminDashboardContext'

export function MessagerieSection() {
  const {
    broadcastText,
    setBroadcastText,
    broadcastSending,
    setBroadcastSending,
    broadcastResult,
    setBroadcastResult,
    adminProfile,
  } = useAdminDashboardContext()

  return (
        <div className="space-y-4">
          <Card>
            <CardTitle>Envoyer un message à tous les membres</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Ton message sera envoyé en privé à chaque membre actif de l'Académie.
            </CardDescription>
            <textarea
              rows={3}
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              placeholder="Écris ton message ici…"
              className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
            />
            <div className="mt-2 flex items-center gap-3">
              <Button
                variant="primary"
                disabled={!broadcastText.trim() || broadcastSending}
                onClick={async () => {
                  setBroadcastSending(true)
                  setBroadcastResult(null)
                  try {
                    const { sent } = await sendBroadcastMessage(broadcastText.trim())
                    setBroadcastResult(`Message envoyé à ${sent} membre${sent > 1 ? 's' : ''}.`)
                    setBroadcastText('')
                  } catch (e) {
                    setBroadcastResult(e instanceof Error ? e.message : 'Erreur lors de l\'envoi.')
                  } finally {
                    setBroadcastSending(false)
                  }
                }}
              >
                {broadcastSending ? 'Envoi…' : 'Envoyer à tous'}
              </Button>
              {broadcastResult && <p className="text-sm text-olive">{broadcastResult}</p>}
            </div>
          </Card>
          <MessagingPanel currentUserId={adminProfile?.id ?? ''} userRole="ADMINISTRATEUR" />
        </div>
  )
}
