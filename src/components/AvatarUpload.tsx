import { ChangeEvent, useRef, useState } from 'react'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/ui/Button'
import { uploadAvatar, updateAvatarUrl } from '@/lib/avatars'

interface AvatarUploadProps {
  url?: string | null
  firstName?: string
  lastName?: string
  userId: string
  size?: number
  onSaved?: (url: string | null) => void
}

export function AvatarUpload({ url, firstName, lastName, userId, size = 72, onSaved }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setMessage(null)
    try {
      const newUrl = await uploadAvatar(file, userId)
      await updateAvatarUrl(userId, newUrl)
      onSaved?.(newUrl)
      setMessage('Photo de profil mise à jour.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur lors de l\u2019upload.')
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  async function handleRemove() {
    setBusy(true)
    setMessage(null)
    try {
      await updateAvatarUrl(userId, null)
      onSaved?.(null)
      setMessage('Photo de profil supprimée.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur lors de la suppression.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar url={url} firstName={firstName} lastName={lastName} size={size} />
        <div className="space-y-2">
          <Button
            variant="outline"
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="!px-3 !py-1.5 text-xs"
          >
            {busy ? 'Enregistrement…' : 'Changer la photo'}
          </Button>
          {url && (
            <Button
              variant="ghost"
              type="button"
              disabled={busy}
              onClick={handleRemove}
              className="!px-3 !py-1.5 text-xs"
            >
              Supprimer
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      {message && <p className="mt-2 text-sm text-olive">{message}</p>}
      <p className="mt-1 text-xs text-pierre">Image uniquement, 5 Mo maximum.</p>
    </div>
  )
}
