// src/context/CartContext.tsx
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { Product, ProductSpec } from '../types';
import { supabase } from '../lib/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  loading: boolean;
}

type CartAction =
  | { type: 'SET_ITEMS';   items: CartItem[] }
  | { type: 'ADD_ITEM';    product: Product; quantity?: number }
  | { type: 'REMOVE_ITEM'; productId: string | number }
  | { type: 'UPDATE_QTY';  productId: string | number; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE' }
  | { type: 'SET_LOADING'; loading: boolean };

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  loading: boolean;
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string | number) => Promise<void>;
  updateQuantity: (productId: string | number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.items };
    case 'ADD_ITEM': {
      const idx = state.items.findIndex(i => String(i.product.id) === String(action.product.id));
      if (idx >= 0) {
        const updated = [...state.items];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + (action.quantity ?? 1) };
        return { ...state, items: updated };
      }
      return { ...state, items: [...state.items, { product: action.product, quantity: action.quantity ?? 1 }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => String(i.product.id) !== String(action.productId)) };
    case 'UPDATE_QTY': {
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter(i => String(i.product.id) !== String(action.productId)) };
      }
      return {
        ...state,
        items: state.items.map(i =>
          String(i.product.id) === String(action.productId) ? { ...i, quantity: action.quantity } : i
        ),
      };
    }
    case 'CLEAR':        return { ...state, items: [] };
    case 'OPEN':         return { ...state, isOpen: true };
    case 'CLOSE':        return { ...state, isOpen: false };
    case 'TOGGLE':       return { ...state, isOpen: !state.isOpen };
    case 'SET_LOADING':  return { ...state, loading: action.loading };
    default:             return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const CartContext = createContext<CartContextValue | null>(null);

// ─── Helpers localStorage (guests) ───────────────────────────────────────────
const LS_KEY = 'cart_guest';

const getLocalCart = (): CartItem[] => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); } catch { return []; }
};

const setLocalCart = (items: CartItem[]) => {
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
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false, loading: true });

  // ── Cargar carrito ──────────────────────────────────────────────────────────
  const loadCart = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loading: true });

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          quantity,
          products (
            id, name, slug, price, original_price, image_url,
            category_id, rating, review_count, brand_name,
            is_on_sale, discount, badges, description, specs, stock
          )
        `)
        .eq('user_id', session.user.id);

      if (!error && data) {
        const items: CartItem[] = data
          .flatMap(row => {
            const products = Array.isArray(row.products) ? row.products : [row.products];
            return products.filter(Boolean).map(p => ({
              product: mapRowToProduct(p),
              quantity: row.quantity,
            }));
          });

        dispatch({ type: 'SET_ITEMS', items });
      }
    } else {
      dispatch({ type: 'SET_ITEMS', items: getLocalCart() });
    }

    dispatch({ type: 'SET_LOADING', loading: false });
  }, []);

  // ── Escuchar sesión ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadCart();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Migrar carrito guest a Supabase
        const localItems = getLocalCart();
        if (localItems.length > 0) {
          const rows = localItems.map(i => ({
            user_id: session.user.id,
            product_id: String(i.product.id),
            quantity: i.quantity,
          }));
          await supabase
            .from('cart_items')
            .upsert(rows, { onConflict: 'user_id,product_id' });
          localStorage.removeItem(LS_KEY);
        }
        loadCart();
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'SET_ITEMS', items: [] });
      }
    });

    return () => subscription.unsubscribe();
  }, [loadCart]);

  // ── addItem ─────────────────────────────────────────────────────────────────
  const addItem = useCallback(async (product: Product, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', product, quantity }); // optimistic

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      // Verificar si ya existe para hacer upsert de quantity
      const { data: existing } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', session.user.id)
        .eq('product_id', String(product.id))
        .single();

      if (existing) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('user_id', session.user.id)
          .eq('product_id', String(product.id));

        if (error) {
          console.error('Error updating cart:', error);
          dispatch({ type: 'REMOVE_ITEM', productId: product.id }); // rollback
        }
      } else {
        const { error } = await supabase.from('cart_items').insert({
          user_id: session.user.id,
          product_id: String(product.id),
          quantity,
        });

        if (error) {
          console.error('Error adding to cart:', error);
          dispatch({ type: 'REMOVE_ITEM', productId: product.id }); // rollback
        }
      }
    } else {
      const local = getLocalCart();
      const idx = local.findIndex(i => String(i.product.id) === String(product.id));
      if (idx >= 0) {
        local[idx].quantity += quantity;
      } else {
        local.push({ product, quantity });
      }
      setLocalCart(local);
    }
  }, []);

  // ── removeItem ──────────────────────────────────────────────────────────────
  const removeItem = useCallback(async (productId: string | number) => {
    dispatch({ type: 'REMOVE_ITEM', productId }); // optimistic

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', session.user.id)
        .eq('product_id', String(productId));

      if (error) {
        console.error('Error removing from cart:', error);
        loadCart(); // restaurar estado real
      }
    } else {
      setLocalCart(getLocalCart().filter(i => String(i.product.id) !== String(productId)));
    }
  }, [loadCart]);

  // ── updateQuantity ──────────────────────────────────────────────────────────
  const updateQuantity = useCallback(async (productId: string | number, quantity: number) => {
    dispatch({ type: 'UPDATE_QTY', productId, quantity }); // optimistic

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      if (quantity <= 0) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', session.user.id)
          .eq('product_id', String(productId));

        if (error) { console.error('Error removing from cart:', error); loadCart(); }
      } else {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('user_id', session.user.id)
          .eq('product_id', String(productId));

        if (error) { console.error('Error updating cart:', error); loadCart(); }
      }
    } else {
      const local = getLocalCart();
      if (quantity <= 0) {
        setLocalCart(local.filter(i => String(i.product.id) !== String(productId)));
      } else {
        setLocalCart(local.map(i =>
          String(i.product.id) === String(productId) ? { ...i, quantity } : i
        ));
      }
    }
  }, [loadCart]);

  // ── clearCart ───────────────────────────────────────────────────────────────
  const clearCart = useCallback(async () => {
    dispatch({ type: 'CLEAR' }); // optimistic

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', session.user.id);

      if (error) { console.error('Error clearing cart:', error); loadCart(); }
    } else {
      localStorage.removeItem(LS_KEY);
    }
  }, [loadCart]);

  const openCart   = useCallback(() => dispatch({ type: 'OPEN' }), []);
  const closeCart  = useCallback(() => dispatch({ type: 'CLOSE' }), []);
  const toggleCart = useCallback(() => dispatch({ type: 'TOGGLE' }), []);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items: state.items,
      isOpen: state.isOpen,
      loading: state.loading,
      totalItems,
      totalPrice,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openCart,
      closeCart,
      toggleCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}