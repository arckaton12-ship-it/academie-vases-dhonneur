import { Avatar } from '@/components/Avatar'

interface AvatarStatusProps {
  url?: string | null
  firstName?: string | null
  lastName?: string | null
  size?: number
  online?: boolean
  onClick?: () => void
}

export function AvatarStatus({ url, firstName, lastName, size = 40, online, onClick }: AvatarStatusProps) {
  return (
    <div className="relative inline-flex" onClick={onClick}>
      <Avatar url={url ?? null} firstName={firstName ?? undefined} lastName={lastName ?? undefined} size={size} />
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-800 ${
            online ? 'bg-green-500' : 'bg-slate-400'
          }`}
        />
      )}
    </div>
  )
}
