// src/components/AvatarPickerModal/AvatarPickerModal.tsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import styles from './AvatarPickerModal.module.css';

const AVATARS = [
  {
    id: 'sparky',
    name: 'Sparky',
    svg: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="24" width="40" height="34" rx="10" fill="#4A90D9"/>
        <rect x="28" y="14" width="8" height="12" rx="4" fill="#4A90D9"/>
        <rect x="44" y="14" width="8" height="12" rx="4" fill="#4A90D9"/>
        <circle cx="32" cy="38" r="5" fill="white"/>
        <circle cx="48" cy="38" r="5" fill="white"/>
        <circle cx="33" cy="39" r="2.5" fill="#1a1a1a"/>
        <circle cx="49" cy="39" r="2.5" fill="#1a1a1a"/>
        <rect x="30" y="48" width="20" height="4" rx="2" fill="white" opacity="0.7"/>
        <rect x="16" y="32" width="6" height="12" rx="3" fill="#4A90D9"/>
        <rect x="58" y="32" width="6" height="12" rx="3" fill="#4A90D9"/>
        <rect x="28" y="56" width="8" height="10" rx="3" fill="#4A90D9"/>
        <rect x="44" y="56" width="8" height="10" rx="3" fill="#4A90D9"/>
        <circle cx="40" cy="20" r="4" fill="#FFD93D"/>
      </svg>
    ),
    bg: '#EBF4FF',
  },
  {
    id: 'bleep',
    name: 'Bleep',
    svg: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="22" width="44" height="36" rx="12" fill="#3DADB8"/>
        <rect x="26" y="12" width="10" height="12" rx="5" fill="#3DADB8"/>
        <rect x="44" y="12" width="10" height="12" rx="5" fill="#3DADB8"/>
        <rect x="29" y="35" width="10" height="10" rx="3" fill="white"/>
        <rect x="41" y="35" width="10" height="10" rx="3" fill="white"/>
        <circle cx="34" cy="40" r="3" fill="#3DADB8"/>
        <circle cx="46" cy="40" r="3" fill="#3DADB8"/>
        <path d="M30 52 Q40 57 50 52" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="14" y="30" width="6" height="14" rx="3" fill="#3DADB8"/>
        <rect x="60" y="30" width="6" height="14" rx="3" fill="#3DADB8"/>
        <rect x="27" y="56" width="9" height="10" rx="3" fill="#3DADB8"/>
        <rect x="44" y="56" width="9" height="10" rx="3" fill="#3DADB8"/>
        <circle cx="40" cy="18" r="5" fill="#FF6B6B"/>
        <circle cx="40" cy="18" r="2" fill="white"/>
      </svg>
    ),
    bg: '#E8F8F9',
  },
  {
    id: 'cosmo',
    name: 'Cosmo',
    svg: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="24" width="40" height="34" rx="8" fill="#F5A623"/>
        <rect x="29" y="14" width="9" height="12" rx="4" fill="#F5A623"/>
        <rect x="42" y="14" width="9" height="12" rx="4" fill="#F5A623"/>
        <circle cx="32" cy="39" r="6" fill="white"/>
        <circle cx="48" cy="39" r="6" fill="white"/>
        <circle cx="32" cy="39" r="3" fill="#F5A623"/>
        <circle cx="48" cy="39" r="3" fill="#F5A623"/>
        <circle cx="33" cy="38" r="1" fill="white"/>
        <circle cx="49" cy="38" r="1" fill="white"/>
        <rect x="31" y="49" width="18" height="3" rx="1.5" fill="white" opacity="0.8"/>
        <rect x="15" y="31" width="7" height="10" rx="3.5" fill="#F5A623"/>
        <rect x="58" y="31" width="7" height="10" rx="3.5" fill="#F5A623"/>
        <rect x="28" y="56" width="9" height="9" rx="3" fill="#F5A623"/>
        <rect x="43" y="56" width="9" height="9" rx="3" fill="#F5A623"/>
        <rect x="34" y="10" width="12" height="6" rx="3" fill="#FFD93D"/>
      </svg>
    ),
    bg: '#FFF8EC',
  },
  {
    id: 'pixel',
    name: 'Pixel',
    svg: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="22" width="40" height="36" rx="6" fill="#9B59B6"/>
        <rect x="28" y="12" width="10" height="12" rx="2" fill="#9B59B6"/>
        <rect x="42" y="12" width="10" height="12" rx="2" fill="#9B59B6"/>
        <rect x="28" y="33" width="10" height="10" rx="2" fill="#E8D5F5"/>
        <rect x="42" y="33" width="10" height="10" rx="2" fill="#E8D5F5"/>
        <rect x="30" y="35" width="6" height="6" rx="1" fill="#9B59B6"/>
        <rect x="44" y="35" width="6" height="6" rx="1" fill="#9B59B6"/>
        <rect x="29" y="49" width="22" height="4" rx="2" fill="#E8D5F5"/>
        <rect x="31" y="50" width="4" height="2" rx="1" fill="#9B59B6"/>
        <rect x="37" y="50" width="4" height="2" rx="1" fill="#9B59B6"/>
        <rect x="43" y="50" width="4" height="2" rx="1" fill="#9B59B6"/>
        <rect x="14" y="30" width="7" height="12" rx="2" fill="#9B59B6"/>
        <rect x="59" y="30" width="7" height="12" rx="2" fill="#9B59B6"/>
        <rect x="27" y="56" width="10" height="10" rx="2" fill="#9B59B6"/>
        <rect x="43" y="56" width="10" height="10" rx="2" fill="#9B59B6"/>
        <circle cx="40" cy="17" r="4" fill="#FFD93D"/>
      </svg>
    ),
    bg: '#F5EEF8',
  },
  {
    id: 'zippy',
    name: 'Zippy',
    svg: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="24" width="44" height="34" rx="14" fill="#2ECC71"/>
        <rect x="27" y="13" width="9" height="13" rx="4.5" fill="#2ECC71"/>
        <rect x="44" y="13" width="9" height="13" rx="4.5" fill="#2ECC71"/>
        <circle cx="32" cy="38" r="6" fill="white"/>
        <circle cx="48" cy="38" r="6" fill="white"/>
        <circle cx="32" cy="38" r="3.5" fill="#27AE60"/>
        <circle cx="48" cy="38" r="3.5" fill="#27AE60"/>
        <circle cx="31" cy="37" r="1.2" fill="white"/>
        <circle cx="47" cy="37" r="1.2" fill="white"/>
        <path d="M31 50 Q40 56 49 50" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <rect x="13" y="31" width="7" height="14" rx="3.5" fill="#2ECC71"/>
        <rect x="60" y="31" width="7" height="14" rx="3.5" fill="#2ECC71"/>
        <rect x="27" y="57" width="10" height="9" rx="4" fill="#2ECC71"/>
        <rect x="43" y="57" width="10" height="9" rx="4" fill="#2ECC71"/>
        <path d="M35 13 L40 8 L45 13" stroke="#FFD93D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="40" cy="7" r="3" fill="#FFD93D"/>
      </svg>
    ),
    bg: '#EAFAF1',
  },
  {
    id: 'nova',
    name: 'Nova',
    svg: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="24" width="40" height="34" rx="10" fill="#E74C3C"/>
        <rect x="28" y="13" width="9" height="13" rx="4" fill="#E74C3C"/>
        <rect x="43" y="13" width="9" height="13" rx="4" fill="#E74C3C"/>
        <ellipse cx="32" cy="38" rx="6" ry="6" fill="white"/>
        <ellipse cx="48" cy="38" rx="6" ry="6" fill="white"/>
        <circle cx="32" cy="38" r="3" fill="#C0392B"/>
        <circle cx="48" cy="38" r="3" fill="#C0392B"/>
        <circle cx="31" cy="37" r="1" fill="white"/>
        <circle cx="47" cy="37" r="1" fill="white"/>
        <rect x="32" y="49" width="16" height="4" rx="2" fill="white" opacity="0.8"/>
        <rect x="14" y="30" width="8" height="14" rx="4" fill="#E74C3C"/>
        <rect x="58" y="30" width="8" height="14" rx="4" fill="#E74C3C"/>
        <rect x="27" y="57" width="10" height="9" rx="4" fill="#E74C3C"/>
        <rect x="43" y="57" width="10" height="9" rx="4" fill="#E74C3C"/>
        <circle cx="40" cy="18" r="5" fill="#FFD93D"/>
        <circle cx="38" cy="17" r="1.5" fill="white"/>
      </svg>
    ),
    bg: '#FDEDEC',
  },
  {
    id: 'glitch',
    name: 'Glitch',
    svg: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="24" width="40" height="34" rx="10" fill="#E67E22"/>
        <rect x="28" y="13" width="9" height="13" rx="3" fill="#E67E22"/>
        <rect x="43" y="13" width="9" height="13" rx="3" fill="#E67E22"/>
        <rect x="27" y="33" width="12" height="10" rx="4" fill="white"/>
        <rect x="41" y="33" width="12" height="10" rx="4" fill="white"/>
        <rect x="29" y="35" width="8" height="6" rx="2" fill="#E67E22"/>
        <rect x="43" y="35" width="8" height="6" rx="2" fill="#E67E22"/>
        <circle cx="33" cy="38" r="2" fill="white"/>
        <circle cx="47" cy="38" r="2" fill="white"/>
        <path d="M30 50 L34 48 L38 52 L42 48 L46 50 L50 50" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="14" y="29" width="7" height="13" rx="3" fill="#E67E22"/>
        <rect x="59" y="29" width="7" height="13" rx="3" fill="#E67E22"/>
        <rect x="27" y="57" width="10" height="9" rx="3" fill="#E67E22"/>
        <rect x="43" y="57" width="10" height="9" rx="3" fill="#E67E22"/>
        <rect x="33" y="9" width="14" height="7" rx="3" fill="#F39C12"/>
      </svg>
    ),
    bg: '#FEF5E7',
  },
  {
    id: 'mochi',
    name: 'Mochi',
    svg: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="24" width="40" height="34" rx="18" fill="#95A5A6"/>
        <rect x="29" y="14" width="8" height="12" rx="4" fill="#95A5A6"/>
        <rect x="43" y="14" width="8" height="12" rx="4" fill="#95A5A6"/>
        <circle cx="32" cy="38" r="6" fill="white"/>
        <circle cx="48" cy="38" r="6" fill="white"/>
        <circle cx="32" cy="38" r="3" fill="#7F8C8D"/>
        <circle cx="48" cy="38" r="3" fill="#7F8C8D"/>
        <circle cx="31" cy="37" r="1" fill="white"/>
        <circle cx="47" cy="37" r="1" fill="white"/>
        <path d="M33 50 Q40 54 47 50" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="14" y="31" width="7" height="12" rx="3.5" fill="#95A5A6"/>
        <rect x="59" y="31" width="7" height="12" rx="3.5" fill="#95A5A6"/>
        <rect x="28" y="57" width="10" height="9" rx="4" fill="#95A5A6"/>
        <rect x="42" y="57" width="10" height="9" rx="4" fill="#95A5A6"/>
        <circle cx="40" cy="19" r="5" fill="#BDC3C7"/>
        <circle cx="38" cy="18" r="2" fill="white" opacity="0.6"/>
      </svg>
    ),
    bg: '#F2F3F4',
  },
];

interface AvatarPickerModalProps {
  currentAvatar?: string;
  onClose: () => void;
  onSaved: (avatarId: string) => void;
}

const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  currentAvatar,
  onClose,
  onSaved,
}) => {
  const [selected, setSelected] = useState<string>(currentAvatar ?? '');
  const [saving, setSaving]     = useState(false);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ avatar_url: selected })
        .eq('id', user.id);
    }
    setSaving(false);
    onSaved(selected);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Choose your avatar</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.grid}>
          {AVATARS.map(av => (
            <button
              key={av.id}
              className={`${styles.avatarCard} ${selected === av.id ? styles.avatarCardSelected : ''}`}
              style={{ '--avatar-bg': av.bg } as React.CSSProperties}
              onClick={() => setSelected(av.id)}
            >
              <div className={styles.avatarSvgWrap}>{av.svg}</div>
              <span className={styles.avatarName}>{av.name}</span>
            </button>
          ))}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={!selected || saving}
          >
            {saving ? <span className={styles.spinner} /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export { AVATARS };
export default AvatarPickerModal;