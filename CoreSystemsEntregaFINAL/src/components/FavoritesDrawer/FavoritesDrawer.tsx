// src/components/FavoritesDrawer/FavoritesDrawer.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../../context/FavoritesContext';
import styles from './FavoritesDrawer.module.css';

const FavoritesDrawer: React.FC = () => {
  const { items, isOpen, closeDrawer, removeFavorite, totalFavorites } = useFavorites();
  const navigate = useNavigate();

  const handleProductClick = (productId: string | number, slug?: string) => {
    closeDrawer();
    navigate(`/product/${slug ?? productId}`);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`} aria-label="Lista de deseos">
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span className={styles.headerTitle}>Favoritos</span>
            {totalFavorites > 0 && <span className={styles.headerBadge}>{totalFavorites}</span>}
          </div>
          <button className={styles.closeBtn} onClick={closeDrawer} aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <p className={styles.emptyTitle}>Tu lista está vacía</p>
            <p className={styles.emptySubtitle}>Agrega productos que te gusten</p>
            <button className={styles.continueBtn} onClick={closeDrawer}>
              Seguir comprando
            </button>
          </div>
        ) : (
          <>
            <ul className={styles.itemList}>
              {items.map(product => {
                const discount = product.originalPrice && product.originalPrice > product.price
                  ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                  : 0;
                return (
                  <li key={product.id} className={styles.item}>
                    <div className={styles.itemImageWrap} onClick={() => handleProductClick(product.id, product.slug)}>
                      <img src={product.image} alt={product.name} className={styles.itemImage} loading="lazy" />
                      {discount > 0 && (
                        <span className={styles.itemDiscountBadge}>-{discount}%</span>
                      )}
                    </div>
                    <div className={styles.itemInfo}>
                      <p className={styles.itemBrand}>{product.brand}</p>
                      <p className={styles.itemName}>{product.name}</p>
                      {product.color && <p className={styles.itemMeta}>Color: {product.color}</p>}
                      <div className={styles.itemPrice}>
                        ${product.price.toLocaleString('es-CO')}
                      </div>
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeFavorite(product.id)}
                      aria-label={`Eliminar ${product.name} de favoritos`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M18 6 6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className={styles.footer}>
              <button className={styles.continueShoppingBtn} onClick={closeDrawer}>
                Seguir comprando
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

export default FavoritesDrawer;