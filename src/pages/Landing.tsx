import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Logo } from '@/components/Logo'
import { SectionWatermark } from '@/components/SectionWatermark'
import { VerseReference } from '@/components/VerseReference'
import { Marquee } from '@/components/ui/Marquee'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import { getLandingAvatars } from '@/lib/courses'

export default function Landing() {
  const [avatars, setAvatars] = useState<string[]>([])

  useEffect(() => {
    getLandingAvatars().then(setAvatars).catch(() => undefined)
  }, [])

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-bordeaux/5 via-or/5 to-olive/5 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }} />
        <div className="absolute top-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-or/8 blur-[120px] animate-float" />
        <div className="absolute bottom-[-15%] left-[-10%] h-[400px] w-[400px] rounded-full bg-bordeaux/8 blur-[100px] animate-float-delayed" />
      </div>

      <SectionWatermark kind="croix" />

      {/* Dark mode toggle top-right */}
      <div className="absolute right-4 top-4 z-20">
        <DarkModeToggle />
      </div>

      {/* Hero content */}
      <div className="relative z-10 mb-10 text-center stagger-children">
        <div className="mb-6 flex justify-center">
          <div className="animate-scale-in">
            <Logo showText={false} size={48} />
          </div>
        </div>
        <h1 className="font-display text-4xl font-semibold text-bordeaux drop-shadow-sm sm:text-5xl dark:text-slate-100">
          Académie Vases d'Honneur — Assemblée Eaux Paisibles de Yaoundé
        </h1>
        <p className="mt-3 text-base text-pierre sm:text-lg dark:text-slate-400">
          École de disciples
        </p>
        <p className="mt-2 font-serif text-sm italic text-or/80 dark:text-or/70">
          « La Création attend avec un ardent désir la Révélation des Fils de Dieu » — Romains 8:19
        </p>
        <VerseReference className="mt-3 inline-block" />
      </div>

      {/* Avatar marquee */}
      {avatars.length > 2 && (
        <div className="relative z-10 mb-10 w-full max-w-md overflow-hidden animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Marquee pauseOnHover className="py-2">
            {avatars.map((url, i) => (
              <span key={i} className="mx-1 inline-block">
                <img
                  src={url}
                  alt=""
                  className="h-10 w-10 rounded-full border-2 border-or/40 object-cover transition-transform duration-200 hover:scale-110 hover:border-or"
                />
              </span>
            ))}
          </Marquee>
        </div>
      )}

      {/* Access cards */}
      <div className="relative z-10 w-full max-w-sm space-y-4 stagger-children">
        <Link to="/etudiant/connexion" className="block animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <Card className="glass-card group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bordeaux/10 text-bordeaux transition-colors group-hover:bg-bordeaux group-hover:text-white dark:bg-or/10 dark:text-or dark:group-hover:bg-or dark:group-hover:text-slate-900">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>
              <div>
                <CardTitle className="!text-base">Accès Étudiant</CardTitle>
                <CardDescription className="mt-0.5">
                  Suis tes cours, ton streak et ton parcours.
                </CardDescription>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/moderateur/connexion" className="block animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <Card className="glass-card group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bordeaux/10 text-bordeaux transition-colors group-hover:bg-bordeaux group-hover:text-white dark:bg-or/10 dark:text-or dark:group-hover:bg-or dark:group-hover:text-slate-900">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <CardTitle className="!text-base">Accès Modérateur</CardTitle>
                <CardDescription className="mt-0.5">
                  Modération, supports et rapports de session.
                </CardDescription>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/connexion" className="block animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
          <Card className="glass-card group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bordeaux/10 text-bordeaux transition-colors group-hover:bg-bordeaux group-hover:text-white dark:bg-or/10 dark:text-or dark:group-hover:bg-or dark:group-hover:text-slate-900">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </div>
              <div>
                <CardTitle className="!text-base">Accès Administration</CardTitle>
                <CardDescription className="mt-0.5">
                  Gestion de l'académie : comptes, classes, notes.
                </CardDescription>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}
