import { useMemo } from 'react'
import { Course } from '@/lib/courses'
import { MascotCompanion, MascotMood } from './MascotCompanion'

interface CoursePathProps {
  courses: Course[]
  currentWeek: number
  completedCourseIds: Set<string>
  onSelectCourse: (course: Course) => void
  mascotMood?: MascotMood
}

interface PathNode {
  course: Course
  status: 'locked' | 'available' | 'completed'
  week: number
}

function getStatus(course: Course, currentWeek: number, completedIds: Set<string>): 'locked' | 'available' | 'completed' {
  if (completedIds.has(course.id)) return 'completed'
  if (course.week <= currentWeek) return 'available'
  return 'locked'
}

export function CoursePath({ courses, currentWeek, completedCourseIds, onSelectCourse, mascotMood = 'happy' }: CoursePathProps) {
  const nodes = useMemo(() => {
    return courses
      .sort((a, b) => a.week - b.week)
      .map((course) => ({
        course,
        status: getStatus(course, currentWeek, completedCourseIds),
        week: course.week,
      }))
  }, [courses, currentWeek, completedCourseIds])

  const currentIdx = nodes.findIndex((n) => n.status === 'available' || n.status === 'completed')
  const mascotIdx = currentIdx >= 0 ? currentIdx : 0

  return (
    <div className="relative flex flex-col items-center py-4">
      {/* SVG path connector */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path
          d={`M50,5 ${nodes.map((_, i) => {
            const x = i % 2 === 0 ? 35 : 65
            const y = 5 + (i * 90) / Math.max(nodes.length - 1, 1)
            return `Q${i % 2 === 0 ? 20 : 80},${y - 45 / Math.max(nodes.length - 1, 1)} ${x},${y}`
          }).join(' ')}`}
          fill="none"
          stroke="#D4A01730"
          strokeWidth="2"
          className="path-connector"
        />
      </svg>

      {/* Nodes */}
      {nodes.map((node, i) => {
        const isLeft = i % 2 === 0
        const showMascot = i === mascotIdx

        return (
          <div
            key={node.course.id}
            className={`path-node relative flex items-center gap-3 ${
              isLeft ? 'flex-row' : 'flex-row-reverse'
            } mb-6 w-full max-w-xs`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {/* Course info */}
            <div className={`flex-1 ${isLeft ? 'text-right' : 'text-left'}`}>
              <p className={`text-xs font-medium ${
                node.status === 'locked' ? 'text-pierre/40' : 'text-bordeaux'
              }`}>
                Semaine {node.week}
              </p>
              <p className={`text-sm font-semibold leading-tight ${
                node.status === 'locked' ? 'text-pierre/30' :
                node.status === 'completed' ? 'text-olive' : 'text-bordeaux'
              }`}>
                {node.course.title}
              </p>
            </div>

            {/* Node circle */}
            <button
              onClick={() => onSelectCourse(node.course)}
              disabled={node.status === 'locked'}
              className={`path-node relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold transition-all ${
                node.status === 'locked'
                  ? 'path-node-locked border-pierre/20 bg-gray-100 text-pierre/30 cursor-not-allowed'
                  : node.status === 'completed'
                  ? 'border-olive bg-olive text-white shadow-md'
                  : 'path-node-available border-teal bg-teal text-white shadow-lg hover:scale-105 cursor-pointer'
              }`}
            >
              {node.status === 'completed' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : node.status === 'locked' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              ) : (
                <span>{node.week}</span>
              )}

              {/* Pulse for available */}
              {node.status === 'available' && (
                <span className="absolute inset-0 animate-ping rounded-full border-2 border-teal opacity-30" />
              )}
            </button>

            {/* Mascot on current position */}
            {showMascot && (
              <div className={`absolute ${isLeft ? '-right-16' : '-left-16'} top-0 z-20`}>
                <MascotCompanion mood={mascotMood} size={40} message={undefined} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
