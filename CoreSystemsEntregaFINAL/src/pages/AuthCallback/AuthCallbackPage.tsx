// src/pages/AuthCallback/AuthCallbackPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleAuthCallback } from '../../services/authService';
import type { User } from '../../types';

interface Props {
  onSuccess: (user: User) => void;
}

const AuthCallbackPage: React.FC<Props> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    handleAuthCallback().then(result => {
      if (result.success && result.user) {
        onSuccess(result.user);
        navigate('/', { replace: true });
      } else {
        setErrorMsg(result.error ?? 'No se pudo verificar la sesión.');
        setStatus('error');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      fontFamily: 'sans-serif',
    }}>
      {status === 'loading' ? (
        <>
          <div style={{
            width: 40, height: 40,
            border: '3px solid #e5e5e5',
            borderTop: '3px solid #1a1a1a',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}/>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#666', fontSize: 15 }}>Verificando sesión...</p>
        </>
      ) : (
        <>
          <p style={{ fontSize: 18 }}>❌ {errorMsg}</p>
          <p style={{ color: '#999', fontSize: 14 }}>Redirigiendo al login...</p>
        </>
      )}
    </div>
  );
};

export default AuthCallbackPage;