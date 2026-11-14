import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'
import { DAY_NAMES } from '@/pages/admin/useAdminDashboardState'
import { useAdminDashboardContext } from '@/pages/admin/AdminDashboardContext'

export function ModerateursSection() {
  const {
    promoteStudentId,
    setPromoteStudentId,
    students,
    promoteStudent,
    graduationStudentId,
    setGraduationStudentId,
    promoteToGraduation,
    graduationMsg,
    handleCreateAccount,
    newAccount,
    setNewAccount,
    showModPwd,
    setShowModPwd,
    accountMsg,
    createdPassword,
    accountSaving,
    moderators,
    moderatorClasses,
    moderatorSchedules,
    slotDrafts,
    setSlotDrafts,
    toggleAccess,
    demoteModerator,
    classes,
    toggleModeratorClass,
    removeSlot,
    addSlot,
    slotSavingId,
    moderatorMsg,
  } = useAdminDashboardContext()

  return (
        <div className="space-y-4">
          <Card>
            <CardTitle>Promouvoir un étudiant</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Transforme un compte étudiant en modérateur, puis attribue-lui ses classes ci-dessous.
            </CardDescription>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-56 flex-1">
                <Label htmlFor="promote-student">Étudiant</Label>
                <select
                  id="promote-student"
                  value={promoteStudentId}
                  onChange={(e) => setPromoteStudentId(e.target.value)}
                  className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
                >
                  <option value="">Sélectionner un étudiant…</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.last_name} {s.first_name} — {s.email} ({s.class?.name ?? 'sans classe'})
                    </option>
                  ))}
                </select>
              </div>
              <Button variant="primary" onClick={promoteStudent} disabled={!promoteStudentId}>
                Promouvoir
              </Button>
            </div>
          </Card>

          <Card>
            <CardTitle>Promouvoir en Graduation</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Transfère un étudiant de Classe 3 vers la classe Graduation (promotion finale).
            </CardDescription>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-56 flex-1">
                <Label htmlFor="graduation-student">Étudiant (Classe 3)</Label>
                <select
                  id="graduation-student"
                  value={graduationStudentId}
                  onChange={(e) => setGraduationStudentId(e.target.value)}
                  className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
                >
                  <option value="">Sélectionner un étudiant…</option>
                  {students.filter(s => s.class?.level === 3).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.last_name} {s.first_name} — {s.email}
                    </option>
                  ))}
                </select>
              </div>
              <Button variant="primary" onClick={promoteToGraduation} disabled={!graduationStudentId}>
                Promouvoir en Graduation
              </Button>
            </div>
            {graduationMsg && <p className="mt-2 text-sm text-olive">{graduationMsg}</p>}
          </Card>

          <Card>
            <CardDescription className="mt-1 mb-4">
              Crée directement un compte modérateur ou étudiant. La personne pourra se
              connecter aussitôt.
            </CardDescription>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="acc-first">Prénom</Label>
                  <Input
                    id="acc-first"
                    required
                    value={newAccount.firstName}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="acc-last">Nom</Label>
                  <Input
                    id="acc-last"
                    required
                    value={newAccount.lastName}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="acc-email">Email</Label>
                  <Input
                    id="acc-email"
                    type="email"
                    required
                    value={newAccount.email}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="acc-password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="acc-password"
                      type={showModPwd ? 'text' : 'password'}
                      value={newAccount.password}
                      onChange={(e) => setNewAccount((prev) => ({ ...prev, password: e.target.value }))}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModPwd(v => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-pierre hover:text-bordeaux"
                    >
                      {showModPwd ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="acc-role">Rôle</Label>
                  <select
                    id="acc-role"
                    value={newAccount.role}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
                  >
                    <option value="MODERATEUR">Modérateur</option>
                    <option value="ADMINISTRATEUR">Administrateur</option>
                    <option value="ADMIN_CLASSE">Admin de Classe</option>
                    <option value="ETUDIANT">Étudiant</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="acc-phone">Téléphone</Label>
                  <Input
                    id="acc-phone"
                    value={newAccount.phone}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="acc-tribe">Tribu</Label>
                  <select
                    id="acc-tribe"
                    value={newAccount.tribe}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, tribe: e.target.value }))}
                    className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
                  >
                    <option value="">—</option>
                    {['Ruben', 'Siméon', 'Lévi', 'Juda', 'Zabulon', 'Issacar', 'Dan', 'Gad', 'Aser', 'Nephtali', 'Joseph', 'Benjamin', 'Aucune'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="acc-dept">Département</Label>
                <select
                  id="acc-dept"
                  value={newAccount.department}
                  onChange={(e) => setNewAccount((prev) => ({ ...prev, department: e.target.value }))}
                  className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
                >
                  <option value="">—</option>
                  {['ACCUEIL', 'ADMINISTRATION', 'ADN', "ACADÉMIE D'HONNEUR", 'BAPTÊME', 'BLOOM', 'CHANTRES', 'COMMUNICATION', 'COMPTABILITÉ', 'DÉCORATION', 'DIGITAL', "ENFANT D'HONNEUR", 'ELEEO', 'GDC', 'INTERCESSION', 'LOGE PASTORALE', 'LEAMANS', "MÉDECINE D'HONNEUR", 'MOYENS GÉNÉRAUX', 'MRES', "PLUME D'HONNEUR", 'PROTOCOLE', "COEUR D'HONNEUR", 'SAINTE CÈNE', 'EVANGÉLISATION', 'AUCUN'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              {accountMsg && (
                <p
                  className={`text-sm ${accountMsg.startsWith('Compte') || accountMsg.startsWith('Demande') ? 'text-olive' : 'text-red-700'}`}
                >
                  {accountMsg}
                </p>
              )}
              {createdPassword && (
                <div className="rounded-lg border border-or/40 bg-or/5 p-3">
                  <p className="text-xs text-pierre">Mot de passe temporaire à transmettre au modérateur :</p>
                  <p className="mt-1 font-mono text-sm font-bold text-bordeaux break-all">{createdPassword}</p>
                  <p className="mt-1 text-[11px] text-pierre/60">Ce mot de passe ne sera plus affiché. Le modérateur devra le changer à sa première connexion.</p>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(createdPassword); toast('Copié !') }}
                    className="mt-2 rounded-md bg-bordeaux px-3 py-1 text-xs text-parchemin hover:bg-[#4a2234]"
                  >
                    Copier le mot de passe
                  </button>
                </div>
              )}
              <Button type="submit" disabled={accountSaving}>
                {accountSaving ? 'Création…' : 'Créer le compte'}
              </Button>
            </form>
          </Card>

          <Card>
            <CardTitle>Modérateurs de l'Académie</CardTitle>
            <CardDescription className="mt-1 mb-4">
              Classes rattachées et planning de modération de chaque modérateur.
            </CardDescription>

            {moderators.length === 0 ? (
              <p className="text-sm text-pierre">Aucun modérateur enregistré.</p>
            ) : (
              <ul className="space-y-5">
                {moderators.map((m) => {
                  const selectedClasses = moderatorClasses[m.id] ?? []
                  const slots = moderatorSchedules[m.id] ?? []
                  const draft = slotDrafts[m.id] ?? { day: '0', start: '09:00', end: '11:00', notes: '', date: '' }
                  return (
                    <li key={m.id} className="rounded-card border border-pierre/15 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-bordeaux">
                            {m.last_name} {m.first_name}
                          </p>
                          <p className="text-xs text-pierre">
                            {m.email} · {m.active ? 'accès actif' : 'accès révoqué'}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant={m.active ? 'ghost' : 'primary'}
                            className="!px-3 !py-1 text-xs"
                            onClick={() => toggleAccess(m.id, m.active)}
                          >
                            {m.active ? 'Révoquer l\u2019accès' : 'Restaurer l\u2019accès'}
                          </Button>
                          <Button
                            variant="outline"
                            className="!px-3 !py-1 text-xs text-red-700"
                            onClick={() => demoteModerator(m.id)}
                          >
                            Repasser en étudiant
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 border-t border-sable/60 pt-3">
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-bordeaux">
                          Classes rattachées
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {classes.map((c) => {
                            const checked = selectedClasses.includes(c.id)
                            return (
                              <button
                                key={c.id}
                                onClick={() => toggleModeratorClass(m.id, c.id)}
                                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                  checked
                                    ? 'bg-bordeaux text-parchemin'
                                    : 'border border-bordeaux/30 text-bordeaux hover:bg-bordeaux/5'
                                }`}
                              >
                                {c.name}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="mt-3 border-t border-sable/60 pt-3">
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-bordeaux">
                          Planning de modération
                        </p>
                        {slots.length === 0 ? (
                          <p className="text-sm text-pierre">Aucun créneau défini.</p>
                        ) : (
                          <ul className="mb-3 space-y-1 text-sm">
                            {slots.map((slot) => (
                              <li
                                key={slot.id}
                                className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-1.5 ${
                                  slot.day_of_week === 0 ? 'border-or/60 bg-or/10' : 'border-pierre/15'
                                }`}
                              >
                                <span className="text-bordeaux">
                                  {slot.specific_date
                                    ? new Date(slot.specific_date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
                                    : DAY_NAMES[slot.day_of_week] ?? slot.day_of_week}
                                  {slot.day_of_week === 0 && !slot.specific_date && (
                                    <span className="ml-2 rounded-full bg-or/25 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide">
                                      Jour du Seigneur
                                    </span>
                                  )}{' '}
                                  ·{' '}
                                  <span className="font-mono text-xs">
                                    {slot.start_time?.slice(0, 5)}–{slot.end_time?.slice(0, 5)}
                                  </span>
                                  {slot.notes ? <span className="ml-2 text-pierre">— {slot.notes}</span> : null}
                                </span>
                                <button
                                  onClick={() => removeSlot(m.id, slot.id)}
                                  className="text-xs text-red-700 underline"
                                >
                                  Retirer
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="grid gap-2 sm:grid-cols-[120px_130px_100px_100px_1fr_auto]">
                          <select
                            value={draft.day}
                            onChange={(e) =>
                              setSlotDrafts((prev) => ({
                                ...prev,
                                [m.id]: { ...draft, day: e.target.value },
                              }))
                            }
                            className="rounded-md border border-pierre/30 bg-white px-2 py-1.5 text-sm text-bordeaux focus-visible:border-or"
                          >
                            {DAY_NAMES.map((name, i) => (
                              <option key={i} value={i}>
                                {name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="date"
                            value={draft.date}
                            placeholder="Date précise (optionnel)"
                            onChange={(e) =>
                              setSlotDrafts((prev) => ({
                                ...prev,
                                [m.id]: { ...draft, date: e.target.value },
                              }))
                            }
                            className="rounded-md border border-pierre/30 bg-white px-2 py-1.5 text-sm text-bordeaux focus-visible:border-or"
                          />
                          <input
                            type="time"
                            value={draft.start}
                            onChange={(e) =>
                              setSlotDrafts((prev) => ({
                                ...prev,
                                [m.id]: { ...draft, start: e.target.value },
                              }))
                            }
                            className="rounded-md border border-pierre/30 bg-white px-2 py-1.5 text-sm text-bordeaux focus-visible:border-or"
                          />
                          <input
                            type="time"
                            value={draft.end}
                            onChange={(e) =>
                              setSlotDrafts((prev) => ({
                                ...prev,
                                [m.id]: { ...draft, end: e.target.value },
                              }))
                            }
                            className="rounded-md border border-pierre/30 bg-white px-2 py-1.5 text-sm text-bordeaux focus-visible:border-or"
                          />
                          <input
                            value={draft.notes}
                            placeholder="Notes (optionnel)"
                            onChange={(e) =>
                              setSlotDrafts((prev) => ({
                                ...prev,
                                [m.id]: { ...draft, notes: e.target.value },
                              }))
                            }
                            className="rounded-md border border-pierre/30 bg-white px-2 py-1.5 text-sm text-bordeaux focus-visible:border-or"
                          />
                          <Button
                            variant="outline"
                            className="!px-3 !py-1.5 text-xs"
                            disabled={slotSavingId === m.id}
                            onClick={() => addSlot(m.id)}
                          >
                            {slotSavingId === m.id ? '…' : 'Ajouter'}
                          </Button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            {moderatorMsg && <p className="mt-3 text-sm text-olive">{moderatorMsg}</p>}
          </Card>
        </div>
  )
}
