import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
import { SubscriptionInactiveScreen } from './screens/SubscriptionInactiveScreen';
import { AdminDashboardScreen } from './screens/AdminDashboardScreen';
import { MasterProvider, useMaster } from './context/MasterContext';

function RequireAuth({ allowedRole, checkSubscription }: { allowedRole?: 'merchant' | 'admin'; checkSubscription?: boolean }) {
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

  if (allowedRole && currentUser.role !== allowedRole) {
    return <Navigate to={currentUser.role === 'admin' ? '/admin' : '/'} replace />;
  }

  if (checkSubscription && currentUser.role === 'merchant' && !currentUser.paid) {
    return <Navigate to="/inactive" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <MasterProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Storefront Route */}
          <Route path="items/:id" element={<StorefrontScreen />} />

          {/* Auth routes */}
          <Route path="login" element={<LoginScreen />} />
          <Route path="signup" element={<SignUpScreen />} />

          {/* Protect merchant routes */}
          <Route element={<RequireAuth checkSubscription={true} allowedRole="merchant" />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<OwnerDashboard />} />
              <Route path="explore" element={<ExploreScreen />} />
              <Route path="owner/inventory" element={<OwnerInventoryScreen />} />
              <Route path="owner/list-item" element={<UploadItemScreen />} />
              <Route path="owner/edit-item/:id" element={<UploadItemScreen />} />
              <Route path="owner/request/:id" element={<OwnerRequestDetailScreen />} />
              <Route path="trip-settings" element={<TripSettingsScreen />} />
            </Route>
          </Route>

          {/* Protected lockout screen */}
          <Route element={<RequireAuth allowedRole="merchant" />}>
            <Route path="inactive" element={<SubscriptionInactiveScreen />} />
          </Route>

          {/* Protect admin routes */}
          <Route element={<RequireAuth allowedRole="admin" />}>
            <Route path="admin" element={<AdminDashboardScreen />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </MasterProvider>
  );
}
