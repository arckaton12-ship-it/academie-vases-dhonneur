interface CoursePlayerProps {
  audioUrl?: string | null
  videoUrl?: string | null
}

export function CoursePlayer({ audioUrl, videoUrl }: CoursePlayerProps) {
  return (
    <div className="space-y-4">
      {audioUrl && (
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-pierre">Écouter le cours</p>
          <audio controls preload="metadata" className="w-full" src={audioUrl}>
            Ton navigateur ne prend pas en charge le lecteur audio.
          </audio>
        </div>
      )}

      {videoUrl && (
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-pierre">Regarder le cours</p>
          <video controls preload="metadata" className="w-full rounded-card border border-sable/60" src={videoUrl}>
            Ton navigateur ne prend pas en charge le lecteur vidéo.
          </video>
        </div>
      )}

      {!audioUrl && !videoUrl && (
        <p className="rounded-card border border-pierre/15 bg-white/60 px-3 py-2.5 text-sm text-pierre">
          Le contenu audio/vidéo de ce cours n'est pas encore disponible.
        </p>
      )}
    </div>
  )
}

export function downloadCourseMedia(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.target = '_blank'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
