/**
 * Example Supabase database operations
 * These examples show how to use Supabase for reads/writes
 * You can use these patterns in your API routes or client components
 */

import { createSupabaseClient, createServerSupabaseClient } from './supabase';

// ============================================
// CLIENT-SIDE EXAMPLES (use in client components)
// ============================================

/**
 * Example: Fetch user's catches
 */
export async function getUserCatches(userId: string) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('catch')
    .select(`
      *,
      user:userId (
        id,
        firstName,
        username,
        photoUrl
      )
    `)
    .eq('userId', userId)
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('Error fetching catches:', error);
    throw error;
  }

  return data;
}

/**
 * Example: Create a new catch
 */
export async function createCatch(catchData: {
  userId: string;
  description?: string;
  imageUrl?: string;
  species?: string;
  weight?: number;
  length?: number;
  latitude?: number;
  longitude?: number;
}) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('catch')
    .insert({
      ...catchData,
      createdAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating catch:', error);
    throw error;
  }

  return data;
}

/**
 * Example: Like a catch
 */
export async function likeCatch(userId: string, catchId: string) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('like')
    .insert({
      userId,
      catchId,
      createdAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    // Check if it's a duplicate (already liked)
    if (error.code === '23505') {
      // Unique constraint violation - already liked
      return { alreadyLiked: true };
    }
    console.error('Error liking catch:', error);
    throw error;
  }

  return data;
}

/**
 * Example: Unlike a catch
 */
export async function unlikeCatch(userId: string, catchId: string) {
  const supabase = createSupabaseClient();
  
  const { error } = await supabase
    .from('like')
    .delete()
    .eq('userId', userId)
    .eq('catchId', catchId);

  if (error) {
    console.error('Error unliking catch:', error);
    throw error;
  }

  return { success: true };
}

/**
 * Example: Add a comment
 */
export async function addComment(catchId: string, userId: string, content: string) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('comment')
    .insert({
      catchId,
      userId,
      content,
      createdAt: new Date().toISOString(),
    })
    .select(`
      *,
      user:userId (
        id,
        firstName,
        username,
        photoUrl
      )
    `)
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    throw error;
  }

  return data;
}

/**
 * Example: Follow a user
 */
export async function followUser(followerId: string, followingId: string) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('follow')
    .insert({
      followerId,
      followingId,
      createdAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { alreadyFollowing: true };
    }
    console.error('Error following user:', error);
    throw error;
  }

  return data;
}

// ============================================
// SERVER-SIDE EXAMPLES (use in API routes)
// ============================================

/**
 * Example: Server-side fetch with service role
 */
export async function getCatchServer(catchId: string) {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('catch')
    .select(`
      *,
      user:userId (
        id,
        firstName,
        username,
        photoUrl,
        isPro
      ),
      likes:like(count),
      comments:comment(count)
    `)
    .eq('id', catchId)
    .single();

  if (error) {
    console.error('Error fetching catch:', error);
    throw error;
  }

  return data;
}

/**
 * Example: Batch operations
 */
export async function getFeedServer(userId?: string, limit = 20) {
  const supabase = createServerSupabaseClient();
  
  let query = supabase
    .from('catch')
    .select(`
      *,
      user:userId (
        id,
        firstName,
        username,
        photoUrl,
        isPro
      ),
      _count:like(count)
    `)
    .eq('isPublic', true)
    .order('createdAt', { ascending: false })
    .limit(limit);

  // If userId provided, filter to following or user's own posts
  if (userId) {
    // This would require a more complex query with joins
    // For now, just get public posts
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching feed:', error);
    throw error;
  }

  return data;
}

// ============================================
// REAL-TIME EXAMPLES (use in client components)
// ============================================

/**
 * Example: Subscribe to catch updates in real-time
 */
export function subscribeToCatch(catchId: string, callback: (payload: any) => void) {
  const supabase = createSupabaseClient();
  
  const channel = supabase
    .channel(`catch:${catchId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'catch',
        filter: `id=eq.${catchId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Example: Subscribe to new comments
 */
export function subscribeToComments(catchId: string, callback: (payload: any) => void) {
  const supabase = createSupabaseClient();
  
  const channel = supabase
    .channel(`comments:${catchId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'comment',
        filter: `catchId=eq.${catchId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

