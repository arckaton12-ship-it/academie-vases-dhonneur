import { Link } from 'react-router-dom'
import { PublicShell } from '@/components/PublicShell'

export function NotFoundPage() {
  return (
    <PublicShell>
      <div className="glass-panel px-6 py-14 text-center sm:px-10">
        <p className="font-display text-6xl font-bold text-or">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-bordeaux dark:text-slate-100">
          Cette page est introuvable
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-pierre dark:text-slate-400">
          Le lien est peut-être ancien, ou l'adresse contient une faute. Tu peux revenir à
          l'accueil ou rejoindre ton espace.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-bordeaux px-6 py-2.5 text-sm font-medium text-parchemin transition-colors hover:bg-olive dark:bg-or dark:text-slate-900 dark:hover:bg-or-light"
          >
            Retour à l'accueil
          </Link>
          <Link
            to="/etudiant/connexion"
            className="inline-flex items-center gap-2 rounded-full border border-bordeaux px-6 py-2.5 text-sm font-medium text-bordeaux transition-colors hover:bg-bordeaux/5 dark:border-or/50 dark:text-or dark:hover:bg-or/10"
          >
            Me connecter
          </Link>
        </div>
      </div>
    </PublicShell>
  )
}
