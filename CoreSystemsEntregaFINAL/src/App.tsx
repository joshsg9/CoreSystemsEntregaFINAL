// src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider }        from './context/CartContext';
import { FavoritesProvider }   from './context/FavoritesContext';
import { ChatProvider }        from './context/ChatContext';
import { useChat }             from './context/ChatContext';
import LoginPage               from './pages/Login/LoginPage';
import AuthCallbackPage        from './pages/AuthCallback/AuthCallbackPage';
import Home                    from './pages/Home/Home';
import SearchResultsPage       from './pages/SearchResultsPage/SearchResultsPage';
import ProductDetailPage       from './pages/ProductDetailPage/ProductDetailPage';
import SellerRegister          from './pages/SellerRegister/SellerRegister';
import SellerHome              from './pages/SellerHome/SellerHome';
import SellerAddProduct        from './pages/SellerAddProduct/SellerAddProduct';
import Navbar                  from './components/Navbar/Navbar';
import SellerChatWidget        from './components/SellerChatWidget/SellerChatWidget';
import ChatWidget              from './components/ChatWidget/ChatWidget';
import { getCurrentUser }      from './services/authService';
import { supabase }            from './lib/supabaseClient';
import type { User }           from './types';

interface AppLayoutProps {
  onLogout: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ onLogout }) => {
  const { currentUserRole } = useChat();

  return (
    <>
      <Navbar onLogout={onLogout} />
      <Routes>
        <Route path="/"                  element={<Home />} />
        <Route path="/search"            element={<SearchResultsPage />} />
        <Route path="/product/:slugOrId" element={<ProductDetailPage />} />
        <Route path="/seller/register"   element={<SellerRegister />} />
        <Route path="*"                  element={<Navigate to="/" replace />} />
      </Routes>

      {currentUserRole === 'seller' && <SellerChatWidget />}
      {currentUserRole === 'buyer'  && <ChatWidget />}
    </>
  );
};

const App: React.FC = () => {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getCurrentUser().then(u => {
      if (mounted) {
        setUser(u);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const u = await getCurrentUser();
        if (mounted) setUser(u);
      } else if (event === 'SIGNED_OUT') {
        if (mounted) setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: 36, height: 36,
        border: '3px solid #e5e5e5',
        borderTop: '3px solid #1a1a1a',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const handleLogout = () => setUser(null);

  return (
    <BrowserRouter>
      <CartProvider>
        <FavoritesProvider>
          <ChatProvider>
            <Routes>
              <Route
                path="/auth/callback"
                element={<AuthCallbackPage onSuccess={setUser} />}
              />

              <Route
                path="/seller/home"
                element={user ? <SellerHome /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/seller/add-product"
                element={user ? <SellerAddProduct /> : <Navigate to="/login" replace />}
              />

              <Route
                path="/login"
                element={user ? <Navigate to="/" replace /> : <LoginPage />}
              />

              <Route
                path="*"
                element={
                  user
                    ? <AppLayout onLogout={handleLogout} />
                    : <LoginPage />
                }
              />
            </Routes>
          </ChatProvider>
        </FavoritesProvider>
      </CartProvider>
    </BrowserRouter>
  );
};

export default App;