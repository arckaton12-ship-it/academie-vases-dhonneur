interface CoursePlayerProps {
  audioUrl?: string | null
  videoUrl?: string | null
  week?: number | null
  title?: string | null
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

export function CoursePlayer({ audioUrl, videoUrl, week, title }: CoursePlayerProps) {
  const ytId = videoUrl ? extractYouTubeId(videoUrl) : null

  const noMediaMessage = (() => {
    const t = (title ?? '').toLowerCase()
    if (t.includes('prise de contact') || t.includes('contact')) {
      return "Cette semaine est dédiée à la prise de contact. Profites-en pour lire le programme et faire connaissance avec ta classe."
    }
    if (week === 1) {
      return "Cette première semaine est consacrée à la prise de contact — pas de cours audio/vidéo pour le moment."
    }
    if (t.includes('rattrapage') || t.includes('examen') || t.includes('évaluation')) {
      return "Ce cours n'a pas de contenu audio/vidéo prévu."
    }
    return "Le contenu audio/vidéo de ce cours sera bientôt disponible."
  })()

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
          {ytId ? (
            <div className="relative w-full overflow-hidden rounded-card border border-sable/60" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Vidéo du cours"
              />
            </div>
          ) : (
            <video controls preload="metadata" className="w-full rounded-card border border-sable/60" src={videoUrl}>
              Ton navigateur ne prend pas en charge le lecteur vidéo.
            </video>
          )}
        </div>
      )}

      {!audioUrl && !videoUrl && (
        <p className="rounded-card border border-or/20 bg-or/5 px-3 py-2.5 text-sm text-bordeaux">
          {noMediaMessage}
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
