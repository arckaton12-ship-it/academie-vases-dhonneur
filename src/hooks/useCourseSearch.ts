import { useState, useMemo } from 'react'
import { Course } from '@/lib/courses'

export function useCourseSearch(courses: Course[]) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return courses
    const q = query.toLowerCase().trim()
    return courses.filter((c) => {
      const searchable = `${c.title} ${c.description ?? ''} ${c.class?.name ?? ''} ${c.class?.level ?? ''}`.toLowerCase()
      return searchable.includes(q)
    }).sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(q) ? 0 : 1
      const bTitle = b.title.toLowerCase().includes(q) ? 0 : 1
      return aTitle - bTitle
    })
  }, [courses, query])

  const highlighted = useMemo(() => {
    if (!query.trim()) return results
    const q = query.toLowerCase().trim()
    return results.map((c) => ({
      ...c,
      _highlighted: c.title.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark class="bg-or/30 rounded px-0.5">$1</mark>'),
    }))
  }, [results, query])

  return { query, setQuery, results: highlighted }
}
