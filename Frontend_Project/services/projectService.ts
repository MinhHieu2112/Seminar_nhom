import { supabase } from '@/lib/supabase'

export async function getProjects() {
  const { data, error } = await supabase.from('projects').select('*')

  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }

  return data || []
}

export async function getProjectById(id: string) {
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).single()

  if (error) {
    console.error('Error fetching project:', error)
    return null
  }

  return data
}

export async function getProjectStages(projectId: string) {
  const { data, error } = await supabase
    .from('project_stages')
    .select('*')
    .eq('project_id', projectId)
    .order('order', { ascending: true })

  if (error) {
    console.error('Error fetching stages:', error)
    return []
  }

  return data || []
}

export async function submitProjectStage(userId: string, stageId: string, code: string) {
  const { data, error } = await supabase
    .from('project_submissions')
    .insert({
      user_id: userId,
      stage_id: stageId,
      code,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error submitting stage:', error)
    throw error
  }

  return data
}
