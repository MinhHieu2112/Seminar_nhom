import { supabase } from '@/lib/supabase'

export async function getThreads(page = 1, limit = 20) {
  const offset = (page - 1) * limit

  const { data, error } = await supabase
    .from('forum_threads')
    .select('*, forum_replies(count)')
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
    .from('forum_threads')
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
    .from('forum_replies')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching replies:', error)
    return []
  }

  return data || []
}

export async function createThread(userId: string, title: string, description: string) {
  const { data, error } = await supabase
    .from('forum_threads')
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
    .from('forum_replies')
    .insert({
      user_id: userId,
      thread_id: threadId,
      content,
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
