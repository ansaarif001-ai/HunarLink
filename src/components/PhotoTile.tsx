import React from 'react';
import { Camera } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { PhotoMedia } from '../types';

export interface PhotoTileProps {
  photo: PhotoMedia;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

export const PhotoTile: React.FC<PhotoTileProps> = ({
  photo,
  alt,
  className = 'h-32',
  onClick,
}) => {
  const { t } = useTranslation();

  const content = photo.dataUrl ? (
    <img
      src={photo.dataUrl}
      alt={alt || photo.title}
      loading="lazy"
      referrerPolicy="no-referrer"
      className="h-full w-full object-cover"
    />
  ) : (
    <div
      className="relative flex h-full w-full flex-col justify-between p-3 text-start"
      style={{
        background: photo.palette
          ? `linear-gradient(135deg, ${photo.palette[0]} 0%, ${photo.palette[1]}28 100%)`
          : 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/85 text-[#1769E0] shadow-xs">
          <Camera className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="text-[11px] font-semibold text-[#62748A]">{t('common.demo')}</span>
      </div>
      <span className="line-clamp-2 text-sm font-bold text-[#102A43]">{photo.title}</span>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group relative block w-full overflow-hidden rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769E0] cursor-pointer ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] ${className}`}>
      {content}
    </div>
  );
};
