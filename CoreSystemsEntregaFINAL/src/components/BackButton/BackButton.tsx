// src/components/BackButton/BackButton.tsx
import React from 'react';
import { useGoBack } from '../../hooks/useGoBack';

interface Props {
  label?: string;
  fallback?: string;
}

const BackButton: React.FC<Props> = ({ label = 'Volver', fallback = '/' }) => {
  const goBack = useGoBack(fallback);
  return (
    <button onClick={goBack} style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.88rem',
      color: '#555',
      padding: '6px 0',
      transition: 'color 0.15s',
    }}
    onMouseEnter={e => (e.currentTarget.style.color = '#0068ff')}
    onMouseLeave={e => (e.currentTarget.style.color = '#555')}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      {label}
    </button>
  );
};

export default BackButton;