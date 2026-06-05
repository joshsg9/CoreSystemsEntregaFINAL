// src/pages/SellerHome/SellerHome.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../../services/authService';
import { supabase } from '../../lib/supabaseClient';
import SellerChatWidget from '../../components/SellerChatWidget/SellerChatWidget';
import styles from './SellerHome.module.css';

const NAV_ITEMS = ['Dashboard', 'Products', 'Orders', 'Analytics', 'Customers', 'Promotions', 'Settings'];

const STATS = [
  { label: 'Total Sales',     value: '$0.00', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { label: 'Active Listings', value: '0',     icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
  { label: 'Orders',          value: '0',     icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
  { label: 'Reviews',         value: '0',     icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
];

const TIPS = [
  { title: 'Complete your profile', desc: 'Stores with complete profiles sell 3x more.' },
  { title: 'Add your first product', desc: 'Upload photos, set a price and go live.' },
  { title: 'Set up shipping',        desc: 'Define your shipping zones and rates.' },
  { title: 'Activate promotions',    desc: 'Run your first discount campaign.' },
];

interface SellerProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  is_on_sale: boolean;
  is_trending: boolean;
  image_url: string | null;
  category_id: string | null;
  created_at: string;
}

const SellerHome: React.FC = () => {
  const navigate  = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [activeNav,  setActiveNav]  = useState('Dashboard');
  const [username,   setUsername]   = useState('Seller');
  const [storeName,  setStoreName]  = useState('My Store');
  const [listings,   setListings]   = useState(0);
  const [products,   setProducts]   = useState<SellerProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    getCurrentUser().then(async user => {
      if (!user)                  { navigate('/login'); return; }
      if (user.role !== 'seller') { navigate('/');      return; }

      setUsername(user.name || user.email);

      const { data: store } = await supabase
        .from('stores')
        .select('id, store_name')
        .eq('owner_id', user.id)
        .single();

      if (store) {
        setStoreName(store.store_name);

        const { data: prods, count } = await supabase
          .from('products')
          .select('id, name, price, stock, is_on_sale, is_trending, image_url, category_id, created_at', { count: 'exact' })
          .eq('seller_id', store.id)
          .order('created_at', { ascending: false });

        setListings(count ?? 0);
        setProducts(prods ?? []);
      }
      setLoadingProducts(false);
    });
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const scrollRight = () => scrollRef.current?.scrollBy({ left: 260, behavior: 'smooth' });

  const STATS_DYNAMIC = STATS.map(s =>
    s.label === 'Active Listings' ? { ...s, value: String(listings) } : s
  );

  const FEATURE_CARDS = [
    {
      label: 'Add Product',
      desc: 'List your tech products and reach thousands of buyers instantly.',
      icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
      onClick: () => navigate('/seller/add-product'),
    },
    {
      label: 'Manage Orders',
      desc: 'Track, process and ship your pending orders with ease.',
      icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
      onClick: () => {},
    },
    {
      label: 'View Analytics',
      desc: 'See how your store is performing today with real-time insights.',
      icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
      onClick: () => {},
    },
    {
      label: 'Store Settings',
      desc: 'Customize your store profile, shipping policies and more.',
      icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
      onClick: () => {},
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.topBar}>
          <div className={styles.logo} onClick={() => navigate('/')}>
            <span className={styles.logoDot1}>●</span>
            <span className={styles.logoDot2}>◉</span>
            <span className={styles.logoText}>
              <span className={styles.logoCore}>Core</span>
              <span className={styles.logoSystems}>Systems</span>
            </span>
            <span className={styles.sellerBadge}>Seller</span>
          </div>

          <form className={styles.searchForm} onSubmit={e => e.preventDefault()}>
            <input className={styles.searchInput} type="text" placeholder="Search your products, orders…" autoComplete="off"/>
            <button className={styles.searchBtn} type="submit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </form>

          <nav className={styles.topActions}>
            <button className={styles.iconBtn} aria-label="Notifications">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>

            <button
              className={styles.iconBtn}
              aria-label="Sign out"
              title="Sign out"
              onClick={handleLogout}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>

            <div className={styles.avatarBtn}>{username.charAt(0).toUpperCase()}</div>
          </nav>
        </div>

        <nav className={styles.catNav}>
          {NAV_ITEMS.map(item => (
            <button
              key={item}
              className={`${styles.catItem} ${activeNav === item ? styles.catItemActive : ''}`}
              onClick={() => setActiveNav(item)}
            >
              {item}
            </button>
          ))}
          <button className={styles.newProductBtn} onClick={() => navigate('/seller/add-product')}>
            + New Product
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Welcome, <span className={styles.heroName}>{username}</span>!
            </h1>
            <p className={styles.heroSubtitle}>
              Your store <strong>{storeName}</strong> is live and ready.
            </p>
            <div className={styles.heroCtas}>
              <button className={styles.ctaPrimary} onClick={() => navigate('/seller/add-product')}>
                Add Your First Product ›
              </button>
              <button className={styles.ctaSecondary}>View Store Guide</button>
            </div>
          </div>
          <div className={styles.heroDots}>
            {[0,1,2,3,4,5].map(i => (
              <span key={i} className={`${styles.dot} ${i === 0 ? styles.dotActive : ''}`}/>
            ))}
          </div>
        </section>

        <section className={styles.statsGrid}>
          {STATS_DYNAMIC.map(s => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statIcon}>{s.icon}</div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            </div>
          ))}
        </section>

        <section className={styles.features}>
          <h2 className={styles.sectionTitle}>Check some of these things out!</h2>
          <div className={styles.featureGrid}>
            {FEATURE_CARDS.map(card => (
              <div key={card.label} className={styles.featureCard} onClick={card.onClick} style={{ cursor: 'pointer' }}>
                <p className={styles.featureCardTitle}>{card.label}</p>
                <div className={styles.featureCardIcon}>{card.icon}</div>
                <p className={styles.featureCardDesc}>{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.tipsSection}>
          <div className={styles.tipsSectionInner}>
            <h2 className={styles.sectionTitle}>Getting started</h2>
            <div className={styles.tipsScrollWrapper}>
              <div className={styles.tipsScroll} ref={scrollRef}>
                {TIPS.map(tip => (
                  <div key={tip.title} className={styles.tipCard}>
                    <div className={styles.tipCheck}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <p className={styles.tipTitle}>{tip.title}</p>
                    <p className={styles.tipDesc}>{tip.desc}</p>
                  </div>
                ))}
              </div>
              <button className={styles.scrollBtn} onClick={scrollRight} aria-label="Scroll">›</button>
            </div>
          </div>
        </section>

        {/* ── Recent Activity ── */}
        <section className={styles.activitySection}>
          <div className={styles.activityInner}>
            <div className={styles.activityHeader}>
              <h2 className={styles.sectionTitle}>Recent Activity</h2>
              {products.length > 0 && (
                <button
                  className={styles.addProductLink}
                  onClick={() => navigate('/seller/add-product')}
                >
                  + Add product
                </button>
              )}
            </div>

            {loadingProducts ? (
              <div className={styles.emptyState}>
                <p style={{ color: '#999' }}>Loading products…</p>
              </div>
            ) : products.length === 0 ? (
              <div className={styles.emptyState}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <p>No products yet.</p>
                <button className={styles.ctaPrimary} onClick={() => navigate('/seller/add-product')}>
                  Add your first product
                </button>
              </div>
            ) : (
              <div className={styles.productsTable}>
                <div className={styles.productsTableHead}>
                  <span>Product</span>
                  <span>Category</span>
                  <span>Price</span>
                  <span>Stock</span>
                  <span>Status</span>
                  <span>Added</span>
                </div>
                {products.map(p => (
                  <div key={p.id} className={styles.productsTableRow}>
                    <div className={styles.productCell}>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className={styles.productThumb}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className={styles.productThumbPlaceholder}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="3"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                        </div>
                      )}
                      <span className={styles.productName}>{p.name}</span>
                    </div>
                    <span className={styles.productCategory}>{p.category_id ?? '—'}</span>
                    <span className={styles.productPrice}>
                      ${p.price.toLocaleString('es-CO')}
                    </span>
                    <span className={`${styles.productStock} ${p.stock === 0 ? styles.stockOut : p.stock < 5 ? styles.stockLow : ''}`}>
                      {p.stock}
                    </span>
                    <div className={styles.productBadges}>
                      {p.is_on_sale   && <span className={styles.badgeSale}>Sale</span>}
                      {p.is_trending  && <span className={styles.badgeTrending}>Trending</span>}
                      {!p.is_on_sale && !p.is_trending && <span className={styles.badgeActive}>Active</span>}
                    </div>
                    <span className={styles.productDate}>
                      {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <SellerChatWidget />
    </div>
  );
};

export default SellerHome;