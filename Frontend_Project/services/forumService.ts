import { supabase } from '@/lib/supabase'

export async function getThreads(page = 1, limit = 20) {
  const offset = (page - 1) * limit

  const { data, error } = await supabase
    .from('forum_questions')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching threads:', error)
    return []
  }

  return data || []
}

export async function getThreadById(id: string) {
  const { data, error } = await supabase
    .from('forum_questions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching thread:', error)
    return null
  }

  return data
}

export async function getReplies(threadId: string) {
  const { data, error } = await supabase
    .from('forum_answers')
    .select('*')
    .eq('question_id', threadId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching replies:', error)
    return []
  }

  return data || []
}

export async function createThread(userId: string, title: string, description: string) {
  const { data, error } = await supabase
    .from('forum_questions')
    .insert({
      user_id: userId,
      title,
      description,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating thread:', error)
    throw error
  }

  return data
}

export async function createReply(userId: string, threadId: string, content: string) {
  const { data, error } = await supabase
    .from('forum_answers')
    .insert({
      user_id: userId,
      question_id: threadId,
      answer_text: content,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating reply:', error)
    throw error
  }

  return data
}
