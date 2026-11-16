import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { CreateOfferPage } from './pages/CreateOfferPage';
import { ExplorePage } from './pages/ExplorePage';
import { LoginPage } from './pages/LoginPage';
import { MyOffersPage } from './pages/MyOffersPage';
import { OfferDetailPage } from './pages/OfferDetailPage';
import { ProposalsPage } from './pages/ProposalsPage';
import { RegisterPage } from './pages/RegisterPage';
import { UiCatalogPage } from './pages/dev/UiCatalogPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<ExplorePage />} />
            <Route path="/offers/:id" element={<OfferDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/offers/new" element={<CreateOfferPage />} />
              <Route path="/offers/mine" element={<MyOffersPage />} />
              <Route path="/proposals" element={<ProposalsPage />} />
            </Route>

            {import.meta.env.DEV && <Route path="/_ui" element={<UiCatalogPage />} />}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
