import { Link } from 'react-router-dom'
import { PublicShell } from '@/components/PublicShell'

const CONTACT_EMAIL = 'vhassembleeeauxpaisibles@gmail.com'

export function ContactPage() {
  return (
    <PublicShell>
      <h1 className="font-display text-3xl font-bold text-bordeaux dark:text-slate-100">
        Nous contacter
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-pierre dark:text-slate-400">
        Une question sur l'inscription, le parcours ou ton compte ? L'équipe de l'Académie te
        répond directement.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="glass-card p-6">
          <h2 className="font-display text-lg font-semibold text-bordeaux dark:text-slate-100">
            Par email
          </h2>
          <p className="mt-2 text-sm text-pierre dark:text-slate-400">
            Écris-nous à l'adresse du secrétariat de l'Assemblée. Nous répondons sous 24 à 48
            heures ouvrées.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Acad%C3%A9mie%20Vases%20d%27Honneur`}
            className="mt-4 inline-flex max-w-full items-center gap-2 break-all rounded-full bg-bordeaux px-5 py-2.5 text-sm font-medium text-parchemin transition-colors hover:bg-olive dark:bg-or dark:text-slate-900 dark:hover:bg-or-light"
          >
            {CONTACT_EMAIL}
          </a>
        </div>

        <div className="glass-card p-6">
          <h2 className="font-display text-lg font-semibold text-bordeaux dark:text-slate-100">
            Sur place
          </h2>
          <p className="mt-2 text-sm text-pierre dark:text-slate-400">
            Assemblée Eaux Paisibles, Yaoundé, Cameroun. Les cours se déroulent en ligne, avec un
            accompagnement assuré par ton modérateur de classe.
          </p>
          <p className="mt-3 text-xs text-pierre dark:text-slate-500">
            Pour connaître les horaires de la prochaine session, écris au secrétariat.
          </p>
        </div>
      </div>

      <div className="glass-panel mt-5 p-6">
        <h2 className="font-display text-lg font-semibold text-bordeaux dark:text-slate-100">
          Déjà étudiant ?
        </h2>
        <p className="mt-2 text-sm text-pierre dark:text-slate-400">
          Le chemin le plus rapide reste la messagerie de l'application : ton modérateur et
          l'administration y voient ton dossier et ton avancement.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/etudiant/connexion"
            className="inline-flex items-center gap-2 rounded-full border border-bordeaux px-5 py-2.5 text-sm font-medium text-bordeaux transition-colors hover:bg-bordeaux/5 dark:border-or/50 dark:text-or dark:hover:bg-or/10"
          >
            Me connecter
          </Link>
          <Link
            to="/etudiant/inscription"
            className="inline-flex items-center gap-2 rounded-full border border-bordeaux px-5 py-2.5 text-sm font-medium text-bordeaux transition-colors hover:bg-bordeaux/5 dark:border-or/50 dark:text-or dark:hover:bg-or/10"
          >
            M'inscrire
          </Link>
        </div>
      </div>
    </PublicShell>
  )
}
