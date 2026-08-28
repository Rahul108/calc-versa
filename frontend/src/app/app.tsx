import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { ProductToolPage } from './pages/ProductToolPage';
import { CreateToolPage } from './pages/CreateToolPage';
import { AiCopilotPage } from './pages/AiCopilotPage';
import { LoginPage } from './pages/LoginPage';

export function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tools" element={<DashboardPage />} />
          <Route path="/product" element={<ProductToolPage />} />
          <Route path="/create" element={<CreateToolPage />} />
          <Route path="/ai-copilot" element={<AiCopilotPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer style={{ borderTop: '1px solid #23304d', padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem', marginTop: '3rem' }}>
        CalcVersa Multi-Tenant Calculation Platform &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
