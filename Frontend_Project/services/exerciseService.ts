import { supabase } from '@/lib/supabase'

export async function getExercises(filter?: { difficulty?: string; language?: string }) {
  let query = supabase.from('exercises').select('*')

  if (filter?.difficulty) {
    query = query.eq('difficulty', filter.difficulty)
  }
  if (filter?.language) {
    query = query.eq('language', filter.language)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching exercises:', error)
    return []
  }

  return data || []
}

export async function getExerciseById(id: string) {
  const { data, error } = await supabase.from('exercises').select('*').eq('id', id).single()

  if (error) {
    console.error('Error fetching exercise:', error)
    return null
  }

  return data
}

export async function getTestCases(exerciseId: string) {
  const { data, error } = await supabase
    .from('test_cases')
    .select('*')
    .eq('exercise_id', exerciseId)
    .eq('is_hidden', false)

  if (error) {
    console.error('Error fetching test cases:', error)
    return []
  }

  return data || []
}

export async function submitCode(userId: string, exerciseId: string, code: string, language: string) {
  const { data, error } = await supabase.from('submissions').insert({
    user_id: userId,
    exercise_id: exerciseId,
    code,
    language,
    status: 'pending',
    submitted_at: new Date().toISOString(),
  }).select().single()

  if (error) {
    console.error('Error submitting code:', error)
    throw error
  }

  return data
}

export async function getSubmissionStatus(submissionId: string) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', submissionId)
    .single()

  if (error) {
    console.error('Error fetching submission:', error)
    return null
  }

  return data
}
