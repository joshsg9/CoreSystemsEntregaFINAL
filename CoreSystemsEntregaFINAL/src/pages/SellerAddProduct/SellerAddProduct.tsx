// src/pages/SellerAddProduct/SellerAddProduct.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { getCurrentUser } from '../../services/authService';
import BackButton from '../../components/BackButton/BackButton';
import styles from './SellerAddProduct.module.css';

const CATEGORIES = [
  { id: 'smartphones',  label: 'Smartphones' },
  { id: 'laptops',      label: 'Laptops' },
  { id: 'tablets',      label: 'Tablets' },
  { id: 'smartwatches', label: 'Smartwatches' },
  { id: 'televisions',  label: 'Televisions' },
  { id: 'consoles',     label: 'Consoles' },
];

const SPEC_FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: 'processor',       label: 'Processor',       placeholder: 'e.g. Apple M3 Pro' },
  { key: 'ram',             label: 'RAM',              placeholder: 'e.g. 16 GB' },
  { key: 'storage',         label: 'Storage',          placeholder: 'e.g. 512 GB SSD' },
  { key: 'screenSize',      label: 'Screen Size',      placeholder: 'e.g. 6.1 Inches' },
  { key: 'camera',          label: 'Camera',           placeholder: 'e.g. 48 MP' },
  { key: 'battery',         label: 'Battery',          placeholder: 'e.g. 4,800 mAh' },
  { key: 'connectivity',    label: 'Connectivity',     placeholder: 'e.g. 5G, Wi-Fi 6E' },
  { key: 'os',              label: 'Operating System', placeholder: 'e.g. iOS 18' },
  { key: 'gpu',             label: 'GPU',              placeholder: 'e.g. RTX 4070' },
  { key: 'resolution',      label: 'Resolution',       placeholder: 'e.g. 4K UHD' },
  { key: 'panel',           label: 'Panel Type',       placeholder: 'e.g. OLED evo' },
  { key: 'refreshRate',     label: 'Refresh Rate',     placeholder: 'e.g. 120 Hz' },
  { key: 'waterResistance', label: 'Water Resistance', placeholder: 'e.g. IP68' },
  { key: 'gps',             label: 'GPS',              placeholder: 'e.g. GPS + Cellular' },
];

interface FormData {
  name:           string;
  brand_name:     string;
  price:          string;
  original_price: string;
  category_id:    string;
  subcategory:    string;
  color:          string;
  stock:          string;
  discount:       string;
  is_on_sale:     boolean;
  is_trending:    boolean;
  description:    string;
  image_url:      string;
  badges:         string;
  specs:          Record<string, string>;
}

const EMPTY_FORM: FormData = {
  name: '', brand_name: '', price: '', original_price: '',
  category_id: '', subcategory: '', color: '', stock: '',
  discount: '', is_on_sale: false, is_trending: false,
  description: '', image_url: '', badges: '', specs: {},
};

const SellerAddProduct: React.FC = () => {
  const navigate = useNavigate();
  const fileRef  = useRef<HTMLInputElement>(null);

  const [storeId, setStoreId]           = useState<string | null>(null);
  const [userId,  setUserId]            = useState<string | null>(null);
  const [form,    setForm]              = useState<FormData>(EMPTY_FORM);
  const [errors,  setErrors]            = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);

  const [imageFile,      setImageFile]      = useState<File | null>(null);
  const [imagePreview,   setImagePreview]   = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError,    setUploadError]    = useState<string>('');
  const [isDragging,     setIsDragging]     = useState(false);

  useEffect(() => {
    getCurrentUser().then(async user => {
      if (!user)                  { navigate('/login'); return; }
      if (user.role !== 'seller') { navigate('/');      return; }
      setUserId(user.id);
      const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).single();
      if (store) setStoreId(store.id);
    });
  }, [navigate]);

  const setField = (key: keyof FormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const setSpec = (key: string, value: string) => {
    setForm(prev => ({ ...prev, specs: { ...prev.specs, [key]: value } }));
  };

  const handleImageFile = (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) { setUploadError('Only JPG, PNG, WEBP or GIF images are allowed.'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError('Image must be smaller than 5 MB.'); return; }
    setUploadError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setField('image_url', '');
  };

  const handleFileInput  = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); };
  const handleDrop       = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleImageFile(f); };
  const handleDragOver   = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave  = () => setIsDragging(false);

  const removeImage = () => {
    setImageFile(null); setImagePreview(''); setUploadError(''); setUploadProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !userId) return form.image_url || null;
    const ext = imageFile.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${ext}`;
    setUploadProgress(10);
    const { error } = await supabase.storage.from('product-images').upload(fileName, imageFile, { upsert: false });
    if (error) { setUploadError(`Upload failed: ${error.message}`); setUploadProgress(0); return null; }
    setUploadProgress(100);
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim())       e.name        = 'Product name is required';
    if (!form.brand_name.trim()) e.brand_name  = 'Brand is required';
    if (!form.price.trim() || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Valid price is required';
    if (!form.category_id)       e.category_id = 'Category is required';
    if (!form.stock.trim() || isNaN(Number(form.stock))) e.stock = 'Valid stock quantity is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const generateSlug = (name: string, color: string) =>
    `${name}-${color}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + `-${Date.now()}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !storeId) return;
    setLoading(true);
    const finalImageUrl = await uploadImage();
    if (imageFile && !finalImageUrl) { setLoading(false); return; }
    const cleanSpecs  = Object.fromEntries(Object.entries(form.specs).filter(([, v]) => v.trim() !== ''));
    const badgesArray = form.badges.split(',').map(b => b.trim()).filter(Boolean);
    const { error } = await supabase.from('products').insert({
      id: `prod_seller_${Date.now()}`,
      name: form.name.trim(), slug: generateSlug(form.name, form.color),
      brand_name: form.brand_name.trim(),
      price: Math.round(Number(form.price)),
      original_price: form.original_price ? Math.round(Number(form.original_price)) : null,
      image_url: finalImageUrl, category_id: form.category_id,
      subcategory: form.subcategory.trim() || null,
      rating: 0, review_count: 0,
      stock: Math.round(Number(form.stock)),
      is_trending: form.is_trending, is_on_sale: form.is_on_sale,
      discount: form.discount ? Math.round(Number(form.discount)) : 0,
      color: form.color.trim() || null, specs: cleanSpecs,
      badges: badgesArray, description: form.description.trim() || null,
      seller_id: storeId,
    });
    setLoading(false);
    if (error) setErrors({ name: error.message });
    else { setSuccess(true); setTimeout(() => navigate('/seller/home'), 2000); }
  };

  if (success) return (
    <div className={styles.successScreen}>
      <div className={styles.successCard}>
        <div className={styles.successIcon}>✓</div>
        <h2>Product Published!</h2>
        <p>Your product is now live in the catalog.</p>
        <p className={styles.successRedirect}>Redirecting to dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <BackButton label="Back to Dashboard" fallback="/seller/home" />
        <h1 className={styles.headerTitle}>Add New Product</h1>
        <div style={{ width: 140 }} />
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.layout}>
          <div className={styles.col}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Basic Information</h2>
              <div className={styles.field}>
                <label className={styles.label}>Product Name <span className={styles.req}>*</span></label>
                <input className={`${styles.input} ${errors.name ? styles.inputError : ''}`} type="text" placeholder="e.g. iPhone 17 Pro Max" value={form.name} onChange={e => setField('name', e.target.value)} />
                {errors.name && <span className={styles.error}>{errors.name}</span>}
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Brand <span className={styles.req}>*</span></label>
                  <input className={`${styles.input} ${errors.brand_name ? styles.inputError : ''}`} type="text" placeholder="e.g. Apple" value={form.brand_name} onChange={e => setField('brand_name', e.target.value)} />
                  {errors.brand_name && <span className={styles.error}>{errors.brand_name}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Color</label>
                  <input className={styles.input} type="text" placeholder="e.g. Midnight Black" value={form.color} onChange={e => setField('color', e.target.value)} />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Category <span className={styles.req}>*</span></label>
                  <select className={`${styles.input} ${errors.category_id ? styles.inputError : ''}`} value={form.category_id} onChange={e => setField('category_id', e.target.value)}>
                    <option value="">Select category…</option>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                  {errors.category_id && <span className={styles.error}>{errors.category_id}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Subcategory</label>
                  <input className={styles.input} type="text" placeholder="e.g. Mobile Phones" value={form.subcategory} onChange={e => setField('subcategory', e.target.value)} />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea className={`${styles.input} ${styles.textarea}`} placeholder="Describe your product…" value={form.description} onChange={e => setField('description', e.target.value)} rows={3} />
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Pricing & Inventory</h2>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Price (COP) <span className={styles.req}>*</span></label>
                  <input className={`${styles.input} ${errors.price ? styles.inputError : ''}`} type="number" placeholder="e.g. 4299000" value={form.price} onChange={e => setField('price', e.target.value)} min="0" />
                  {errors.price && <span className={styles.error}>{errors.price}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Original Price (COP)</label>
                  <input className={styles.input} type="number" placeholder="Before discount" value={form.original_price} onChange={e => setField('original_price', e.target.value)} min="0" />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Stock <span className={styles.req}>*</span></label>
                  <input className={`${styles.input} ${errors.stock ? styles.inputError : ''}`} type="number" placeholder="e.g. 10" value={form.stock} onChange={e => setField('stock', e.target.value)} min="0" />
                  {errors.stock && <span className={styles.error}>{errors.stock}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Discount %</label>
                  <input className={styles.input} type="number" placeholder="e.g. 15" value={form.discount} onChange={e => setField('discount', e.target.value)} min="0" max="100" />
                </div>
              </div>
              <div className={styles.checkRow}>
                <label className={styles.checkLabel}>
                  <input type="checkbox" checked={form.is_on_sale} onChange={e => setField('is_on_sale', e.target.checked)} className={styles.checkbox} />
                  Mark as On Sale
                </label>
                <label className={styles.checkLabel}>
                  <input type="checkbox" checked={form.is_trending} onChange={e => setField('is_trending', e.target.checked)} className={styles.checkbox} />
                  Mark as Trending
                </label>
              </div>
            </div>
          </div>

          <div className={styles.col}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Media & Badges</h2>
              <div className={styles.field}>
                <label className={styles.label}>Product Image</label>
                {!imagePreview && !form.image_url ? (
                  <div className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={() => fileRef.current?.click()}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <p className={styles.dropZoneText}>Drag & drop your image here<br/><span>or click to browse</span></p>
                    <p className={styles.dropZoneHint}>JPG, PNG, WEBP or GIF · max 5 MB</p>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={handleFileInput} />
                  </div>
                ) : (
                  <div className={styles.imagePreviewWrap}>
                    <img src={imagePreview || form.image_url} alt="preview" className={styles.imagePreviewImg} onError={e => (e.currentTarget.style.display = 'none')} />
                    <button type="button" className={styles.removeImageBtn} onClick={removeImage} aria-label="Remove image">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                    {imageFile && (
                      <div className={styles.imageFileName}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        {imageFile.name}
                      </div>
                    )}
                  </div>
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} /></div>
                )}
                {uploadError && <span className={styles.error}>{uploadError}</span>}
                {!imageFile && (
                  <>
                    <div className={styles.orDivider}><span>or paste a URL</span></div>
                    <input className={styles.input} type="url" placeholder="https://…" value={form.image_url} onChange={e => setField('image_url', e.target.value)} />
                  </>
                )}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Badges</label>
                <input className={styles.input} type="text" placeholder="Free insurance, 0% bank interest" value={form.badges} onChange={e => setField('badges', e.target.value)} />
                <span className={styles.hint}>Separate multiple badges with commas</span>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Specifications</h2>
              <p className={styles.cardHint}>Fill only the fields that apply to your product.</p>
              <div className={styles.specsGrid}>
                {SPEC_FIELDS.map(sf => (
                  <div key={sf.key} className={styles.field}>
                    <label className={styles.label}>{sf.label}</label>
                    <input className={styles.input} type="text" placeholder={sf.placeholder} value={form.specs[sf.key] ?? ''} onChange={e => setSpec(sf.key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.formFooter}>
          <button type="button" className={styles.cancelBtn} onClick={() => navigate('/seller/home')}>Cancel</button>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <><span className={styles.spinner} /> Publishing…</> : '+ Publish Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SellerAddProduct;