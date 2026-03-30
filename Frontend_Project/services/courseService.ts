import { supabase } from '@/lib/supabase'

export async function getCourses(filter?: { difficulty?: string; status?: string }) {
  let query = supabase.from('courses').select('*')

  if (filter?.difficulty) {
    query = query.eq('difficulty', filter.difficulty)
  }
  if (filter?.status) {
    query = query.eq('status', filter.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching courses:', error)
    return []
  }

  return data || []
}

export async function getCourseById(id: string) {
  const { data, error } = await supabase.from('courses').select('*').eq('id', id).single()

  if (error) {
    console.error('Error fetching course:', error)
    return null
  }

  return data
}

export async function getLessonsByCourseId(courseId: string) {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order', { ascending: true })

  if (error) {
    console.error('Error fetching lessons:', error)
    return []
  }

  return data || []
}

export async function enrollCourse(courseId: string, userId: string) {
  const { error } = await supabase.from('user_courses').insert({
    user_id: userId,
    course_id: courseId,
    enrolled_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Error enrolling course:', error)
    throw error
  }
}

export async function updateLessonProgress(userId: string, lessonId: string) {
  const { error } = await supabase.from('lesson_progress').upsert({
    user_id: userId,
    lesson_id: lessonId,
    completed: true,
    completed_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Error updating lesson progress:', error)
    throw error
  }
}
