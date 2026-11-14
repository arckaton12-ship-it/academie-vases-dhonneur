import { useState } from 'react'
import { ClassRow, Course, StudentProfile, Submission, Streak } from '@/lib/courses'
import { DevoirsGradingTab } from './DevoirsGradingTab'
import { ResumesGradingTab } from './ResumesGradingTab'
import { MeditationTab } from './MeditationTab'
import { ServiceTab } from './ServiceTab'

export function NotesTab({
  students,
  courses,
  submissions,
  streaks,
  classById,
  onRefresh,
}: {
  students: StudentProfile[]
  courses: Course[]
  submissions: Submission[]
  streaks: Streak[]
  classById: Map<string, ClassRow>
  onRefresh: () => void
}) {
  const [subTab, setSubTab] = useState<'devoirs' | 'resumes' | 'meditation' | 'service'>('devoirs')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  const subTabs: [string, string][] = [
    ['devoirs', 'Devoirs'],
    ['resumes', 'Résumés'],
    ['meditation', 'Méditation'],
    ['service', 'Service'],
  ]

  const mySubTabs = subTabs.filter(([key]) =>
    ['devoirs', 'resumes', 'meditation', 'service'].includes(key)
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {mySubTabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSubTab(key as typeof subTab)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              subTab === key
                ? 'bg-bordeaux text-parchemin'
                : 'bg-pierre/10 text-pierre hover:bg-pierre/20'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {subTab === 'devoirs' && (
        <DevoirsGradingTab students={students} submissions={submissions} classById={classById} onRefresh={onRefresh} />
      )}
      {subTab === 'resumes' && (
        <ResumesGradingTab students={students} courses={courses} classById={classById} onRefresh={onRefresh} />
      )}
      {subTab === 'meditation' && (
        <MeditationTab students={students} streaks={streaks} classById={classById} onRefresh={onRefresh} />
      )}
      {subTab === 'service' && (
        <ServiceTab students={students} classById={classById} />
      )}
    </div>
  )
}