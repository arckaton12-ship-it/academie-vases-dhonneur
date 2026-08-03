import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Logo } from '@/components/Logo'
import { SectionWatermark } from '@/components/SectionWatermark'
import { VerseReference } from '@/components/VerseReference'
import { Marquee } from '@/components/ui/Marquee'
import { getLandingAvatars } from '@/lib/courses'

export default function Landing() {
  const [avatars, setAvatars] = useState<string[]>([])

  useEffect(() => {
    getLandingAvatars().then(setAvatars).catch(() => undefined)
  }, [])

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <SectionWatermark kind="croix" />
      <div className="relative z-10 mb-10 text-center">
        <div className="mb-4 flex justify-center">
          <Logo showText={false} size={36} />
        </div>
        <h1 className="font-display text-3xl font-semibold text-bordeaux sm:text-4xl">
          Académie Vases d'Honneur
        </h1>
        <p className="mt-2 text-sm text-pierre sm:text-base">
          Formation biblique & discipulat — Yaoundé
        </p>
        <VerseReference className="mt-2 inline-block" />
      </div>

      {avatars.length > 2 && (
        <div className="relative z-10 mb-10 w-full max-w-md overflow-hidden">
          <Marquee pauseOnHover className="py-2">
            {avatars.map((url, i) => (
              <span key={i} className="mx-1 inline-block">
                <img
                  src={url}
                  alt=""
                  className="h-10 w-10 rounded-full border-2 border-or/40 object-cover"
                />
              </span>
            ))}
          </Marquee>
        </div>
      )}

      <div className="relative z-10 w-full max-w-sm space-y-4">
        <Link to="/etudiant/connexion" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardTitle>Accès Étudiant</CardTitle>
            <CardDescription className="mt-1">
              Suis tes cours, ton streak et ton parcours de discipulat.
            </CardDescription>
          </Card>
        </Link>

        <Link to="/moderateur/connexion" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardTitle>Accès Modérateur</CardTitle>
            <CardDescription className="mt-1">
              Modération des classes, supports, mini-tâches et rapports de session.
            </CardDescription>
          </Card>
        </Link>

        <Link to="/admin/connexion" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardTitle>Accès Administration</CardTitle>
            <CardDescription className="mt-1">
              Gestion de l'académie : comptes, classes, modérateurs, notes et exports.
            </CardDescription>
          </Card>
        </Link>
      </div>
    </div>
  )
}
