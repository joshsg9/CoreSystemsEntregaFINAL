// src/types/index.ts

// =========================
// AUTH
// =========================

// Agrega role al User
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  role?: 'buyer' | 'seller';  // ← agregar
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export type AuthProvider = "google" | "facebook" | "apple";

export interface LoginFormData {
  identifier: string;
  provider?: AuthProvider;
}

// =========================
// PRODUCTS
// =========================

/**
 * ProductSpec unifica las especificaciones de TODAS las categorías.
 * Todos los valores son string para mantener consistencia con el JSON
 * y compatibilidad con el índice flexible.
 *
 * Categorías cubiertas:
 *  - smartphones / tablets   → camera, frontCamera, storage, screenSize, ram, processor, battery,
 *                              chargingSpeed, os, connectivity, dimensions, weight, waterResistance,
 *                              screenType, refreshRate, resolution, simCard, videoRecording, spen,
 *                              wirelessCharging, nfc, body
 *  - smartwatches            → screenSize, screenType, resolution, battery, waterResistance, gps,
 *                              connectivity, processor, storage, ram, os, sensors, chargingSpeed,
 *                              body, dimensions, weight, emergencySOS, crashDetection, altimeter
 *  - laptops                 → processor, storage, screenSize, ram, gpu, battery, chargingSpeed,
 *                              os, connectivity, dimensions, weight, screenType, refreshRate,
 *                              resolution, ports, keyboard, webcam
 *  - televisions             → resolution, screenSize, panel, hdr, refreshRate, smartOS,
 *                              connectivity, dimensions, weight, audioOutput, ports
 *  - consoles                → processor, storage, resolution, ram, optical, connectivity,
 *                              dimensions, weight, audioOutput, vrSupport
 */
export interface ProductSpec {
  // ── Pantalla ──────────────────────────────────────────────────────────────
  screenSize?: string;          // "6.9 Inches" | "49mm" | "65 Inches"
  screenType?: string;          // "Super Retina XDR OLED" | "Dynamic AMOLED 2X" | ...
  resolution?: string;          // "2868 × 1320 px" | "4K UHD" | ...
  refreshRate?: string;         // "1–120 Hz (ProMotion)" | "144 Hz"
  panel?: string;               // para TVs: "OLED evo" | "LED Crystal UHD"
  hdr?: string;                 // "Dolby Vision IQ" | "HDR10+"

  // ── Cámara ────────────────────────────────────────────────────────────────
  camera?: string;              // "48 MP" | "200 MP (Principal) + ..."
  frontCamera?: string;         // "12 MP TrueDepth"
  videoRecording?: string;      // "4K 120fps ProRes"

  // ── Rendimiento ───────────────────────────────────────────────────────────
  processor?: string;           // "Apple A19 Pro" | "Snapdragon 8 Elite"
  ram?: string;                 // "12 GB"
  storage?: string;             // "512 GB" | "1 TB SSD"
  gpu?: string;                 // "NVIDIA RTX 4070" (laptops gaming)

  // ── Batería y carga ───────────────────────────────────────────────────────
  battery?: string;             // "4,685 mAh" | "hasta 60 horas"
  chargingSpeed?: string;       // "30W cableado / 20W MagSafe"

  // ── Conectividad ──────────────────────────────────────────────────────────
  connectivity?: string;        // "5G, Wi-Fi 7, Bluetooth 5.3, NFC"
  gps?: string;                 // "GPS de doble frecuencia L1 + L5"
  simCard?: string;             // "Nano SIM + eSIM"
  ports?: string;               // "2× USB-C Thunderbolt 4, HDMI, SD"
  audioOutput?: string;         // "60W" | "Dolby Atmos"
  vrSupport?: string;           // "PlayStation VR2"

  // ── SO y software ─────────────────────────────────────────────────────────
  os?: string;                  // "iOS 18" | "Android 15 + One UI 7"
  smartOS?: string;             // para TVs: "Tizen 8.0" | "webOS 24"

  // ── Sensores (smartwatches) ───────────────────────────────────────────────
  sensors?: string;             // "Frecuencia cardiaca, ECG, SpO2, ..."
  emergencySOS?: string;        // "Sí"
  crashDetection?: string;      // "Sí"
  altimeter?: string;           // "Sí"
  compass?: string;             // "Sí"
  spen?: string;                // "Incluido" (Samsung Ultra)

  // ── Físico ────────────────────────────────────────────────────────────────
  dimensions?: string;          // "163.0 × 77.6 × 8.3 mm"
  weight?: string;              // "227 g"
  waterResistance?: string;     // "IP68" | "100m (EN 13319)"
  body?: string;                // "Titanio grado 5" | "Aluminio aeroespacial"

  // ── Características adicionales ───────────────────────────────────────────
  wirelessCharging?: string;    // "Sí — MagSafe 20W"
  nfc?: string;                 // "Sí"
  keyboard?: string;            // "Retroiluminado Magic Keyboard"
  webcam?: string;              // "1080p FaceTime HD"
  optical?: string;             // "Lector de disco" | "Digital"

  // ── Laptops / Gaming extra ────────────────────────────────────────────────
  coolingSystem?: string;       // "Liquid Metal + Triple Fan"
  displayTech?: string;         // "Mini-LED" | "IPS"

  // Índice flexible: permite campos futuros sin romper el tipo.
  // IMPORTANTE: todos los valores deben ser string (nunca boolean/number) en el JSON.
  [key: string]: string | undefined;
}

export interface Product {
  id: string | number;
  name: string;
  slug?: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  subcategory?: string;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  isTrending?: boolean;
  isOnSale?: boolean;
  discount?: number;
  color?: string;
  specs: ProductSpec;
  badges?: string[];
  description?: string;
  discountPercent?: number;
  avatar?: string;
  createdAt?: string;
}

export type Category =
  | "smartphones"
  | "laptops"
  | "tablets"
  | "consoles"
  | "televisions"
  | "smartwatches";

export interface CategoryItem {
  id: Category;
  label: string;
  slug: string;
}

// =========================
// CATEGORY DROPDOWNS
// =========================

export interface CategoryBrand {
  label: string;
  items: string[];
}

export interface CategoryFilter {
  label: string;
  items: string[];
}

export interface CategoryAccessory {
  label: string;
  items: string[];
}

export interface CategoryExtra {
  label: string;
  items: string[];
}

export interface CategoryDropdownData {
  id: string;
  label: string;
  icon: string;
  sections: {
    main: { title: string; filters: CategoryFilter[] };
    accessories: { title: string; items: CategoryAccessory[] };
    more: { title: string; label: string; items: string[] };
  };
}

export interface NavCategory {
  id: string;
  label: string;
}

// =========================
// CART
// =========================

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

// =========================
// HERO
// =========================

export interface HeroBanner {
  id: number;
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  backgroundGradient: string;
}

// =========================
// SEARCH & FILTERS
// =========================

export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';

export interface SearchFilters {
  query: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  sortBy?: SortOption;
}

export interface PriceRange {
  label: string;
  min: number;
  max: number | null;
}

export interface SearchResult {
  products: Product[];
  total: number;
  filters: {
    brands: { name: string; count: number }[];
    colors: { name: string; count: number }[];
    priceRanges: (PriceRange & { count: number })[];
  };
}

export type ActiveFilters = SearchFilters;