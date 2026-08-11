import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import { getLandingAvatars } from '@/lib/courses'
import { Marquee } from '@/components/ui/Marquee'

const STATS = [
  { value: '3', label: 'Niveaux de formation' },
  { value: '28', label: 'Cours dispensés' },
  { value: '12', label: 'Badges à débloquer' },
  { value: '100%', label: 'Gratuit' },
]

const PILLARS = [
  {
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
    title: 'Parcours structuré',
    desc: '3 niveaux, 28 cours, un suivi rigoureux de ta progression spirituelle.',
  },
  {
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    title: 'Suivi pastoral',
    desc: 'Un modérateur dédié, une fiche d\'âme, un accompagnement personnalisé.',
  },
  {
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    title: 'Communauté',
    desc: 'Binômage, messagerie instantanée, annonces — reste connecté à ta classe.',
  },
]

const TESTIMONIALS = [
  {
    text: 'L\'académie m\'a appris à structurer ma vie de prière. Le suivi du modérateur fait toute la différence.',
    name: 'Sarah M.',
    role: 'Étudiante — Niveau 2',
  },
  {
    text: 'Les cours sont clairs, pratiques et directement applicables. J\'ai grandi en confiance.',
    name: 'David K.',
    role: 'Étudiant — Niveau 1',
  },
  {
    text: 'Le système de badges et la progression me motivent à rester assidu chaque semaine.',
    name: 'Marie N.',
    role: 'Étudiante — Niveau 3',
  },
]

const FAQ = [
  {
    q: 'L\'académie est-elle vraiment gratuite ?',
    a: 'Oui, entièrement. Aucun frais d\'inscription ni de cours. L\'académie est un service de l\'Assemblée Eaux Paisibles de Yaoundé.',
  },
  {
    q: 'Comment ça marche concrètement ?',
    a: 'Tu t\'inscris, on t\'attribue à une classe avec un modérateur. Chaque semaine tu suis un cours, tu soumets un résumé et tu reçois un retour personnalisé.',
  },
  {
    q: 'Je peux rejoindre à tout moment ?',
    a: 'Les inscriptions sont ouvertes en permanence. Tu commences au niveau 1 et tu progresses selon ton rythme et les recommandations de ton modérateur.',
  },
  {
    q: 'Quel est le niveau requis ?',
    a: 'Aucun prérequis. Il suffit d\'un cœur désireux d\'apprendre et de grandir spirituellement. Les cours sont accessibles à tous.',
  },
]

export default function Landing() {
  const [avatars, setAvatars] = useState<{ url: string | null; name: string }[]>([])
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    getLandingAvatars().then(setAvatars).catch(() => undefined)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-bordeaux/5 via-or/5 to-olive/5" />
        <div className="absolute top-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-or/8 blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-10%] h-[400px] w-[400px] rounded-full bg-bordeaux/8 blur-[100px]" />
      </div>

      {/* Dark mode */}
      <div className="absolute right-4 top-4 z-20">
        <DarkModeToggle />
      </div>

      {/* ─── HERO ─── */}
      <section className="relative z-10 flex min-h-[90vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 animate-scale-in">
                <Logo showText={false} size={80} />
        </div>

        <h1 className="font-display text-3xl font-bold text-bordeaux drop-shadow-sm sm:text-5xl lg:text-6xl dark:text-slate-100">
          Forme-toi.<br />
          <span className="text-or">Grandis.</span><br />
          Sers le Maître.
        </h1>

        <p className="mt-5 max-w-lg text-base text-pierre sm:text-lg dark:text-slate-400">
          L'académie biblique en ligne de l'Église Vases d'Honneur Assemblée Eaux Paisibles de Yaoundé. Un parcours structuré pour acquérir de solide fondements en Christ et devenir un disciple authentique de Jésus.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/etudiant/connexion"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-bordeaux px-7 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-bordeaux/90 hover:shadow-xl hover:scale-105 active:scale-95 dark:bg-or dark:text-slate-900"
          >
            Commencer maintenant
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </Link>
          <a
            href="#apropos"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-bordeaux/20 px-7 py-3 text-sm font-medium text-bordeaux transition-all hover:bg-bordeaux/5 dark:border-or/30 dark:text-or"
          >
            En savoir plus
          </a>
        </div>

        {/* Marquee avatars */}
        {avatars.length > 2 && (
          <div className="mt-10 w-full max-w-sm animate-fade-in">
            <p className="mb-2 text-xs text-pierre dark:text-slate-500">Déjà inscrits :</p>
            <Marquee pauseOnHover className="py-1">
              {avatars.map((a, i) => (
                <span key={i} className="mx-1 inline-block">
                  {a.url ? (
                    <img
                      src={a.url}
                      alt=""
                      className="h-9 w-9 rounded-full border-2 border-or/40 object-cover transition-transform hover:scale-110 hover:border-or"
                    />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-or/40 bg-bordeaux/10 font-display text-xs text-bordeaux transition-transform hover:scale-110">
                      {a.name ? a.name.charAt(0).toUpperCase() : String.fromCharCode(65 + (i % 26))}
                    </span>
                  )}
                </span>
              ))}
            </Marquee>
          </div>
        )}

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-pierre/40">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="relative z-10 border-y border-pierre/10 bg-white/60 py-12 backdrop-blur-sm dark:bg-slate-800/40">
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-bold text-or">{s.value}</p>
              <p className="mt-1 text-xs text-pierre dark:text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PILLARS ─── */}
      <section id="apropos" className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-2xl font-bold text-bordeaux sm:text-3xl dark:text-slate-100">
            Pourquoi l'Académie Vases d'Honneur ?
          </h2>
          <p className="mt-3 text-sm text-pierre dark:text-slate-400">
            Pas juste des cours en ligne. Un vrai parcours de transformation.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="group rounded-2xl border border-pierre/10 bg-white/70 p-6 text-center shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:border-or/30 dark:bg-slate-800/50 dark:border-white/5"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-or/10 text-or transition-colors group-hover:bg-or group-hover:text-white">
                {p.icon}
              </div>
              <h3 className="font-display text-base font-semibold text-bordeaux dark:text-slate-100">{p.title}</h3>
              <p className="mt-2 text-sm text-pierre dark:text-slate-400">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="relative z-10 bg-bordeaux/[0.03] py-20 px-6 dark:bg-bordeaux/10">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-2xl font-bold text-bordeaux sm:text-3xl dark:text-slate-100">
            Ce qu'en disent nos étudiants
          </h2>
        </div>
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-pierre/10 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:bg-slate-800/60 dark:border-white/5"
            >
              <div className="mb-3 flex gap-1 text-or">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <p className="text-sm text-pierre italic dark:text-slate-300">« {t.text} »</p>
              <div className="mt-4">
                <p className="text-xs font-semibold text-bordeaux dark:text-slate-100">{t.name}</p>
                <p className="text-[10px] text-pierre dark:text-slate-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center font-display text-2xl font-bold text-bordeaux sm:text-3xl dark:text-slate-100">
            Questions fréquentes
          </h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((f, i) => (
              <div
                key={i}
                className="rounded-xl border border-pierre/10 bg-white/70 backdrop-blur-sm dark:bg-slate-800/50 dark:border-white/5"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-bordeaux dark:text-slate-100"
                >
                  {f.q}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`shrink-0 ml-3 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-pierre dark:text-slate-400">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CLOSING CTA ─── */}
      <section className="relative z-10 px-6 pb-20">
        <div className="mx-auto max-w-xl rounded-3xl bg-gradient-to-br from-bordeaux to-bordeaux/90 p-10 text-center shadow-xl dark:from-bordeaux dark:to-slate-900">
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Prêt à commencer ton parcours ?
          </h2>
          <p className="mt-3 text-sm text-parchemin/80">
            Rejoins l'Académie Vases d'Honneur. C'est gratuit, c'est structuré, et c'est pour toi.
          </p>
          <Link
            to="/etudiant/connexion"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-or px-8 py-3 text-sm font-bold text-bordeaux shadow-lg transition-all hover:bg-or/90 hover:shadow-xl hover:scale-105 active:scale-95"
          >
            Je m'inscris maintenant
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 border-t border-pierre/10 py-8 px-6 text-center">
        <p className="text-xs text-pierre dark:text-slate-500">
          © 2026 Académie Vases d'Honneur — Assemblée Eaux Paisibles de Yaoundé
        </p>
        <p className="mt-1 font-serif text-[11px] italic text-or/60 dark:text-or/50">
          « La Création attend avec un ardent désir la Révélation des Fils de Dieu » — Romains 8:19
        </p>
      </footer>
    </div>
  )
}
