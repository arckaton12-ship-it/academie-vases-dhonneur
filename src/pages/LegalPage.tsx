import { PublicShell } from '@/components/PublicShell'

const CONTACT_EMAIL = 'vhassembleeeauxpaisibles@gmail.com'
const LAST_UPDATE = '14 novembre 2026'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-card p-6">
      <h2 className="font-display text-lg font-semibold text-bordeaux dark:text-slate-100">{title}</h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-pierre dark:text-slate-400">
        {children}
      </div>
    </section>
  )
}

export function LegalPage() {
  return (
    <PublicShell>
      <h1 className="font-display text-3xl font-bold text-bordeaux dark:text-slate-100">
        Mentions légales et confidentialité
      </h1>
      <p className="mt-3 text-sm text-pierre dark:text-slate-400">
        Dernière mise à jour : {LAST_UPDATE}.
      </p>

      <div className="mt-8 space-y-4">
        <Section title="Éditeur de l'application">
          <p>
            L'application Académie Vases d'Honneur est éditée par l'Église Vases d'Honneur,
            Assemblée Eaux Paisibles de Yaoundé, au Cameroun.
          </p>
          <p>
            Contact : <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </Section>

        <Section title="Hébergement et prestataires">
          <p>
            Le site est hébergé par Cloudflare Pages. Les comptes, la base de données et
            l'authentification reposent sur Supabase. Les polices d'écriture sont fournies par
            Google Fonts.
          </p>
          <p>
            Un service de suivi des erreurs techniques peut recevoir des informations anonymisées
            sur les dysfonctionnements de l'application, afin de les corriger.
          </p>
        </Section>

        <Section title="Données collectées">
          <p>
            Lors de l'inscription et de l'utilisation, nous enregistrons les données nécessaires au
            parcours : nom, prénom, adresse email, téléphone, photo de profil, tribu et
            département, classe et niveau, cours suivis, résumés soumis, notes, badges, quiz,
            méditations et messages échangés dans l'application.
          </p>
          <p>
            Ces données servent uniquement à gérer ton compte, ton suivi pédagogique et la
            communication avec ton modérateur et l'administration. Elles ne sont ni vendues ni
            utilisées à des fins publicitaires.
          </p>
        </Section>

        <Section title="Cookies et stockage local">
          <p>
            L'application n'utilise pas de cookies publicitaires. Elle stocke localement les
            informations nécessaires à ton fonctionnement : session de connexion, thème clair ou
            sombre, préférences d'affichage et état des notifications.
          </p>
        </Section>

        <Section title="Conservation et sécurité">
          <p>
            Les données sont conservées pendant la durée de ta formation et la relation avec
            l'Académie. L'accès est limité aux personnes qui accompagnent ton parcours :
            modérateur, administrateur de classe et administration générale.
          </p>
          <p>
            Les mots de passe ne sont jamais stockés en clair : l'authentification est gérée par
            Supabase. Malgré ces précautions, aucun système n'est infaillible ; signale-nous toute
            anomalie.
          </p>
        </Section>

        <Section title="Tes droits">
          <p>
            Tu peux demander l'accès à tes données, leur rectification ou leur suppression, et
            retirer ton consentement. Écris à{' '}
            <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> depuis
            l'adresse liée à ton compte.
          </p>
          <p>
            La suppression d'un compte entraîne la perte de ton historique de formation. Elle est
            donc traitée après vérification de ton identité.
          </p>
        </Section>

        <Section title="Propriété intellectuelle">
          <p>
            Les cours, vidéos, supports, textes, logos et éléments graphiques de l'Académie sont
            protégés. Ils sont réservés à un usage personnel dans le cadre de ta formation et ne
            peuvent être redistribués sans autorisation écrite.
          </p>
        </Section>

        <Section title="Évolution de ces mentions">
          <p>
            Ces mentions peuvent être mises à jour pour refléter une évolution du service ou de la
            réglementation. La date de dernière mise à jour figure en haut de cette page.
          </p>
        </Section>
      </div>
    </PublicShell>
  )
}
