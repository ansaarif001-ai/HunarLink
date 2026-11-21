import React from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedCategoryName } from '../i18n';
import { Category } from '../types';
import { CategoryArtwork } from './CategoryArtwork';

export interface CategoryCardProps {
  category: Category;
  workerCount?: number;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, workerCount }) => {
  const { t, lang } = useTranslation();

  return (
    <Link
      to={`/category/${category.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-[#E3EAF3] bg-white shadow-[0_1px_3px_rgba(16,42,67,0.04)] transition-all duration-150 hover:border-[#1769E0] hover:shadow-[0_6px_16px_rgba(23,105,224,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769E0]"
    >
      <CategoryArtwork category={category} />

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="text-base font-bold leading-snug text-[#102A43] group-hover:text-[#1769E0]">
            {getLocalizedCategoryName(category, lang)}
          </h3>
          <p className="mt-2.5 text-sm leading-relaxed text-[#62748A]">
            {category.subSkills.slice(0, 4).join(' · ')}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#E3EAF3] pt-3 text-sm font-semibold text-[#1769E0]">
          <span>
            {workerCount !== undefined
              ? workerCount === 1
                ? t('common.workerCountOne')
                : t('common.workerCountMany', { n: workerCount })
              : t('custHome.seeAllWorkers')}
          </span>
          <ArrowRight
            className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 rtl:rotate-180"
            aria-hidden="true"
          />
        </div>
      </div>
    </Link>
  );
};
