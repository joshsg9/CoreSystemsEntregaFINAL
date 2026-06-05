// src/services/reviewService.ts
import { supabase } from '../lib/supabaseClient';

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export async function getReviewsByProduct(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles (full_name, email, avatar_url)
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getUserReview(productId: string, userId: string): Promise<Review | null> {
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .maybeSingle();

  return data ?? null;
}

export async function upsertReview(
  productId: string,
  userId: string,
  rating: number,
  comment: string,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('reviews')
    .upsert(
      { product_id: productId, user_id: userId, rating, comment },
      { onConflict: 'product_id,user_id' }
    );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteReview(
  productId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('product_id', productId)
    .eq('user_id', userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}