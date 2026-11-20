import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Loading } from './components/Feedback';
import { AuthProvider } from './auth/AuthContext';
import { RequireAdmin, RequireAuth } from './auth/RequireAuth';
import LoginPage from './pages/LoginPage';

// Route-level code splitting: each page is its own chunk.
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProductToolPage = lazy(() => import('./pages/product/ProductToolPage'));
const CreateToolPage = lazy(() => import('./pages/CreateToolPage'));
const AiCopilotPage = lazy(() => import('./pages/AiCopilotPage'));

export function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Navbar />
        <main id="main" className="app-main">
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
              <Route path="/tools" element={<Navigate to="/" replace />} />
              <Route path="/product" element={<RequireAuth><ProductToolPage /></RequireAuth>} />
              <Route path="/create" element={<RequireAuth><RequireAdmin><CreateToolPage /></RequireAdmin></RequireAuth>} />
              <Route path="/ai-copilot" element={<RequireAuth><RequireAdmin><AiCopilotPage /></RequireAdmin></RequireAuth>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <footer className="app-footer">CalcVersa Multi-Tenant Calculation Platform © 2026</footer>
      </div>
    </AuthProvider>
  );
}

export default App;
