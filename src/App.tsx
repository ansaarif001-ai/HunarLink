import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes, useParams } from 'react-router';
import { RoleGuard } from './components/RoleGuard';
import { ScrollToTop } from './components/ScrollToTop';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import {
  CardGridSkeleton,
  ListSkeleton,
  PageSkeleton,
  ProfileSkeleton,
} from './components/ui/Skeleton';
import { ToastProvider } from './components/ui/Toast';
import { AppStoreProvider } from './data/store';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { UserRole } from './types';

const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const CustomerHomePage = lazy(() =>
  import('./pages/CustomerHomePage').then((m) => ({ default: m.CustomerHomePage }))
);
const WorkerHomePage = lazy(() =>
  import('./pages/WorkerHomePage').then((m) => ({ default: m.WorkerHomePage }))
);
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const SafetyPage = lazy(() =>
  import('./pages/SafetyPage').then((m) => ({ default: m.SafetyPage }))
);
const HelpPage = lazy(() =>
  import('./pages/HelpPage').then((m) => ({ default: m.HelpPage }))
);
const DemoHelperPage = lazy(() =>
  import('./pages/DemoHelperPage').then((m) => ({ default: m.DemoHelperPage }))
);
const CategoryWorkersPage = lazy(() =>
  import('./pages/CategoryWorkersPage').then((m) => ({ default: m.CategoryWorkersPage }))
);
const WorkerPreviewPlaceholderPage = lazy(() =>
  import('./pages/WorkerPreviewPlaceholderPage').then((m) => ({
    default: m.WorkerPreviewPlaceholderPage,
  }))
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const PostRequestPage = lazy(() =>
  import('./pages/PostRequestPage').then((m) => ({ default: m.PostRequestPage }))
);
const CustomerRequestsPage = lazy(() =>
  import('./pages/CustomerRequestsPage').then((m) => ({ default: m.CustomerRequestsPage }))
);
const CustomerJobDetailPage = lazy(() =>
  import('./pages/CustomerJobDetailPage').then((m) => ({ default: m.CustomerJobDetailPage }))
);
const ChatPage = lazy(() =>
  import('./pages/ChatPage').then((m) => ({ default: m.ChatPage }))
);
const AlertsPage = lazy(() =>
  import('./pages/AlertsPage').then((m) => ({ default: m.AlertsPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const WorkerJobsPage = lazy(() =>
  import('./pages/WorkerJobsPage').then((m) => ({ default: m.WorkerJobsPage }))
);
const WorkerJobDetailPage = lazy(() =>
  import('./pages/WorkerJobDetailPage').then((m) => ({ default: m.WorkerJobDetailPage }))
);
const WorkerMyWorkPage = lazy(() =>
  import('./pages/WorkerMyWorkPage').then((m) => ({ default: m.WorkerMyWorkPage }))
);
const WorkerProfilePage = lazy(() =>
  import('./pages/WorkerProfilePage').then((m) => ({ default: m.WorkerProfilePage }))
);
const WorkerSendPricePage = lazy(() =>
  import('./pages/WorkerSendPricePage').then((m) => ({ default: m.WorkerSendPricePage }))
);
const WorkerPricesPage = lazy(() =>
  import('./pages/WorkerPricesPage').then((m) => ({ default: m.WorkerPricesPage }))
);
const WorkerBookingsPage = lazy(() =>
  import('./pages/WorkerBookingsPage').then((m) => ({ default: m.WorkerBookingsPage }))
);
const WorkerEarningsPage = lazy(() =>
  import('./pages/WorkerEarningsPage').then((m) => ({ default: m.WorkerEarningsPage }))
);
const ComingSoonPage = lazy(() =>
  import('./pages/ComingSoonPage').then((m) => ({ default: m.ComingSoonPage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

const WorkerPublicProfileRoute: React.FC = () => {
  const { workerId } = useParams<{ workerId: string }>();
  return (
    <RoleGuard allowedRole={UserRole.Customer} allowOwnWorkerIdParam={workerId}>
      <Suspense fallback={<ProfileSkeleton />}>
        <WorkerPreviewPlaceholderPage />
      </Suspense>
    </RoleGuard>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppStoreProvider>
        <ToastProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/safety" element={<SafetyPage />} />
                  <Route
                    path="/help"
                    element={
                      <Suspense fallback={<ListSkeleton rows={4} />}>
                        <HelpPage />
                      </Suspense>
                    }
                  />
                  <Route path="/demo-helper" element={<DemoHelperPage />} />

                  {/* Customer Interface (Strict Role Guard) */}
                  <Route
                    path="/customer"
                    element={
                      <RoleGuard allowedRole={UserRole.Customer}>
                        <CustomerHomePage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/category/:slug"
                    element={
                      <RoleGuard allowedRole={UserRole.Customer}>
                        <Suspense fallback={<CardGridSkeleton cards={6} />}>
                          <CategoryWorkersPage />
                        </Suspense>
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/workers"
                    element={
                      <RoleGuard allowedRole={UserRole.Customer}>
                        <Suspense fallback={<CardGridSkeleton cards={6} />}>
                          <CategoryWorkersPage />
                        </Suspense>
                      </RoleGuard>
                    }
                  />
                  <Route path="/workers/:workerId" element={<WorkerPublicProfileRoute />} />
                  <Route
                    path="/profile"
                    element={
                      <RoleGuard allowedRole={UserRole.Customer}>
                        <Suspense fallback={<ProfileSkeleton />}>
                          <ProfilePage />
                        </Suspense>
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/post-request"
                    element={
                      <RoleGuard allowedRole={UserRole.Customer}>
                        <PostRequestPage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/my-requests"
                    element={
                      <RoleGuard allowedRole={UserRole.Customer}>
                        <Suspense fallback={<ListSkeleton rows={3} />}>
                          <CustomerRequestsPage />
                        </Suspense>
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/my-requests/:jobId"
                    element={
                      <RoleGuard allowedRole={UserRole.Customer}>
                        <CustomerJobDetailPage />
                      </RoleGuard>
                    }
                  />

                  {/* Authenticated Shared Routes */}
                  <Route
                    path="/chat"
                    element={
                      <RoleGuard allowedRole="authenticated">
                        <ChatPage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/chat/:conversationId"
                    element={
                      <RoleGuard allowedRole="authenticated">
                        <ChatPage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/alerts"
                    element={
                      <RoleGuard allowedRole="authenticated">
                        <Suspense fallback={<ListSkeleton rows={4} />}>
                          <AlertsPage />
                        </Suspense>
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <RoleGuard allowedRole="authenticated">
                        <SettingsPage />
                      </RoleGuard>
                    }
                  />

                  {/* Worker Interface (Strict Role Guard) */}
                  <Route
                    path="/worker"
                    element={
                      <RoleGuard allowedRole={UserRole.Worker}>
                        <WorkerHomePage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/worker/jobs"
                    element={
                      <RoleGuard allowedRole={UserRole.Worker}>
                        <Suspense fallback={<ListSkeleton rows={3} />}>
                          <WorkerJobsPage />
                        </Suspense>
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/worker/jobs/:jobId"
                    element={
                      <RoleGuard allowedRole={UserRole.Worker}>
                        <WorkerJobDetailPage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/worker/work"
                    element={
                      <RoleGuard allowedRole={UserRole.Worker}>
                        <WorkerMyWorkPage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/worker/profile"
                    element={
                      <RoleGuard allowedRole={UserRole.Worker}>
                        <Suspense fallback={<ProfileSkeleton />}>
                          <WorkerProfilePage />
                        </Suspense>
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/worker/send-price"
                    element={
                      <RoleGuard allowedRole={UserRole.Worker}>
                        <WorkerSendPricePage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/worker/send-price/:jobId"
                    element={
                      <RoleGuard allowedRole={UserRole.Worker}>
                        <WorkerSendPricePage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/worker/prices"
                    element={
                      <RoleGuard allowedRole={UserRole.Worker}>
                        <Suspense fallback={<ListSkeleton rows={3} />}>
                          <WorkerPricesPage />
                        </Suspense>
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/worker/bookings"
                    element={
                      <RoleGuard allowedRole={UserRole.Worker}>
                        <Suspense fallback={<ListSkeleton rows={3} />}>
                          <WorkerBookingsPage />
                        </Suspense>
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/worker/earnings"
                    element={
                      <RoleGuard allowedRole={UserRole.Worker}>
                        <WorkerEarningsPage />
                      </RoleGuard>
                    }
                  />

                  <Route
                    path="/invite"
                    element={
                      <RoleGuard allowedRole={UserRole.Customer}>
                        <ComingSoonPage />
                      </RoleGuard>
                    }
                  />

                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </AppStoreProvider>
    </ErrorBoundary>
  );
}
