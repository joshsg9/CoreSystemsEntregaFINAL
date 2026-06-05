// src/components/SearchResultsPage/SearchResultsPage.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchProductsFull } from '../../services/searchService';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import type { Product, SearchFilters, SortOption, SearchResult } from '../../types';
import BackButton from '../../components/BackButton/BackButton';
import styles from './SearchResultsPage.module.css';

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick }) => {
  const { addItem, openCart } = useCart();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [added, setAdded]         = useState(false);
  const [favorited, setFavorited] = useState(() => isFavorite(product.id));

  const discount = product.originalPrice !== undefined && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const rating = product.rating ?? 0;
  const badges = product.badges ?? [];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product, 1);
    openCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (favorited) { removeFavorite(product.id); setFavorited(false); }
    else           { addFavorite(product);        setFavorited(true);  }
  };

  return (
    <article className={styles.card} onClick={() => onProductClick(product)}>
      <div className={styles.cardImageWrap}>
        <img src={product.image} alt={product.name} className={styles.cardImage} loading="lazy"/>
        {discount > 0 && <span className={styles.discountBadge}>-{discount}%</span>}
      </div>
      <div className={styles.cardBody}>
        <span className={styles.cardBrand}>{product.brand}</span>
        <h3 className={styles.cardName}>{product.name}</h3>
        <div className={styles.cardRating}>
          <span className={styles.ratingStars}>
            {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
          </span>
          <span className={styles.ratingCount}>({product.reviewCount ?? 0})</span>
        </div>
        {badges.length > 0 && (
          <div className={styles.cardBadges}>
            {badges.map(b => <span key={b} className={styles.badge}>{b}</span>)}
          </div>
        )}
        <div className={styles.cardSpecs}>
          {product.specs?.camera     && <span>{product.specs.camera} cam</span>}
          {product.specs?.storage    && <span>{product.specs.storage}</span>}
          {product.specs?.screenSize && <span>{product.specs.screenSize}</span>}
          {product.specs?.ram        && <span>{product.specs.ram} RAM</span>}
        </div>
        <div className={styles.cardFooter}>
          <div className={styles.priceBlock}>
            <span className={styles.price}>${product.price.toLocaleString('es-CO')}</span>
            {product.originalPrice !== undefined && product.originalPrice > product.price && (
              <span className={styles.originalPrice}>${product.originalPrice.toLocaleString('es-CO')}</span>
            )}
          </div>
          <button
            className={`${styles.addToCartBtn} ${added ? styles.addToCartBtnAdded : ''}`}
            onClick={handleAddToCart}
          >
            {added ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            )}
          </button>
        </div>
        <div className={styles.cardActions}>
          <button className={styles.actionBtn} onClick={e => e.stopPropagation()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><rect x="16" y="16" width="5" height="5"/></svg>
            Compare
          </button>
          <button className={styles.actionBtn} onClick={handleFavorite} style={{ color: favorited ? '#e53935' : undefined }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {favorited ? 'Favorito' : 'Add to favorites'}
          </button>
          <button className={styles.actionBtn} onClick={e => { e.stopPropagation(); onProductClick(product); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            See more details
          </button>
        </div>
      </div>
    </article>
  );
};

const COLOR_MAP: Record<string, string> = {
  Black: '#1a1a1a', White: '#f5f5f5', Silver: '#c0c0c0',
  Blue: '#2563eb',  Purple: '#7c3aed', Orange: '#ea580c',
  Green: '#16a34a', Pink: '#ec4899',   Brown: '#92400e',
  Red: '#dc2626',   Gold: '#d97706',   Gray: '#6b7280',
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance',  label: 'Relevance'         },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating',     label: 'Top Rated'         },
  { value: 'newest',     label: 'Newest'            },
];

const SearchResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const query       = searchParams.get('q')        ?? '';
  const brand       = searchParams.get('brand')    ?? undefined;
  const category    = searchParams.get('category') ?? undefined;
  const sortBy      = (searchParams.get('sort') as SortOption | null) ?? 'relevance';
  const minPrice    = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice    = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const colorsParam = searchParams.get('colors');
  const activeColors: string[] = colorsParam ? colorsParam.split(',') : [];

  const [customMin, setCustomMin] = useState(minPrice?.toString() ?? '');
  const [customMax, setCustomMax] = useState(maxPrice?.toString() ?? '');
  const [result, setResult]       = useState<SearchResult>({ products: [], total: 0, filters: { brands: [], colors: [], priceRanges: [] } });
  const [loading, setLoading]     = useState(false);

  const filters: SearchFilters = useMemo(() => ({
    query, brand, category, sortBy, minPrice, maxPrice,
    colors: activeColors.length ? activeColors : undefined,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [query, brand, category, sortBy, minPrice, maxPrice, colorsParam]);

  useEffect(() => {
    setLoading(true);
    searchProductsFull(filters)
      .then(setResult)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  const { products, total, filters: agg } = result;

  const setParam = useCallback((key: string, value: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleProductClick = useCallback((product: Product) => {
    navigate(`/product/${product.slug ?? product.id}`);
  }, [navigate]);

  const toggleColor = (color: string) => {
    const next = activeColors.includes(color)
      ? activeColors.filter(c => c !== color)
      : [...activeColors, color];
    setParam('colors', next.length ? next.join(',') : null);
  };

  const applyPriceRange = (min: number, max: number | null) => {
    setParam('minPrice', min > 0 ? String(min) : null);
    setParam('maxPrice', max !== null ? String(max) : null);
  };

  const applyCustomPrice = () => {
    setParam('minPrice', customMin || null);
    setParam('maxPrice', customMax || null);
  };

  const clearAll = () => {
    setSearchParams({ q: query }, { replace: true });
    setCustomMin('');
    setCustomMax('');
  };

  const hasActiveFilters = !!(brand || category || minPrice || maxPrice || activeColors.length);

  useEffect(() => {
    setCustomMin(minPrice?.toString() ?? '');
    setCustomMax(maxPrice?.toString() ?? '');
  }, [minPrice, maxPrice]);

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.filterTitle}>Filter by:</span>
          {hasActiveFilters && <button className={styles.clearAllBtn} onClick={clearAll}>Clear all</button>}
        </div>

        <section className={styles.filterSection}>
          <h4 className={styles.filterSectionTitle}>Brand</h4>
          <input
            className={styles.brandSearch}
            type="text"
            placeholder="Search by brand"
            value={brand ?? ''}
            onChange={e => setParam('brand', e.target.value || null)}
          />
          {agg.brands.map(b => (
            <label key={b.name} className={styles.checkLabel}>
              <input type="checkbox" checked={brand === b.name} onChange={() => setParam('brand', brand === b.name ? null : b.name)}/>
              <span className={styles.checkText}>{b.name}</span>
              <span className={styles.checkCount}>({b.count})</span>
            </label>
          ))}
        </section>

        <section className={styles.filterSection}>
          <h4 className={styles.filterSectionTitle}>Price Range</h4>
          {agg.priceRanges.map(range => (
            <button
              key={range.label}
              className={`${styles.priceRangeBtn} ${minPrice === range.min && maxPrice === (range.max ?? undefined) ? styles.priceRangeBtnActive : ''}`}
              onClick={() => applyPriceRange(range.min, range.max)}
            >
              <span>{range.label}</span>
              <span className={styles.checkCount}>{range.count}</span>
            </button>
          ))}
          <div className={styles.customPriceRow}>
            <input className={styles.priceInput} type="number" placeholder="Min" value={customMin} onChange={e => setCustomMin(e.target.value)} onBlur={applyCustomPrice} onKeyDown={e => e.key === 'Enter' && applyCustomPrice()}/>
            <span className={styles.priceSep}>—</span>
            <input className={styles.priceInput} type="number" placeholder="Max" value={customMax} onChange={e => setCustomMax(e.target.value)} onBlur={applyCustomPrice} onKeyDown={e => e.key === 'Enter' && applyCustomPrice()}/>
            <button className={styles.priceApplyBtn} onClick={applyCustomPrice}>✓</button>
          </div>
        </section>

        <section className={styles.filterSection}>
          <h4 className={styles.filterSectionTitle}>Color</h4>
          {agg.colors.map(c => (
            <label key={c.name} className={styles.colorLabel}>
              <input type="checkbox" checked={activeColors.includes(c.name)} onChange={() => toggleColor(c.name)}/>
              <span className={styles.colorSwatch} style={{ background: COLOR_MAP[c.name] ?? '#888' }}/>
              <span className={styles.checkText}>{c.name}</span>
              <span className={styles.checkCount}>({c.count})</span>
            </label>
          ))}
        </section>
      </aside>

      <main className={styles.results}>
        <div className={styles.resultsHeader}>
          <BackButton label="Inicio" fallback="/" />
          <p className={styles.resultsCount}>
            {loading ? 'Searching...' : <>Showing <strong>{products.length}</strong> of <strong>{total}</strong> results{query && <> for <em>"{query}"</em></>}</>}
          </p>
          <label className={styles.sortLabel}>
            Order by
            <select className={styles.sortSelect} value={sortBy} onChange={e => setParam('sort', e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>

        {hasActiveFilters && (
          <div className={styles.activeFilters}>
            {brand && <span className={styles.chip}>Brand: {brand}<button onClick={() => setParam('brand', null)}>×</button></span>}
            {activeColors.map(c => <span key={c} className={styles.chip}>Color: {c}<button onClick={() => toggleColor(c)}>×</button></span>)}
            {(minPrice ?? maxPrice) && (
              <span className={styles.chip}>
                Price: ${(minPrice ?? 0).toLocaleString('es-CO')} – {maxPrice ? `$${maxPrice.toLocaleString('es-CO')}` : '∞'}
                <button onClick={() => { setParam('minPrice', null); setParam('maxPrice', null); }}>×</button>
              </span>
            )}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className={styles.empty}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <p>No products found{query && <> for <strong>"{query}"</strong></>}.</p>
            <button className={styles.clearAllBtn} onClick={clearAll}>Clear filters</button>
          </div>
        )}

        {loading && (
          <div className={styles.empty}>
            <p style={{ color: '#999' }}>Loading...</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className={styles.grid}>
            {products.map(product => (
              <ProductCard key={product.id} product={product} onProductClick={handleProductClick}/>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchResultsPage;