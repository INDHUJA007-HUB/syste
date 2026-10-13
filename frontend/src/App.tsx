import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WatchlistProvider } from './context/WatchlistContext';
import { Navbar } from './components/Navbar';

import { Footer } from './components/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VideoDetailsPage } from './pages/VideoDetailsPage';
import { VideoPlayerPage } from './pages/VideoPlayerPage';
import { PlansPage } from './pages/PlansPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isPlayerView = location.pathname.startsWith('/watch/');

  return (
    <div className="flex flex-col min-h-screen">
      {!isPlayerView && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/catalogue" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/videos/:id" element={<VideoDetailsPage />} />
          <Route path="/watch/:id" element={<VideoPlayerPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {!isPlayerView && <Footer />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WatchlistProvider>
          <AppLayout />
        </WatchlistProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};


export default App;
