/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ExploreScreen } from './screens/ExploreScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { OwnerDashboard } from './screens/OwnerDashboard';
import { UploadItemScreen } from './screens/UploadItemScreen';
import { TripSettingsScreen } from './screens/TripSettingsScreen';
import { OwnerInventoryScreen } from './screens/OwnerInventoryScreen';
import { OwnerRequestDetailScreen } from './screens/OwnerRequestDetailScreen';
import { StorefrontScreen } from './screens/StorefrontScreen';
import { MasterProvider } from './context/MasterContext';

export default function App() {
  return (
    <MasterProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<OwnerDashboard />} />
            <Route path="explore" element={<ExploreScreen />} />
            <Route path="profile" element={<ProfileScreen />} />
            
            {/* Owner Side Routes */}
            <Route path="owner" element={<Navigate to="/" replace />} />
            <Route path="owner/inventory" element={<OwnerInventoryScreen />} />
            <Route path="owner/list-item" element={<UploadItemScreen />} />
            <Route path="owner/edit-item/:id" element={<UploadItemScreen />} />
            <Route path="owner/request/:id" element={<OwnerRequestDetailScreen />} />
            <Route path="trip-settings" element={<TripSettingsScreen />} />
            
            {/* Public Storefront Route */}
            <Route path="items/:id" element={<StorefrontScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MasterProvider>
  );
}
