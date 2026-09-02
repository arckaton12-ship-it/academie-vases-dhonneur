import { useState, useEffect, useRef, useCallback } from 'react'
import { toGoogleDriveDirectUrl, isGoogleDriveUrl } from '../lib/utils'
import type { AudioPart } from '../lib/types'

interface CoursePlayerProps {
  audioUrl?: string | null
  audioParts?: AudioPart[] | null
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

async function fetchDriveBlob(url: string): Promise<string> {
  const direct = toGoogleDriveDirectUrl(url)
  const res = await fetch(direct)
  if (!res.ok) throw new Error(`Erreur ${res.status}`)
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

function AudioStrip({ parts, onSelect, activeIndex }: { parts: AudioPart[]; onSelect: (i: number) => void; activeIndex: number | null }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  return (
    <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
      {parts.map((part, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${
            activeIndex === i
              ? 'bg-or text-white shadow-sm'
              : 'border border-or/30 bg-or/5 text-terre hover:bg-or/15'
          }`}
        >
          {part.nom || `Partie ${i + 1}`}
        </button>
      ))}
    </div>
  )
}

function AudioPlayer({ url, name }: { url: string; name?: string }) {
  const [src, setSrc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const audioRef = useRef<HTMLAudioElement>(null)
  const blobUrlRef = useRef('')

  const load = useCallback(async () => {
    if (src || loading) return
    setLoading(true)
    setError('')
    try {
      const blobUrl = await fetchDriveBlob(url)
      blobUrlRef.current = blobUrl
      setSrc(blobUrl)
    } catch {
      setError("Impossible de charger l'audio depuis Google Drive")
    } finally {
      setLoading(false)
    }
  }, [url, src, loading])

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, [])

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-bordeaux">
        <span>{error}</span>
        <a href={toGoogleDriveDirectUrl(url)} target="_blank" rel="noopener"
          className="underline text-or font-medium">Telecharger</a>
      </div>
    )
  }

  if (!src) {
    return (
      <button onClick={load} disabled={loading}
        className="flex items-center gap-2 rounded-card border border-or/30 bg-or/5 px-3 py-2 text-sm font-medium text-bordeaux hover:bg-or/10 transition disabled:opacity-50">
        {loading ? (
          <><span className="h-4 w-4 animate-spin rounded-full border-2 border-or border-t-transparent" /> Chargement...</>
        ) : (
          <><svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Ecouter{name ? ` — ${name}` : ''}</>
        )}
      </button>
    )
  }

  return <audio ref={audioRef} controls autoPlay className="w-full" src={src}>
    Ton navigateur ne prend pas en charge le lecteur audio.
  </audio>
}

export function CoursePlayer({ audioUrl, audioParts, videoUrl, week, title }: CoursePlayerProps) {
  const ytId = videoUrl ? extractYouTubeId(videoUrl) : null
  const [selectedPart, setSelectedPart] = useState<number | null>(null)

  const noMediaMessage = (() => {
    const t = (title ?? '').toLowerCase()
    if (t.includes('prise de contact') || t.includes('contact')) {
      return "Cette semaine est dediee a la prise de contact. Profites-en pour lire le programme et faire connaissance avec ta classe."
    }
    if (week === 1) {
      return "Cette premiere semaine est consacree a la prise de contact — pas de cours audio/video pour le moment."
    }
    if (t.includes('rattrapage') || t.includes('examen') || t.includes('evaluation')) {
      return "Ce cours n'a pas de contenu audio/video prevu."
    }
    return "Le contenu audio/video de ce cours sera bientot disponible."
  })()

  const hasParts = audioParts && audioParts.length > 0
  const activePart = hasParts && selectedPart !== null ? audioParts![selectedPart] : null
  const activeUrl = activePart?.audio || null

  const handleDownload = useCallback(() => {
    if (!activeUrl) return
    const filename = `${title || 'cours'} - ${activePart?.nom || 'audio'}.mp3`
    downloadCourseMedia(activeUrl, filename)
  }, [activeUrl, activePart, title])

  return (
    <div className="space-y-3">
      {hasParts && (
        <>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-pierre">
              Parties audio ({audioParts!.length})
            </p>
            <AudioStrip parts={audioParts!} onSelect={setSelectedPart} activeIndex={selectedPart} />
          </div>

          {selectedPart !== null && activePart?.audio && (
            <div className="rounded-card border border-sable/60 bg-creme/50 p-3 space-y-2">
              <p className="text-sm font-medium text-terre">{activePart.nom || `Partie ${(selectedPart as number) + 1}`}</p>
              <AudioPlayer url={activePart.audio} name={activePart.nom} />
              <button onClick={handleDownload}
                className="flex items-center gap-1.5 text-xs font-medium text-or hover:underline">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Telecharger
              </button>
            </div>
          )}

          {selectedPart === null && (
            <p className="text-xs text-pierre italic">Selectionne une partie pour l'ecouter</p>
          )}
        </>
      )}

      {!hasParts && audioUrl && (
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-pierre">Ecouter le cours</p>
          <AudioPlayer url={audioUrl} />
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
                title="Video du cours"
              />
            </div>
          ) : (
            <video controls preload="metadata" className="w-full rounded-card border border-sable/60" src={videoUrl}>
              Ton navigateur ne prend pas en charge la lecture video.
            </video>
          )}
        </div>
      )}

      {!audioUrl && !hasParts && !videoUrl && (
        <p className="rounded-card border border-or/20 bg-or/5 px-3 py-2.5 text-sm text-bordeaux">
          {noMediaMessage}
        </p>
      )}
    </div>
  )
}

export function downloadCourseMedia(url: string, filename: string) {
  const direct = toGoogleDriveDirectUrl(url)
  if (isGoogleDriveUrl(url)) {
    window.open(direct, '_blank', 'noopener')
    return
  }
  const a = document.createElement('a')
  a.href = direct
  a.download = filename
  a.target = '_blank'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
