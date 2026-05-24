import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ExploreScreen } from './screens/ExploreScreen';
import { OwnerDashboard } from './screens/OwnerDashboard';
import { UploadItemScreen } from './screens/UploadItemScreen';
import { TripSettingsScreen } from './screens/TripSettingsScreen';
import { OwnerInventoryScreen } from './screens/OwnerInventoryScreen';
import { OwnerRequestDetailScreen } from './screens/OwnerRequestDetailScreen';
import { StorefrontScreen } from './screens/StorefrontScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { MasterProvider, useMaster } from './context/MasterContext';
import { Toaster } from 'sonner';

function RequireAuth() {
  const { currentUser, loading } = useMaster();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <MasterProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Public Storefront Route */}
          <Route path="items/:id" element={<StorefrontScreen />} />

          {/* Auth routes */}
          <Route path="login" element={<LoginScreen />} />
          <Route path="signup" element={<SignUpScreen />} />

          {/* Protect merchant routes */}
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<OwnerDashboard />} />
              <Route path="explore" element={<ExploreScreen />} />
              <Route path="owner/inventory" element={<OwnerInventoryScreen />} />
              <Route path="owner/list-item" element={<UploadItemScreen />} />
              <Route path="owner/edit-item/:id" element={<UploadItemScreen />} />
              <Route path="owner/request/:id" element={<OwnerRequestDetailScreen />} />
              <Route path="trip-settings" element={<TripSettingsScreen />} />
              <Route path="reports" element={<ReportsScreen />} />
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-center" />
      </BrowserRouter>
    </MasterProvider>
  );
}
