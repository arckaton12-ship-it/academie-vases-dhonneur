import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import { getLandingAvatars } from '@/lib/courses'
import { getSafeSession } from '@/lib/auth'
import { Marquee } from '@/components/ui/Marquee'
import { supabase } from '@/lib/supabase'

const STATS = [
  { value: '3', label: 'Niveaux de formation' },
  { value: '28', label: 'Cours dispensés' },
  { value: '18', label: 'Badges à débloquer' },
  { value: '0 F', label: "Frais d'inscription" },
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

const PARCOURS = [
  {
    step: 'Classe 1',
    title: 'Connaître Christ',
    text: 'Les fondements de la foi : la vision, le salut, la nouvelle création, la sanctification et la marche avec le Saint-Esprit.',
  },
  {
    step: 'Classe 2',
    title: 'Croître avec Jésus',
    text: 'Le disciple s’enracine : vie de prière, service, vigilance face aux fausses doctrines, croissance et fidélité.',
  },
  {
    step: 'Classe 3',
    title: 'Consécration & Service',
    text: 'Le disciple affermi se consacre et prend sa place dans le service, accompagné par son modérateur jusqu’au bout du parcours.',
  },
]

const FAQ = [
  {
    q: 'L\'académie est-elle vraiment gratuite ?',
    a: 'L\'inscription et la formation sont gratuites : aucun frais de scolarité n\'est demandé. Une contribution unique de 10 000 F couvre le kit de bienvenue (t-shirt de l\'Académie, cahier de méditation et agapé). L\'Académie est l\'école de formation des disciples de l\'église Vases d\'Honneur, portée par l\'Assemblée Eaux Paisibles de Yaoundé.',
  },
  {
    q: 'Comment ça marche concrètement ?',
    a: 'Tu t\'inscris, puis l\'administration t\'attribue à une classe avec un modérateur. Chaque semaine, tu suis un cours, tu soumets un résumé et tu reçois un retour personnalisé.',
  },
  {
    q: 'Je peux rejoindre à tout moment ?',
    a: 'Les inscriptions sont ouvertes trois fois dans l\'année. Renseigne-toi sur la prochaine session : tu commences au niveau 1, puis tu progresses selon ton rythme et les recommandations de l\'administration de l\'École.',
  },
  {
    q: 'Quel est le niveau requis ?',
    a: 'Aucun prérequis. Il suffit d\'un cœur désireux d\'apprendre et de grandir spirituellement. Les cours sont accessibles à tous.',
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const [avatars, setAvatars] = useState<{ url: string | null; name: string }[]>([])
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [videoOpen, setVideoOpen] = useState(false)

  useEffect(() => {
    getLandingAvatars().then(setAvatars).catch(() => undefined)
  }, [])

  // Redirect to dashboard if already logged in
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const session = getSafeSession()
        if (cancelled || !session) return
        // Check role from JWT user metadata (no DB query needed)
        const userMeta = session.user.user_metadata || {}
        const rawRole = userMeta.role as string | undefined
        if (cancelled) return
        if (rawRole === 'ADMINISTRATEUR') navigate('/admin/tableau-de-bord', { replace: true })
        else if (rawRole === 'ADMIN_CLASSE') navigate('/admin-classe/tableau-de-bord', { replace: true })
        else if (rawRole === 'MODERATEUR') navigate('/moderateur/tableau-de-bord', { replace: true })
        else if (rawRole === 'ETUDIANT') navigate('/etudiant/tableau-de-bord', { replace: true })
        else {
          // Role not in JWT metadata — try DB lookup
          const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
          if (cancelled || !data) return
          const role = data.role as string
          if (role === 'ADMINISTRATEUR') navigate('/admin/tableau-de-bord', { replace: true })
          else if (role === 'ADMIN_CLASSE') navigate('/admin-classe/tableau-de-bord', { replace: true })
          else if (role === 'MODERATEUR') navigate('/moderateur/tableau-de-bord', { replace: true })
          else navigate('/etudiant/tableau-de-bord', { replace: true })
        }
      } catch {
        // not logged in — stay on landing
      }
    })()
    return () => { cancelled = true }
  }, [navigate])

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

      {/* Déjà inscrit */}
      <div className="absolute left-4 top-4 z-20">
        <Link
          to="/etudiant/connexion"
          className="text-xs font-medium text-bordeaux underline-offset-4 hover:underline dark:text-or sm:text-sm"
        >
          Déjà inscrit ? Se connecter
        </Link>
      </div>

      {/* ─── HERO ─── */}
      <section className="relative z-10 flex min-h-[90vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 animate-scale-in">
                <Logo showText={false} size={80} />
        </div>

        <h1 className="font-display text-3xl font-bold text-bordeaux drop-shadow-sm sm:text-5xl lg:text-6xl dark:text-slate-100">
          Formes-toi.<br />
          <span className="text-or">Grandis.</span><br />
          Sers le Maître.
        </h1>

        <p className="mt-5 max-w-lg text-base text-pierre sm:text-lg dark:text-slate-400">
          L'académie biblique en ligne de l'Assemblée Eaux Paisibles de Yaoundé, au sein de l'Église Vases d'Honneur. Un parcours structuré pour poser des fondements solides en Christ et devenir un disciple authentique de Jésus.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/etudiant/inscription"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-bordeaux px-7 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-bordeaux/90 hover:shadow-xl hover:scale-105 active:scale-95 dark:bg-or dark:text-slate-900"
          >
            Commencer maintenant
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </Link>
          <a
            href="#apropos"
            className="glass-pill inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-medium text-bordeaux transition-all hover:scale-[1.02] dark:text-or"
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
      <section className="glass-band relative z-10 py-12">
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-6 px-6 sm:grid-cols-4">
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
            <div key={p.title} className="glass-card group p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-or/10 text-or transition-colors group-hover:bg-or group-hover:text-encre">
                {p.icon}
              </div>
              <h3 className="font-display text-base font-semibold text-bordeaux dark:text-slate-100">{p.title}</h3>
              <p className="mt-2 text-sm text-pierre dark:text-slate-400">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PREVIEW VIDEO ─── */}
      <section className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-2xl font-bold text-bordeaux sm:text-3xl dark:text-slate-100">
            Découvre un aperçu
          </h2>
          <p className="mt-3 text-sm text-pierre dark:text-slate-400">
            Regarde un extrait de nos cours pour découvrir l'Académie.
          </p>
          <div className="glass-panel mx-auto mt-8 w-full overflow-hidden p-2">
            <div className="relative overflow-hidden rounded-[1.15rem] bg-gradient-to-br from-bordeaux to-bordeaux/80" style={{ paddingBottom: '56.25%' }}>
              {videoOpen ? (
                <iframe
                  src="https://www.youtube.com/embed/plSLMiajkTg?autoplay=1"
                  title="Aperçu — La Vision Vases d'Honneur"
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setVideoOpen(true)}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-parchemin transition-colors hover:bg-black/10"
                  aria-label="Lancer l'aperçu vidéo"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-or text-encre shadow-lg transition-transform hover:scale-105">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium">Lancer l'aperçu</span>
                  <span className="text-[11px] text-parchemin/70">La vidéo ne se charge qu'au clic.</span>
                </button>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-pierre dark:text-slate-500">La Vision Vases d'Honneur — Semaine 2</p>
        </div>
      </section>

      {/* ─── PARCOURS ─── */}
      <section className="relative z-10 bg-bordeaux/[0.03] py-20 px-6 dark:bg-bordeaux/10">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-2xl font-bold text-bordeaux sm:text-3xl dark:text-slate-100">
            Ton parcours, en trois classes
          </h2>
          <p className="mt-3 text-sm text-pierre dark:text-slate-400">
            28 cours, un rythme hebdomadaire, un modérateur qui t'accompagne à chaque étape.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
          {PARCOURS.map((p, i) => (
            <div key={p.step} className="glass-card p-6">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-or/15 font-display text-sm font-bold text-or-texte dark:text-or">
                {i + 1}
              </span>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-pierre dark:text-slate-500">
                {p.step}
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold text-bordeaux dark:text-slate-100">
                {p.title}
              </h3>
              <p className="mt-2 text-sm text-pierre dark:text-slate-400">{p.text}</p>
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
                className="glass-panel overflow-hidden"
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
            Rejoins l'Académie Vases d'Honneur. L'inscription est gratuite ; seule une contribution
            de 10 000 F couvre ton kit de bienvenue.
          </p>
          <Link
            to="/etudiant/inscription"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-or px-8 py-3 text-sm font-bold text-encre shadow-lg transition-all hover:bg-or/90 hover:shadow-xl hover:scale-105 active:scale-95"
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
        <nav aria-label="Liens du pied de page" className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium text-bordeaux dark:text-or">
          <Link to="/contact" className="underline-offset-4 hover:underline">Contact</Link>
          <Link to="/mentions-legales" className="underline-offset-4 hover:underline">Mentions légales</Link>
          <Link to="/etudiant/inscription" className="underline-offset-4 hover:underline">Inscription</Link>
          <Link to="/etudiant/connexion" className="underline-offset-4 hover:underline">Connexion</Link>
        </nav>
        <p className="mt-3 font-serif text-[11px] italic text-or/60 dark:text-or/50">
          « La Création attend avec un ardent désir la Révélation des Fils de Dieu » — Romains 8:19
        </p>
      </footer>
    </div>
  )
}
