export interface ClassRow {
  id: string
  name: string
  level: number
  start_date: string | null
  created_at: string | null
}

export interface Course {
  id: string
  class_id: string | null
  title: string
  week: number
  session_date: string | null
  audio_url: string | null
  video_url: string | null
  audio_parts: AudioPart[] | null
  description: string | null
  created_at: string | null
  class?: Pick<ClassRow, 'name' | 'level'> | null
}

export interface AudioPart {
  nom: string
  audio: string | null
  video?: string | null
}

export interface StudentProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  tribe: string | null
  department: string | null
  role: string
  class_id: string | null
  active: boolean
  meditation_grade: number | null
  active_badge: string | null
  binome_id: string | null
  class?: Pick<ClassRow, 'name' | 'level'> | null
  created_at: string | null
}

export interface Submission {
  id: string
  assignment_id: string | null
  student_id: string
  content: string | null
  file_url: string | null
  submitted_at: string | null
  grade: number | null
  feedback: string | null
  type: string
  attachments: string[] | null
  course_id: string | null
  assignment?: { description: string; type: string; course_id?: string | null } | null
  course?: Pick<Course, 'title' | 'week' | 'session_date'> | null
  student?: {
    first_name: string
    last_name: string
    class_id: string | null
  } | null
}

export interface Streak {
  id: string
  student_id: string
  week_start: string
  consecutive_weeks: number
}

export interface Assignment {
  id: string
  course_id: string
  description: string
  due_date: string | null
  type: string
  created_at: string | null
}

export interface Resume {
  id: string
  student_id: string
  course_id: string
  content: string
  file_url: string | null
  file_name: string | null
  grade: number | null
  feedback: string | null
  updated_at: string | null
}

export interface ResumeReview {
  resume: Resume
  course: Course
}

export interface ClosingReflection {
  id: string
  student_id: string
  course_id: string
  content: string
  invited_at: string | null
  answered_at: string | null
  updated_at: string | null
}

export interface BadgeProgress {
  badge_type: string
  earned: boolean
  earned_at: string | null
  current: number
  target: number
}

export interface Attendance {
  id: string
  student_id: string
  course_id: string
  attended_at: string | null
}

export interface MySubmission extends Submission {
  assignment?: { description: string; type: string; course_id: string } | null
  course_title?: string | null
}

export interface ResumeForGrading extends Resume {
  student?: { first_name: string; last_name: string; class_id: string | null } | null
  course?: Pick<Course, 'title' | 'week'> | null
}

export interface WebhookConfig {
  id: boolean
  url: string | null
  active: boolean
}

export interface StudentProgress {
  totalCourses: number
  attendedCourses: number
  presenceRate: number
  resumesCount: number
  resumeRate: number
  averageGrade: string | null
  meditationGrade: number | null
}

export interface ServiceRecord {
  id: string
  student_id: string
  group_name: string | null
  service_days: number | null
  service_note: number | null
  mission_description: string | null
  focus: string | null
  updated_at: string | null
}

export interface BadgeRow {
  id: string
  student_id: string
  badge_type: string
  earned_at: string | null
}

export interface Certificate {
  id: string
  student_id: string
  cycle: number
  issued_at: string | null
  number: string | null
}

export interface MiniTaskResponseRow {
  id: string
  student_id: string
  mini_task_id: string
  response: string
  submitted_at: string | null
}

export interface ModeratorProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  tribe: string | null
  department: string | null
  avatar_url: string | null
  class_id: string | null
  active: boolean
  class?: Pick<ClassRow, 'name' | 'level'> | null
}

export interface ModeratorSchedule {
  id: string
  moderator_id: string
  day_of_week: number
  start_time: string
  end_time: string
  notes: string | null
  specific_date: string | null
  created_at: string
}

export interface MiniTask {
  id: string
  course_id: string
  instruction: string
  created_at: string | null
}

export interface MiniTaskResponse {
  id: string
  student_id: string
  mini_task_id: string
  response: string
  submitted_at: string | null
}

export interface MiniTaskResponseWithStudent extends MiniTaskResponse {
  student?: { first_name: string; last_name: string } | null
}

export interface ModerationSupport {
  id: string
  course_id: string
  moderator_id: string
  content: string | null
  file_url: string | null
  updated_at: string | null
}

export interface ModerationReport {
  id: string
  moderator_id: string
  course_id: string | null
  session_date: string | null
  content: string
  created_at: string | null
  course?: Pick<Course, 'title' | 'week'> | null
}

export interface Announcement {
  id: string
  moderator_id: string
  class_id: string
  title: string
  content: string
  created_at: string
  moderator?: { first_name: string; last_name: string } | null
  class?: Pick<ClassRow, 'name'> | null
}

export interface Quiz {
  id: string
  course_id: string
  title: string
  description: string
  time_limit_minutes: number | null
  passing_score: number
  question_count?: number
  attempt_count?: number
  avg_score?: number | null
}

export interface QuizQuestion {
  id: string
  question_text: string
  options: string[]
  points: number
  order_index: number
}

export interface QuizAttempt {
  score: number
  total_points: number
  max_points: number
  is_passed: boolean
  passing_score: number
  questions: {
    question_id: string
    question_text: string
    options: string[]
    correct_index: number
    your_answer: number | null
    is_correct: boolean
    points: number
  }[]
}

export interface MeditationVerse {
  id: string
  verse_text: string
  verse_reference: string
  active: boolean
  day_of_week: number | null
  created_at: string
}

export interface WeeklyBilan {
  id: string
  student_id: string
  week_number: number
  resume_done: boolean
  meditation_status: 'all_days' | 'some_days' | 'none'
  meditation_days: number
  evangelisation_status: 'soul_won' | 'evangelized_no_soul' | 'none'
  contact_name: string | null
  contact_phone: string | null
  bilan_day?: number | null
  sent_to_sheets?: boolean | null
  created_at: string | null
}

export interface BilanPreferences {
  id: string
  student_id: string
  bilan_days: number[]
  created_at: string | null
  updated_at: string | null
}

export interface SoulTracking {
  id: string
  student_id: string
  moderator_id: string
  attendance_notes: string | null
  attendance_rating: number | null
  meditation_observations: string | null
  social_context: string | null
  created_at: string
  updated_at: string
}

export interface SoulEntry {
  id: string
  tracking_id: string
  moderator_id: string
  category: 'assiduite' | 'meditation' | 'social' | 'general'
  content: string
  created_at: string
}

export interface PaginatedResult<T> {
  data: T[]
  totalCount: number
}
