// src/components/CategoryDropdown/CategoryDropdown.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { type CategoryDropdownData } from '../../types';
import styles from './CategoryDropdown.module.css';

interface CategoryDropdownProps {
  category: CategoryDropdownData;
  onItemClick?: () => void;
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({ category, onItemClick }) => {
  const navigate = useNavigate();
  const { sections } = category;

  const handleBrandOrFilter = (item: string, filterLabel: string) => {
    onItemClick?.();
    // Si el filtro es de marcas → buscar por brand
    const isBrandFilter = filterLabel.toLowerCase().includes('brand');
    if (isBrandFilter) {
      navigate(`/search?brand=${encodeURIComponent(item)}`);
    } else {
      // Otros filtros (storage, RAM, etc.) → búsqueda general
      navigate(`/search?q=${encodeURIComponent(item)}`);
    }
  };

  const handleCategoryItem = (item: string) => {
    onItemClick?.();
    navigate(`/search?q=${encodeURIComponent(item)}`);
  };

  return (
    <div className={styles.dropdown}>
      {/* Main Section */}
      <div className={styles.column}>
        <div className={styles.columnHeader}>
          <span className={styles.columnIcon}>{getCategoryIcon(category.icon)}</span>
          <h3 className={styles.columnTitle}>{sections.main.title}</h3>
        </div>
        <div className={styles.divider}/>
        {sections.main.filters.map(filter => (
          <div key={filter.label} className={styles.filterGroup}>
            <p className={styles.filterLabel}>{filter.label}</p>
            <p className={styles.filterItems}>
              {filter.items.map((item, i) => (
                <React.Fragment key={item}>
                  <span
                    className={styles.filterItem}
                    onClick={() => handleBrandOrFilter(item, filter.label)}
                  >
                    {item}
                  </span>
                  {i < filter.items.length - 1 && (
                    <span className={styles.separator}> | </span>
                  )}
                </React.Fragment>
              ))}
            </p>
          </div>
        ))}
      </div>

      {/* Accessories Section */}
      <div className={styles.column}>
        <div className={styles.columnHeader}>
          <span className={styles.columnIcon}>🖥️</span>
          <h3 className={styles.columnTitle}>{sections.accessories.title}</h3>
        </div>
        <div className={styles.divider}/>
        {sections.accessories.items.map(acc => (
          <div key={acc.label} className={styles.filterGroup}>
            <p className={styles.filterLabel}>{acc.label}</p>
            {acc.items.map(item => (
              <p key={item} className={styles.accItem} onClick={() => handleCategoryItem(item)}>
                {item}
              </p>
            ))}
          </div>
        ))}
      </div>

      {/* More Section */}
      <div className={styles.column}>
        <div className={styles.columnHeader}>
          <span className={styles.columnIcon}>🔍</span>
          <h3 className={styles.columnTitle}>{sections.more.title}</h3>
        </div>
        <div className={styles.divider}/>
        <div className={styles.filterGroup}>
          <p className={styles.filterLabel}>{sections.more.label}</p>
          {sections.more.items.map(item => (
            <p key={item} className={styles.accItem} onClick={() => handleCategoryItem(item)}>
              {item}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

const getCategoryIcon = (icon: string): string => {
  const icons: Record<string, string> = {
    smartphone: '📱', laptop: '💻', tablet: '📲',
    gamepad: '🎮', tv: '📺', watch: '⌚',
    trending: '📈', tag: '🏷️',
  };
  return icons[icon] ?? '🔧';
};

export default CategoryDropdown;