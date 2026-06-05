// src/components/SearchOverlay/SearchOverlay.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  getPopularSearches,
  getRecommendedProducts,
  searchProducts,
  formatPrice,
  type SearchProduct,
} from '../../services/searchService';
import styles from './SearchOverlay.module.css';

interface SearchOverlayProps {
  query: string;
  onClose: () => void;
  onTagClick: (tag: string) => void;
  onProductClick?: (product: SearchProduct) => void;
}

const StarRating: React.FC<{ rating: number; count: number }> = ({ rating, count }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className={styles.stars}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`${styles.star} ${
          i < full ? styles.starFull : i === full && half ? styles.starHalf : styles.starEmpty
        }`}>★</span>
      ))}
      <span className={styles.reviewCount}>({count})</span>
    </span>
  );
};

const SearchOverlay: React.FC<SearchOverlayProps> = ({ query, onClose, onTagClick, onProductClick }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [popular, setPopular]   = useState<string[]>([]);
  const [products, setProducts] = useState<SearchProduct[]>([]);

  const isSearching = query.trim().length > 0;

  // Carga búsquedas populares al montar
  useEffect(() => {
    getPopularSearches().then(setPopular).catch(console.error);
  }, []);

  // Carga productos cuando cambia el query
  useEffect(() => {
    if (isSearching) {
      searchProducts(query).then(setProducts).catch(console.error);
    } else {
      getRecommendedProducts().then(setProducts).catch(console.error);
    }
  }, [query, isSearching]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.overlay} ref={overlayRef}>
        <div className={styles.panel}>

          <div className={styles.left}>
            <p className={styles.sectionLabel}>
              {isSearching ? 'Suggestions' : 'the most searched'}
            </p>
            <div className={styles.tagsGrid}>
              {isSearching
                ? popular
                    .filter(t => t.toLowerCase().includes(query.toLowerCase()))
                    .slice(0, 8)
                    .concat(popular.slice(0, 4))
                    .slice(0, 8)
                    .map(tag => (
                      <button key={tag} className={styles.tag} onClick={() => onTagClick(tag)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.tagIcon}>
                          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                        </svg>
                        {tag}
                      </button>
                    ))
                : popular.map(tag => (
                    <button key={tag} className={styles.tag} onClick={() => onTagClick(tag)}>{tag}</button>
                  ))
              }
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.right}>
            <p className={styles.sectionLabel}>
              {isSearching ? `Results for "${query}"` : 'Recommended products'}
            </p>

            {products.length === 0 ? (
              <div className={styles.noResults}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <p>No products found for "{query}"</p>
              </div>
            ) : (
              <div className={styles.productList}>
                {products.map((product, i) => (
                  <button
                    key={product.id}
                    className={styles.productRow}
                    onClick={() => onProductClick?.(product)}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className={styles.productImageWrap}>
                      {product.badge && <span className={styles.productBadge}>{product.badge}</span>}
                      <img
                        src={product.image}
                        alt={product.name}
                        className={styles.productImage}
                        onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60x60?text=?'; }}
                      />
                    </div>
                    <div className={styles.productInfo}>
                      <p className={styles.productName}>{product.name}</p>
                      <StarRating rating={product.rating} count={product.reviewCount} />
                      <p className={styles.productPrice}>{formatPrice(product.price)}</p>
                    </div>
                    <svg className={styles.productArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchOverlay;