// src/components/CartDrawer/CartDrawer.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import styles from './CartDrawer.module.css';

const CartDrawer: React.FC = () => {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout'); // ajusta la ruta según tu app
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`} aria-label="Carrito de compras">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span className={styles.headerTitle}>Carrito</span>
            {totalItems > 0 && <span className={styles.headerBadge}>{totalItems}</span>}
          </div>
          <button className={styles.closeBtn} onClick={closeCart} aria-label="Cerrar carrito">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
            <p className={styles.emptyTitle}>Tu carrito está vacío</p>
            <p className={styles.emptySubtitle}>Agrega productos para comenzar</p>
            <button className={styles.continueBtn} onClick={closeCart}>
              Seguir comprando
            </button>
          </div>
        )}

        {/* Items list */}
        {items.length > 0 && (
          <>
            <ul className={styles.itemList}>
              {items.map(({ product, quantity }) => {
                const hasDiscount = product.originalPrice && product.originalPrice > product.price;
                return (
                  <li key={product.id} className={styles.item}>
                    <div className={styles.itemImageWrap}>
                      <img
                        src={product.image}
                        alt={product.name}
                        className={styles.itemImage}
                        loading="lazy"
                      />
                      {hasDiscount && (
                        <span className={styles.itemDiscountBadge}>
                          -{Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)}%
                        </span>
                      )}
                    </div>

                    <div className={styles.itemInfo}>
                      <p className={styles.itemBrand}>{product.brand}</p>
                      <p className={styles.itemName}>{product.name}</p>
                      {product.color && <p className={styles.itemMeta}>Color: {product.color}</p>}

                      <div className={styles.itemFooter}>
                        <div className={styles.qtyControl}>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            aria-label="Disminuir cantidad"
                          >−</button>
                          <span className={styles.qtyValue}>{quantity}</span>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            aria-label="Aumentar cantidad"
                          >+</button>
                        </div>

                        <div className={styles.itemPrices}>
                          <span className={styles.itemPrice}>
                            ${(product.price * quantity).toLocaleString('es-CO')}
                          </span>
                          {quantity > 1 && (
                            <span className={styles.itemUnitPrice}>
                              ${product.price.toLocaleString('es-CO')} c/u
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      className={styles.removeBtn}
                      onClick={() => removeItem(product.id)}
                      aria-label={`Eliminar ${product.name}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M18 6 6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Footer */}
            <div className={styles.footer}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Subtotal ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})</span>
                <span className={styles.summaryTotal}>${totalPrice.toLocaleString('es-CO')} COP</span>
              </div>
              <p className={styles.shippingNote}>Envío calculado al finalizar la compra</p>
              <button className={styles.checkoutBtn} onClick={handleCheckout}>
                Finalizar compra
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <button className={styles.continueShoppingBtn} onClick={closeCart}>
                Seguir comprando
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;