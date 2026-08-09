interface CoursePlayerProps {
  audioUrl?: string | null
  videoUrl?: string | null
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

export function CoursePlayer({ audioUrl, videoUrl }: CoursePlayerProps) {
  const ytId = videoUrl ? extractYouTubeId(videoUrl) : null

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
