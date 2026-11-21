import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import {
  Bell,
  Briefcase,
  Camera,
  CheckCheck,
  ChevronRight,
  FileText,
  Hammer,
  HelpCircle,
  Home,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  PlusCircle,
  Search,
  Settings,
  ShieldCheck,
  Tag,
  User,
  UserCheck,
  Wallet,
  Wrench,
  X,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import { SAMPLE_AREAS } from '../data/locations';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedLocationLabel } from '../i18n';
import { UserRole } from '../types';
import { getAlertsForActiveUser } from '../utils/alerts';
import { formatRelativeTime } from '../utils/id';

interface MenuLink {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

const STANDALONE_GUEST_PATHS = ['/', '/login', '/register', '/demo-helper'];

export const MainLayout: React.FC = () => {
  const {
    state,
    dispatch,
    activeCustomer,
    activeWorker,
    isGuestSession,
    unreadAlertsCount,
    unreadChatCount,
    storageError,
  } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const isCustomer = state.activeRole === UserRole.Customer;
  const isWorker = state.activeRole === UserRole.Worker;
  const isGuest = state.activeRole === UserRole.Guest;

  const [bellOpen, setBellOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const bellWrapperRef = useRef<HTMLDivElement | null>(null);
  const profileWrapperRef = useRef<HTMLDivElement | null>(null);
  const lastStorageErrorRef = useRef<string>('');

  // Surface storage errors via Toast without cluttering UI with permanent banners
  useEffect(() => {
    if (storageError && storageError !== lastStorageErrorRef.current) {
      lastStorageErrorRef.current = storageError;
      showToast(storageError, 'error');
    } else if (!storageError) {
      lastStorageErrorRef.current = '';
    }
  }, [storageError, showToast]);

  // Close menus on route change
  useEffect(() => {
    setBellOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  // Outside click / Escape dismissal for Bell & Profile dropdown
  useEffect(() => {
    if (!bellOpen && !profileMenuOpen) return;

    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (bellOpen && bellWrapperRef.current && !bellWrapperRef.current.contains(target)) {
        setBellOpen(false);
      }
      if (
        profileMenuOpen &&
        profileWrapperRef.current &&
        !profileWrapperRef.current.contains(target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setBellOpen(false);
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [bellOpen, profileMenuOpen]);

  // Exactly 4 primary links for Customer
  const customerLinks: MenuLink[] = [
    { to: '/customer', label: t('nav.home'), icon: Home, end: true },
    { to: '/workers', label: t('nav.findWorkers'), icon: Search },
    { to: '/post-request', label: t('nav.postRequest'), icon: PlusCircle },
    { to: '/my-requests', label: t('nav.myRequests'), icon: FileText },
  ];

  // Exactly 4 primary links for Worker
  const workerLinks: MenuLink[] = [
    { to: '/worker', label: t('nav.home'), icon: Home, end: true },
    { to: '/worker/jobs', label: t('nav.jobsNearMe'), icon: Briefcase },
    { to: '/worker/prices', label: t('nav.myPrices'), icon: Tag },
    { to: '/worker/bookings', label: t('nav.myBookings'), icon: FileText },
  ];

  const navLinks = isCustomer ? customerLinks : isWorker ? workerLinks : [];
  const logoHomePath = isCustomer ? '/customer' : isWorker ? '/worker' : '/';
  const profilePath = isWorker ? '/worker/profile' : '/profile';

  const currentAccountName = isCustomer
    ? activeCustomer?.name || t('common.customer')
    : isWorker
      ? (isUrdu ? activeWorker?.nameUr || activeWorker?.name : activeWorker?.name) ||
        t('common.worker')
      : t('common.guest');

  const currentAvatarUrl = isCustomer
    ? activeCustomer?.profilePhotoUrl
    : isWorker
      ? activeWorker?.profilePhotoUrl
      : undefined;

  const currentRoleChip = isCustomer
    ? t('common.customer')
    : isWorker
      ? activeWorker?.workerType === 'Contractor' || activeWorker?.workerType === 'Team'
        ? t('common.contractor')
        : t('common.worker')
      : t('common.guest');

  const currentAreaLabel = isCustomer
    ? getLocalizedLocationLabel(
        state.selectedLocation.area,
        state.selectedLocation.city,
        SAMPLE_AREAS,
        lang
      )
    : isWorker && activeWorker
      ? getLocalizedLocationLabel(activeWorker.area, activeWorker.city, SAMPLE_AREAS, lang)
      : '';

  const latest5Alerts = useMemo(() => {
    return getAlertsForActiveUser(
      state.notifications,
      state.activeRole,
      state.activeCustomerId,
      state.activeWorkerId,
      state.alertPreferences,
      'all'
    ).slice(0, 5);
  }, [
    state.notifications,
    state.activeRole,
    state.activeCustomerId,
    state.activeWorkerId,
    state.alertPreferences,
  ]);

  const handleConfirmLogout = () => {
    setLogoutConfirmOpen(false);
    setProfileMenuOpen(false);
    dispatch({ type: 'LOG_OUT' });
    navigate('/', { replace: true });
  };

  // Standalone full-screen guest routes (First Screen, Login, Register, Demo Tools)
  if (isGuest && STANDALONE_GUEST_PATHS.includes(location.pathname)) {
    return (
      <div key={location.pathname} className="[overflow-anchor:none]">
        <Outlet />
      </div>
    );
  }

  // Public chrome for guest routes (/about, /safety, /help, 404)
  if (isGuest) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F6FAFF] text-[#172B4D]">
        <header className="sticky top-0 z-30 border-b border-[#E3EAF3] bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link
              to="/"
              className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769E0]"
            >
              <BrandLogo size="sm" />
            </Link>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <LanguageSwitch compact />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/login')}
              >
                <UserCheck className="h-4 w-4 text-[#1769E0]" aria-hidden="true" />
                <span>{t('auth.signInBtn')}</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/register')}
              >
                <Hammer className="h-4 w-4" aria-hidden="true" />
                <span>{t('auth.createAccountBtn')}</span>
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 [overflow-anchor:none]">
          <div key={location.pathname} className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-[#E3EAF3] bg-white py-8 text-sm text-[#62748A]">
          <div className="mx-auto max-w-[1200px] space-y-4 px-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-5 text-base font-semibold">
                <Link to="/about" className="text-[#172B4D] hover:text-[#1769E0]">
                  {t('publicHome.footerAbout')}
                </Link>
                <Link to="/safety" className="text-[#172B4D] hover:text-[#1769E0]">
                  {t('publicHome.footerSafety')}
                </Link>
                <Link to="/help" className="text-[#172B4D] hover:text-[#1769E0]">
                  {t('publicHome.footerHelp')}
                </Link>
                <Link
                  to="/demo-helper"
                  className="inline-flex items-center gap-1.5 text-[#1769E0] hover:underline"
                >
                  <Wrench className="h-4 w-4" aria-hidden="true" />
                  <span>{t('publicHome.footerDemo')}</span>
                </Link>
              </div>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-[#1769E0]" aria-hidden="true" />
                <span>{t('publicHome.footerContact')}</span>
              </span>
            </div>
            <p className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#1769E0]" aria-hidden="true" />
              <span>{t('home.demoFooterNote')}</span>
            </p>
          </div>
        </footer>
      </div>
    );
  }

  const profileMenuItems = (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => {
          setProfileMenuOpen(false);
          navigate(profilePath);
        }}
        className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl px-3 text-start text-base font-semibold text-[#102A43] hover:bg-[#EFF6FF] hover:text-[#1769E0] cursor-pointer"
      >
        <span className="flex items-center gap-3">
          <User className="h-5 w-5 text-[#1769E0]" aria-hidden="true" />
          <span>{t('profileMenu.myProfile')}</span>
        </span>
        <ChevronRight className="h-4 w-4 text-[#62748A] rtl:rotate-180" aria-hidden="true" />
      </button>

      {isWorker && (
        <>
          <button
            type="button"
            onClick={() => {
              setProfileMenuOpen(false);
              navigate('/worker/work');
            }}
            className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl px-3 text-start text-base font-semibold text-[#102A43] hover:bg-[#EFF6FF] hover:text-[#1769E0] cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <Camera className="h-5 w-5 text-[#1769E0]" aria-hidden="true" />
              <span>{t('profileMenu.myWork')}</span>
            </span>
            <ChevronRight className="h-4 w-4 text-[#62748A] rtl:rotate-180" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => {
              setProfileMenuOpen(false);
              navigate('/worker/earnings');
            }}
            className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl px-3 text-start text-base font-semibold text-[#102A43] hover:bg-[#EFF6FF] hover:text-[#1769E0] cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-[#1769E0]" aria-hidden="true" />
              <span>{t('profileMenu.earnings')}</span>
            </span>
            <ChevronRight className="h-4 w-4 text-[#62748A] rtl:rotate-180" aria-hidden="true" />
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => {
          setProfileMenuOpen(false);
          navigate('/settings');
        }}
        className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl px-3 text-start text-base font-semibold text-[#102A43] hover:bg-[#EFF6FF] hover:text-[#1769E0] cursor-pointer"
      >
        <span className="flex items-center gap-3">
          <Settings className="h-5 w-5 text-[#1769E0]" aria-hidden="true" />
          <span>{t('profileMenu.settings')}</span>
        </span>
        <ChevronRight className="h-4 w-4 text-[#62748A] rtl:rotate-180" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => {
          setProfileMenuOpen(false);
          navigate('/help');
        }}
        className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl px-3 text-start text-base font-semibold text-[#102A43] hover:bg-[#EFF6FF] hover:text-[#1769E0] cursor-pointer"
      >
        <span className="flex items-center gap-3">
          <HelpCircle className="h-5 w-5 text-[#1769E0]" aria-hidden="true" />
          <span>{t('profileMenu.helpReport')}</span>
        </span>
        <ChevronRight className="h-4 w-4 text-[#62748A] rtl:rotate-180" aria-hidden="true" />
      </button>

      <div className="my-2 border-t border-[#E3EAF3]" />

      <button
        type="button"
        onClick={() => {
          setProfileMenuOpen(false);
          setLogoutConfirmOpen(true);
        }}
        className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 text-start text-base font-bold text-[#D64545] hover:bg-[#FEF2F2] cursor-pointer"
      >
        <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{isGuestSession ? t('auth.exitDemo') : t('profileMenu.logOut')}</span>
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-base text-[#172B4D]">
      {/* Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-[#E3EAF3] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-2 px-3 sm:px-5 lg:px-6">
          {/* Left: Brand Logo */}
          <Link
            to={logoHomePath}
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769E0]"
          >
            <BrandLogo size="sm" />
          </Link>

          {/* Center: Exactly 4 Always-Visible Role Navigation Buttons (Desktop & Tablet md+) */}
          <nav
            aria-label={t('nav.mainMenu')}
            className="hidden md:flex items-center gap-0.5 lg:gap-1.5"
          >
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `relative inline-flex min-h-[48px] items-center gap-1.5 rounded-xl px-2 lg:px-3.5 text-sm lg:text-base font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769E0] ${
                      isActive
                        ? 'bg-[#EFF6FF] text-[#1769E0]'
                        : 'text-[#172B4D] hover:bg-[#F8FAFC] hover:text-[#1769E0]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className="hidden xl:inline-block h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-2.5 bottom-0.5 h-0.5 rounded-full bg-[#1769E0]"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right: Guest chip (if demo) + Chat icon + Alerts bell + Language Switch (md+) + Profile Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isGuestSession && (
              <span className="hidden sm:inline-flex items-center rounded-lg border border-[#93C5FD] bg-[#EFF6FF] px-2.5 py-1 text-xs font-extrabold text-[#1769E0]">
                {t('auth.guestChip')}
              </span>
            )}
            {/* Chat Icon Button */}
            <Link
              to="/chat"
              aria-label={t('nav.chat')}
              title={t('nav.chat')}
              className={`relative inline-flex h-10 w-10 lg:h-11 lg:w-11 items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769E0] ${
                location.pathname.startsWith('/chat')
                  ? 'border-[#93C5FD] bg-[#EFF6FF] text-[#1769E0]'
                  : 'border-[#E3EAF3] bg-white text-[#172B4D] hover:border-[#1769E0] hover:text-[#1769E0]'
              }`}
            >
              <MessageSquare className="h-5 w-5" aria-hidden="true" />
              {unreadChatCount > 0 && (
                <span
                  aria-label={t('nav.unreadCount', { n: unreadChatCount })}
                  className="absolute -end-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1769E0] px-1 text-[11px] font-extrabold text-white tabular-nums"
                >
                  {unreadChatCount}
                </span>
              )}
            </Link>

            {/* Alerts Bell Dropdown */}
            <div ref={bellWrapperRef} className="relative">
              <button
                type="button"
                aria-label={t('nav.alerts')}
                title={t('nav.alerts')}
                aria-expanded={bellOpen}
                aria-haspopup="menu"
                onClick={() => {
                  setBellOpen((o) => !o);
                  setProfileMenuOpen(false);
                }}
                className={`relative inline-flex h-10 w-10 lg:h-11 lg:w-11 items-center justify-center rounded-xl border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769E0] ${
                  bellOpen || location.pathname === '/alerts'
                    ? 'border-[#93C5FD] bg-[#EFF6FF] text-[#1769E0]'
                    : 'border-[#E3EAF3] bg-white text-[#172B4D] hover:border-[#1769E0] hover:text-[#1769E0]'
                }`}
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadAlertsCount > 0 && (
                  <span
                    aria-label={t('nav.unreadAlertsCount', { n: unreadAlertsCount })}
                    className="absolute -end-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#D64545] px-1 text-[11px] font-extrabold text-white tabular-nums"
                  >
                    {unreadAlertsCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div
                  role="menu"
                  aria-label={t('alerts.title')}
                  className="absolute end-0 mt-2 w-80 max-w-[92vw] rounded-2xl border border-[#CBD5E1] bg-white p-3 shadow-[0_12px_32px_rgba(16,42,67,0.16)] z-50"
                >
                  <div className="flex items-center justify-between border-b border-[#E3EAF3] pb-2">
                    <span className="text-base font-extrabold text-[#102A43]">
                      {t('alerts.title')}
                    </span>
                    {unreadAlertsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'MARK_ALL_ALERTS_READ' })}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#1769E0] hover:underline cursor-pointer"
                      >
                        <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t('alerts.markAllRead')}</span>
                      </button>
                    )}
                  </div>

                  <div className="mt-2 space-y-1.5 max-h-72 overflow-y-auto">
                    {latest5Alerts.length === 0 ? (
                      <p className="py-5 text-center text-sm text-[#62748A]">
                        {t('alerts.emptyDropdown')}
                      </p>
                    ) : (
                      latest5Alerts.map((alert) => {
                        const title = isUrdu && alert.titleUr ? alert.titleUr : alert.title;
                        const body = isUrdu && alert.bodyUr ? alert.bodyUr : alert.body;
                        return (
                          <button
                            key={alert.id}
                            type="button"
                            onClick={() => {
                              dispatch({ type: 'MARK_ALERT_READ', alertId: alert.id });
                              setBellOpen(false);
                              if (alert.link) navigate(alert.link);
                            }}
                            className={`flex w-full items-start gap-2 rounded-xl p-2.5 text-start transition-colors cursor-pointer ${
                              alert.read ? 'bg-white hover:bg-[#F8FAFC]' : 'bg-[#EFF6FF]'
                            }`}
                          >
                            {!alert.read && (
                              <span
                                aria-hidden="true"
                                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#D64545]"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-[#102A43]">{title}</p>
                              <p className="line-clamp-2 text-xs text-[#62748A]">{body}</p>
                              <p className="mt-0.5 text-[11px] text-[#62748A]">
                                {formatRelativeTime(alert.createdAt, lang)}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-2 border-t border-[#E3EAF3] pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBellOpen(false);
                        navigate('/alerts');
                      }}
                      className="min-h-[48px] w-full rounded-xl bg-[#EFF6FF] text-sm font-bold text-[#1769E0] hover:bg-[#DCEBFF] cursor-pointer"
                    >
                      {t('alerts.seeAll')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Language Switch on Tablet & Desktop */}
            <div className="hidden md:block">
              <LanguageSwitch compact />
            </div>

            {/* Profile Avatar Button + Dropdown (Desktop/Tablet) / Bottom Sheet (Phone) */}
            <div ref={profileWrapperRef} className="relative">
              <button
                type="button"
                aria-label={t('profileMenu.openMenuAria')}
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
                onClick={() => {
                  setProfileMenuOpen((o) => !o);
                  setBellOpen(false);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full ring-offset-2 transition-shadow hover:ring-2 hover:ring-[#93C5FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769E0] cursor-pointer"
              >
                <Avatar name={currentAccountName} src={currentAvatarUrl} size="md" />
              </button>

              {/* Desktop / Tablet Anchored Dropdown */}
              {profileMenuOpen && (
                <div
                  role="menu"
                  aria-label={t('profileMenu.openMenuAria')}
                  className="hidden md:block absolute end-0 mt-2 w-72 rounded-2xl border border-[#CBD5E1] bg-white p-3 shadow-[0_14px_36px_rgba(16,42,67,0.16)] z-50"
                >
                  <div className="flex items-center gap-3 border-b border-[#E3EAF3] pb-3 mb-2">
                    <Avatar name={currentAccountName} src={currentAvatarUrl} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-extrabold text-[#102A43]">
                        {currentAccountName}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge tone="primary">{currentRoleChip}</Badge>
                        {isGuestSession && <Badge tone="primary">{t('auth.guestChip')}</Badge>}
                      </div>
                      {isGuestSession && (
                        <p className="mt-1.5 text-xs font-medium text-[#62748A]">
                          {t('auth.guestBannerLine')}
                        </p>
                      )}
                      {currentAreaLabel && (
                        <p className="mt-1 flex items-center gap-1 truncate text-xs text-[#62748A]">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#1769E0]" aria-hidden="true" />
                          <span className="truncate">{currentAreaLabel}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  {profileMenuItems}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Phone Profile Bottom Sheet */}
      {profileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-[#102A43]/40 md:hidden"
          onClick={() => setProfileMenuOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('profileMenu.openMenuAria')}
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-3xl border-t border-[#E3EAF3] bg-white px-5 pb-7 pt-3 shadow-2xl"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#CBD5E1]" aria-hidden="true" />

            <div className="flex items-start justify-between gap-3 border-b border-[#E3EAF3] pb-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={currentAccountName} src={currentAvatarUrl} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-lg font-extrabold text-[#102A43]">
                    {currentAccountName}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge tone="primary">{currentRoleChip}</Badge>
                    {isGuestSession && <Badge tone="primary">{t('auth.guestChip')}</Badge>}
                  </div>
                  {isGuestSession && (
                    <p className="mt-1.5 text-xs font-medium text-[#62748A]">
                      {t('auth.guestBannerLine')}
                    </p>
                  )}
                  {currentAreaLabel && (
                    <p className="mt-1 flex items-center gap-1 truncate text-sm text-[#62748A]">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#1769E0]" aria-hidden="true" />
                      <span className="truncate">{currentAreaLabel}</span>
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfileMenuOpen(false)}
                aria-label={t('app.close')}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#62748A] hover:bg-[#F1F5F9] cursor-pointer"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mb-3 flex items-center justify-between rounded-xl bg-[#F8FAFC] px-3 py-2">
              <span className="text-sm font-bold text-[#102A43]">
                {t('settings.languageTitle')}
              </span>
              <LanguageSwitch compact />
            </div>

            {profileMenuItems}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 bg-[#F8FAFC] pb-24 md:pb-12 [overflow-anchor:none]">
        <div key={location.pathname} className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-[#E3EAF3] bg-white py-8 pb-24 text-base text-[#62748A] md:pb-8">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6">
          <div className="space-y-1">
            <div className="font-display font-bold text-[#102A43]">{t('app.name')}</div>
            <p className="text-sm text-[#62748A]">{t('app.footerNote')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-sm font-semibold">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-[#172B4D] hover:text-[#1769E0]"
              >
                {item.label}
              </Link>
            ))}
            <Link to="/about" className="text-[#172B4D] hover:text-[#1769E0]">
              {t('publicHome.footerAbout')}
            </Link>
            <Link to="/safety" className="text-[#172B4D] hover:text-[#1769E0]">
              {t('publicHome.footerSafety')}
            </Link>
            <Link to="/settings" className="text-[#172B4D] hover:text-[#1769E0]">
              {t('profileMenu.settings')}
            </Link>
            <Link to="/help" className="text-[#172B4D] hover:text-[#1769E0]">
              {t('profileMenu.helpReport')}
            </Link>
          </div>
        </div>
      </footer>

      {/* Phone Bottom Tab Bar (4 Main Role Buttons + Profile = 5 Tabs, Icons + Words) */}
      <nav
        aria-label={t('nav.bottomNav')}
        className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-5 border-t border-[#E3EAF3] bg-white md:hidden"
      >
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-semibold ${
                  isActive ? 'text-[#1769E0]' : 'text-[#62748A]'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="max-w-full truncate">{item.label}</span>
            </NavLink>
          );
        })}

        <NavLink
          to={profilePath}
          className={({ isActive }) =>
            `relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-semibold ${
              isActive ? 'text-[#1769E0]' : 'text-[#62748A]'
            }`
          }
        >
          <User className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="max-w-full truncate">{t('nav.profile')}</span>
        </NavLink>
      </nav>

      {/* Log Out Confirmation Dialog */}
      <ConfirmDialog
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
        title={t('profileMenu.logOutConfirmTitle')}
        message={t('profileMenu.logOutConfirmMsg')}
        confirmLabel={t('profileMenu.logOutConfirmYes')}
        cancelLabel={t('app.cancel')}
        tone="danger"
      />
    </div>
  );
};
