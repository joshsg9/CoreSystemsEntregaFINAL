// src/context/FavoritesContext.tsx
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Product, ProductSpec } from '../types';
import { supabase } from '../lib/supabaseClient';

// ─── Estado ──────────────────────────────────────────────────────────────────
interface FavoritesState {
  items: Product[];
  isOpen: boolean;
  loading: boolean;
}

type FavoritesAction =
  | { type: 'SET_ITEMS'; items: Product[] }
  | { type: 'ADD_FAVORITE'; product: Product }
  | { type: 'REMOVE_FAVORITE'; productId: string | number }
  | { type: 'OPEN_DRAWER' }
  | { type: 'CLOSE_DRAWER' }
  | { type: 'TOGGLE_DRAWER' }
  | { type: 'SET_LOADING'; loading: boolean };

const favoritesReducer = (state: FavoritesState, action: FavoritesAction): FavoritesState => {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.items };
    case 'ADD_FAVORITE':
      if (state.items.some(p => String(p.id) === String(action.product.id))) return state;
      return { ...state, items: [...state.items, action.product] };
    case 'REMOVE_FAVORITE':
      return { ...state, items: state.items.filter(p => String(p.id) !== String(action.productId)) };
    case 'OPEN_DRAWER':   return { ...state, isOpen: true };
    case 'CLOSE_DRAWER':  return { ...state, isOpen: false };
    case 'TOGGLE_DRAWER': return { ...state, isOpen: !state.isOpen };
    case 'SET_LOADING':   return { ...state, loading: action.loading };
    default: return state;
  }
};

// ─── Contexto ────────────────────────────────────────────────────────────────
interface FavoritesContextValue {
  items: Product[];
  isOpen: boolean;
  loading: boolean;
  totalFavorites: number;
  addFavorite: (product: Product) => Promise<void>;
  removeFavorite: (productId: string | number) => Promise<void>;
  isFavorite: (productId: string | number) => boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

// ─── Helpers localStorage (guests) ───────────────────────────────────────────
const LS_KEY = 'favorites_guest';

const getLocalFavorites = (): Product[] => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); } catch { return []; }
};

const setLocalFavorites = (items: Product[]) => {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
};

// ─── Mapper DB → Product ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapRowToProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  brand: p.brand_name,
  price: p.price,
  originalPrice: p.original_price,
  image: p.image_url,
  category: p.category_id,
  rating: p.rating,
  reviewCount: p.review_count,
  stock: p.stock,
  isOnSale: p.is_on_sale,
  discount: p.discount,
  badges: p.badges ?? [],
  description: p.description,
  specs: (p.specs ?? {}) as ProductSpec,
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(favoritesReducer, {
    items: [], isOpen: false, loading: true,
  });

  // ── Cargar favoritos ────────────────────────────────────────────────────────
  const loadFavorites = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loading: true });

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          product_id,
          products (
            id, name, slug, price, original_price, image_url,
            category_id, rating, review_count, brand_name,
            is_on_sale, discount, badges, description, specs, stock
          )
        `)
        .eq('user_id', session.user.id);

      if (!error && data) {
        const products: Product[] = data
          .flatMap(row => (Array.isArray(row.products) ? row.products : [row.products]))
          .filter(Boolean)
          .map(mapRowToProduct);

        dispatch({ type: 'SET_ITEMS', items: products });
      }
    } else {
      dispatch({ type: 'SET_ITEMS', items: getLocalFavorites() });
    }

    dispatch({ type: 'SET_LOADING', loading: false });
  }, []);

  // ── Escuchar sesión ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadFavorites();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Migrar favoritos de guest a Supabase
        const localItems = getLocalFavorites();
        if (localItems.length > 0) {
          const rows = localItems.map(p => ({
            user_id: session.user.id,
            product_id: String(p.id),
          }));
          await supabase
            .from('favorites')
            .upsert(rows, { onConflict: 'user_id,product_id' });
          localStorage.removeItem(LS_KEY);
        }
        loadFavorites();
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'SET_ITEMS', items: [] });
      }
    });

    return () => subscription.unsubscribe();
  }, [loadFavorites]);

  // ── addFavorite ─────────────────────────────────────────────────────────────
  const addFavorite = useCallback(async (product: Product) => {
    dispatch({ type: 'ADD_FAVORITE', product }); // optimistic

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const { error } = await supabase.from('favorites').insert({
        user_id: session.user.id,
        product_id: String(product.id),
      });
      // 23505 = unique violation (ya existe), no es error real
      if (error && error.code !== '23505') {
        console.error('Error adding favorite:', error);
        dispatch({ type: 'REMOVE_FAVORITE', productId: product.id }); // rollback
      }
    } else {
      const local = getLocalFavorites();
      if (!local.some(p => String(p.id) === String(product.id))) {
        setLocalFavorites([...local, product]);
      }
    }
  }, []);

  // ── removeFavorite ──────────────────────────────────────────────────────────
  const removeFavorite = useCallback(async (productId: string | number) => {
    dispatch({ type: 'REMOVE_FAVORITE', productId }); // optimistic

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', session.user.id)
        .eq('product_id', String(productId));

      if (error) {
        console.error('Error removing favorite:', error);
        loadFavorites(); // recargar para restaurar estado real
      }
    } else {
      setLocalFavorites(
        getLocalFavorites().filter(p => String(p.id) !== String(productId))
      );
    }
  }, [loadFavorites]);

  const isFavorite   = useCallback((productId: string | number) =>
    state.items.some(p => String(p.id) === String(productId)), [state.items]);
  const openDrawer   = useCallback(() => dispatch({ type: 'OPEN_DRAWER' }), []);
  const closeDrawer  = useCallback(() => dispatch({ type: 'CLOSE_DRAWER' }), []);
  const toggleDrawer = useCallback(() => dispatch({ type: 'TOGGLE_DRAWER' }), []);

  return (
    <FavoritesContext.Provider value={{
      items: state.items,
      isOpen: state.isOpen,
      loading: state.loading,
      totalFavorites: state.items.length,
      addFavorite,
      removeFavorite,
      isFavorite,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextValue => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside <FavoritesProvider>');
  return ctx;
};