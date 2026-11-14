import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { useStudentDashboardContext } from '@/pages/student/StudentDashboardContext'

export function ServiceTab() {
  const { service, serviceDraft, setServiceDraft, handleSaveService, serviceSaving, serviceMsg, serviceIsError } = useStudentDashboardContext()

  return (
        <div className="space-y-5">
          {/* Service Stats */}
          <Card>
            <CardTitle>Mon service</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Ta place dans le corps de l'Académie.
            </CardDescription>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-or/20 bg-or/5 p-3 text-center">
                <p className="text-2xl font-bold text-or">{service?.service_days ?? 0}</p>
                <p className="text-[10px] text-pierre dark:text-slate-500">Jours de service</p>
              </div>
              <div className="rounded-lg border border-olive/20 bg-olive/5 p-3 text-center">
                <p className="text-2xl font-bold text-olive">{service?.service_note ?? '—'}</p>
                <p className="text-[10px] text-pierre dark:text-slate-500">Note</p>
              </div>
              <div className="rounded-lg border border-bordeaux/20 bg-bordeaux/5 p-3 text-center">
                <p className="text-lg font-bold text-bordeaux dark:text-or capitalize">{service?.focus ?? '—'}</p>
                <p className="text-[10px] text-pierre dark:text-slate-500">Domaine</p>
              </div>
            </div>
          </Card>

          {/* Service Form */}
          <Card>
            <CardTitle className="text-base">Modifier ma fiche</CardTitle>
            <form onSubmit={handleSaveService} className="mt-3 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="group">Groupe</Label>
                  <Input
                    id="group"
                    value={serviceDraft.group_name}
                    onChange={(e) => setServiceDraft((prev) => ({ ...prev, group_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="days">Jours effectués</Label>
                  <Input
                    id="days"
                    type="number"
                    min={0}
                    value={serviceDraft.service_days}
                    onChange={(e) => setServiceDraft((prev) => ({ ...prev, service_days: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="focus">Domaine de service</Label>
                <select
                  id="focus"
                  value={serviceDraft.focus}
                  onChange={(e) => setServiceDraft((prev) => ({ ...prev, focus: e.target.value }))}
                  className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
                >
                  {['enseignement', 'accueil', 'louange', 'intercession', 'logistique', 'autre'].map(
                    (f) => (
                      <option key={f} value={f}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div>
                <Label htmlFor="mission">Missions & sorties</Label>
                <textarea
                  id="mission"
                  rows={3}
                  value={serviceDraft.mission_description}
                  onChange={(e) =>
                    setServiceDraft((prev) => ({ ...prev, mission_description: e.target.value }))
                  }
                  placeholder="Les missions auxquelles tu as participé cette session…"
                  className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
                />
              </div>
              <Button type="submit" disabled={serviceSaving}>
                {serviceSaving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
              {serviceMsg && <p className={`text-sm ${serviceIsError ? 'text-red-600' : 'text-olive'}`}>{serviceMsg}</p>}
            </form>
          </Card>
        </div>
  )
}
