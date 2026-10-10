import React from 'react';
import type { PostCategory } from '../../types';

interface CategoryFilterProps {
  categories: PostCategory[];
  activeCategory: PostCategory;
  onSelectCategory: (category: PostCategory) => void;
  className?: string;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none ${className}`}>
      {categories.map((cat) => {
        const isActive = activeCategory === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${
              isActive
                ? 'bg-rose-500 text-white border border-rose-500 shadow-rose-glow font-bold'
                : 'bg-white text-plum-700 hover:text-plum-900 hover:bg-plum-100/80 border border-plum-200 shadow-plum-sm'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
