import React from 'react';
import {
  AirVent,
  BrickWall,
  DoorOpen,
  Droplets,
  Flame,
  Hammer,
  HardHat,
  Home,
  LayoutGrid,
  PaintRoller,
  Sparkles,
  Sun,
  Trees,
  Users,
  Zap,
} from 'lucide-react';
import { Category } from '../types';

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  cat_construction: BrickWall,
  cat_renovation: Home,
  cat_ceiling: LayoutGrid,
  cat_electrical: Zap,
  cat_plumbing: Droplets,
  cat_painting: PaintRoller,
  cat_carpentry: Hammer,
  cat_tiles: LayoutGrid,
  cat_welding: Flame,
  cat_ac: AirVent,
  cat_labour: Users,
  cat_cleaning: Sparkles,
  cat_glass: DoorOpen,
  cat_gardening: Trees,
  cat_solar: Sun,
};

function renderSceneDecoration(categoryId: string, accent: string) {
  switch (categoryId) {
    case 'cat_construction':
      return (
        <g opacity="0.22" fill={accent}>
          <rect x="14" y="20" width="34" height="14" rx="3" />
          <rect x="52" y="20" width="34" height="14" rx="3" />
          <rect x="30" y="38" width="34" height="14" rx="3" />
          <rect x="176" y="72" width="44" height="16" rx="3" />
          <rect x="158" y="52" width="44" height="16" rx="3" />
        </g>
      );
    case 'cat_electrical':
      return (
        <g opacity="0.22" stroke={accent} strokeWidth="3" fill="none">
          <path d="M20 30 H66 L82 48" />
          <path d="M168 32 H214" />
          <circle cx="20" cy="30" r="5" fill={accent} />
          <circle cx="168" cy="32" r="5" fill={accent} />
          <path d="M190 58 L178 78 H194 L182 96" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case 'cat_plumbing':
      return (
        <g opacity="0.22" stroke={accent} strokeWidth="6" fill="none" strokeLinecap="round">
          <path d="M12 34 H58 V74" />
          <path d="M180 28 V68 H228" />
          <circle cx="58" cy="88" r="5" fill={accent} stroke="none" />
          <circle cx="180" cy="86" r="6" fill={accent} stroke="none" />
        </g>
      );
    case 'cat_painting':
      return (
        <g opacity="0.22" fill={accent}>
          <rect x="16" y="14" width="22" height="74" rx="11" />
          <rect x="44" y="26" width="22" height="58" rx="11" />
          <rect x="184" y="18" width="24" height="70" rx="12" />
        </g>
      );
    case 'cat_solar':
      return (
        <g opacity="0.24" stroke={accent} strokeWidth="2.5" fill="none">
          <circle cx="42" cy="32" r="14" fill={accent} fillOpacity="0.3" />
          <rect x="162" y="42" width="58" height="40" rx="4" transform="skewX(-12)" />
          <line x1="176" y1="42" x2="167" y2="82" />
          <line x1="196" y1="42" x2="187" y2="82" />
          <line x1="158" y1="62" x2="216" y2="62" />
        </g>
      );
    case 'cat_tiles':
      return (
        <g opacity="0.18" stroke={accent} strokeWidth="2" fill="none">
          <rect x="14" y="16" width="26" height="26" rx="2" />
          <rect x="44" y="16" width="26" height="26" rx="2" />
          <rect x="14" y="46" width="26" height="26" rx="2" />
          <rect x="174" y="46" width="26" height="26" rx="2" />
          <rect x="204" y="46" width="26" height="26" rx="2" />
        </g>
      );
    default:
      return (
        <g opacity="0.18" fill={accent}>
          <circle cx="34" cy="28" r="28" />
          <circle cx="206" cy="84" r="34" />
          <path d="M0 92 Q 64 68 124 86 T 240 74 L 240 112 L 0 112 Z" />
        </g>
      );
  }
}

export const CategoryArtwork: React.FC<{ category: Category }> = ({ category }) => {
  const Icon = CATEGORY_ICON_MAP[category.id] || HardHat;

  return (
    <div
      className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-t-xl border-b border-[#E3EAF3]"
      style={{ backgroundColor: category.accentBg }}
    >
      <svg
        viewBox="0 0 240 112"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {renderSceneDecoration(category.id, category.accentText)}
      </svg>

      <div
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E3EAF3] bg-white shadow-sm"
        style={{ color: category.accentText }}
      >
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
    </div>
  );
};
