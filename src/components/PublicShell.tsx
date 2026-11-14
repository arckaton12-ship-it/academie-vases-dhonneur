import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { DarkModeToggle } from '@/components/DarkModeToggle'

/**
 * Coquille commune aux pages publiques (contact, mentions légales, 404).
 * Même fond, même verre et même pied de page que l'accueil.
 */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora-blob absolute -left-24 -top-32 h-[420px] w-[420px] rounded-full bg-bordeaux/15 blur-[110px] dark:bg-bordeaux/25" />
        <div className="aurora-blob absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full bg-or/15 blur-[110px] [animation-delay:-6s] dark:bg-or/10" />
      </div>

      <header className="relative z-20 border-b border-pierre/10">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Retour à l'accueil">
            <Logo size={30} />
            <span className="truncate font-display text-sm font-semibold text-bordeaux dark:text-slate-100 sm:text-base">
              Académie Vases d'Honneur
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/etudiant/connexion"
              className="hidden text-sm font-medium text-bordeaux underline-offset-2 hover:underline dark:text-or sm:inline"
            >
              Se connecter
            </Link>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-6 sm:py-14">
        {children}
      </main>

      <footer className="relative z-10 border-t border-pierre/10 px-5 py-6 text-center text-xs text-pierre dark:text-slate-500">
        <p>© 2026 Académie Vases d'Honneur — Assemblée Eaux Paisibles de Yaoundé</p>
        <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Link to="/contact" className="hover:underline">
            Contact
          </Link>
          <span aria-hidden>·</span>
          <Link to="/mentions-legales" className="hover:underline">
            Mentions légales
          </Link>
          <span aria-hidden>·</span>
          <Link to="/etudiant/inscription" className="hover:underline">
            Inscription
          </Link>
        </p>
      </footer>
    </div>
  )
}
