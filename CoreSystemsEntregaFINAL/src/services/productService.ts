// src/services/productService.ts
import { supabase } from '../lib/supabaseClient';
import type { Product, ProductSpec } from '../types';

// ─── Mapper DB row → Product ──────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapRowToProduct = (p: any): Product => ({
  id:            p.id,
  name:          p.name,
  slug:          p.slug,
  brand:         p.brand_name,
  price:         p.price,
  originalPrice: p.original_price,
  image:         p.image_url,
  category:      p.category_id,
  subcategory:   p.subcategory,
  rating:        p.rating,
  reviewCount:   p.review_count,
  stock:         p.stock,
  isTrending:    p.is_trending,
  isOnSale:      p.is_on_sale,
  discount:      p.discount,
  color:         p.color,
  specs:         (p.specs ?? {}) as ProductSpec,
  badges:        p.badges ?? [],
  description:   p.description,
});

export const getAllProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products_full')
    .select('*');
  if (error) throw error;
  return (data ?? []).map(mapRowToProduct);
};

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products_full')
    .select('*')
    .eq('category_id', category);
  if (error) throw error;
  return (data ?? []).map(mapRowToProduct);
};

export const getProductsByBrand = async (brand: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products_full')
    .select('*')
    .ilike('brand_name', brand);
  if (error) throw error;
  return (data ?? []).map(mapRowToProduct);
};

export const getSaleProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products_full')
    .select('*')
    .eq('is_on_sale', true);
  if (error) throw error;
  return (data ?? []).map(mapRowToProduct);
};

export const getTrendingProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products_full')
    .select('*')
    .eq('is_trending', true)
    .limit(6);
  if (error) throw error;
  return (data ?? []).map(mapRowToProduct);
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products_full')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data ? mapRowToProduct(data) : null;
};

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  // Intentar primero por slug, si falla intentar por id
  const { data, error } = await supabase
    .from('products_full')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!error && data) return mapRowToProduct(data);

  // Fallback: buscar por id
  const { data: dataById } = await supabase
    .from('products_full')
    .select('*')
    .eq('id', slug)
    .maybeSingle();

  return dataById ? mapRowToProduct(dataById) : null;
};

export const formatPrice = (price: number): string =>
  `$ ${price.toLocaleString('es-CO')}`;