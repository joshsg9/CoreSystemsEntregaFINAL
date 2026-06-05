// src/pages/SellerRegister/SellerRegister.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, upgradeToSeller } from '../../services/authService';
import BackButton from '../../components/BackButton/BackButton';
import styles from './SellerRegister.module.css';

const SellerRegister: React.FC = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ username: '', storeName: '' });
  const [errors,   setErrors]   = useState<Partial<typeof formData>>({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then(user => {
      if (!user) { navigate('/login'); return; }
      if (user.role === 'seller') { navigate('/seller/home'); return; }
      setUserId(user.id);
    });
  }, [navigate]);

  const validate = () => {
    const newErrors: Partial<typeof formData> = {};
    if (!formData.username.trim())  newErrors.username  = 'Username is required';
    if (!formData.storeName.trim()) newErrors.storeName = 'Store name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: undefined }));
    setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !userId) return;
    setLoading(true);
    const result = await upgradeToSeller(userId, formData.username, formData.storeName);
    setLoading(false);
    if (!result.success) setApiError(result.error ?? 'Error creating seller account.');
    else navigate('/seller/home');
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        <div style={{ alignSelf: 'flex-start', marginBottom: '8px' }}>
          <BackButton fallback="/" />
        </div>

        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="#1a1a1a" strokeWidth="1.8" strokeLinejoin="round"/>
              <polyline points="9 22 9 12 15 12 15 22" stroke="#1a1a1a" strokeWidth="1.8" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className={styles.title}>Create your store</h1>
          <p className={styles.subtitle}>Start selling on CoreSystems today</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="username">Username</label>
              <input
                id="username"
                className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
                type="text"
                name="username"
                placeholder="your_username"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
              />
              {errors.username && <span className={styles.error}>{errors.username}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="storeName">Store Name</label>
              <input
                id="storeName"
                className={`${styles.input} ${errors.storeName ? styles.inputError : ''}`}
                type="text"
                name="storeName"
                placeholder="My Tech Store"
                value={formData.storeName}
                onChange={handleChange}
              />
              {errors.storeName && <span className={styles.error}>{errors.storeName}</span>}
            </div>
          </div>

          {apiError && <p className={styles.error} style={{ textAlign: 'center', paddingLeft: 0 }}>{apiError}</p>}

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? <span className={styles.spinner} /> : 'Create Seller Account'}
          </button>
        </form>

        <p className={styles.loginLink}>
          Already have an account?{' '}
          <button className={styles.linkBtn} onClick={() => navigate('/login')}>Sign in</button>
        </p>

        <p className={styles.legal}>
          By continuing, you agree to our{' '}
          <a href="#" className={styles.legalLink}>Terms of Use</a> and authorize
          the processing of your personal data in accordance with{' '}
          <a href="#" className={styles.legalLink}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default SellerRegister;