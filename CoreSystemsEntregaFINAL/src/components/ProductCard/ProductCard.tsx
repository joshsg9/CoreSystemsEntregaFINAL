// src/components/ProductCard/ProductCard.tsx
import React from 'react';
import { type Product } from '../../types';
import { formatPrice } from '../../services/productService';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  return (
    <div className={styles.card} onClick={() => onClick?.(product)}>
      {product.isOnSale && product.discountPercent && (
        <span className={styles.badge}>-{product.discountPercent}%</span>
      )}
      <div className={styles.imageWrapper}>
        <img
          src={product.image}
          alt={product.name}
          className={styles.image}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = `https://placehold.co/220x180/f0f0f0/999999?text=${encodeURIComponent(product.name)}`;
          }}
        />
      </div>
      <div className={styles.info}>
        <p className={styles.name}>{product.name}</p>
        <p className={styles.price}>{formatPrice(product.price)}</p>
      </div>
    </div>
  );
};

export default ProductCard;