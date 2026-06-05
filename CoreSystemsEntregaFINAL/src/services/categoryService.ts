// src/services/categoryService.ts
import { supabase } from '../lib/supabaseClient';
import type { CategoryDropdownData } from '../types';

export const getAllCategories = async (): Promise<CategoryDropdownData[]> => {
  const { data: cats, error: catsError } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');
  if (catsError) throw catsError;

  const { data: filters, error: filtersError } = await supabase
    .from('category_filters')
    .select('*')
    .order('sort_order');
  if (filtersError) throw filtersError;

  // Reconstruye la misma forma que tenía el JSON original
  return (cats ?? []).map(cat => {
    const catFilters = (filters ?? []).filter(f => f.category_id === cat.id);

    const mainFilters = catFilters
      .filter(f => f.section === 'main' && f.filter_label)
      .map(f => ({ label: f.filter_label, items: f.filter_items ?? [] }));

    const accessoryItems = catFilters
      .filter(f => f.section === 'accessories' && f.filter_label)
      .map(f => ({ label: f.filter_label, items: f.filter_items ?? [] }));

    const moreRow = catFilters.find(f => f.section === 'more');

    const mainSection = catFilters.find(f => f.section === 'main');
    const accSection  = catFilters.find(f => f.section === 'accessories');

    return {
      id: cat.id,
      label: cat.label,
      icon: cat.icon,
      sections: {
        main: {
          title: mainSection?.section_title ?? cat.label,
          filters: mainFilters,
        },
        accessories: {
          title: accSection?.section_title ?? 'Accessories',
          items: accessoryItems,
        },
        more: {
          title: moreRow?.section_title ?? 'More',
          label: moreRow?.more_label ?? 'Discover More',
          items: moreRow?.filter_items ?? [],
        },
      },
    } as CategoryDropdownData;
  });
};

export const getCategoryById = async (id: string): Promise<CategoryDropdownData | undefined> => {
  const all = await getAllCategories();
  return all.find(cat => cat.id === id);
};

export const getNavCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, label, icon')
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
};