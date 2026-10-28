import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AlertProvider } from './context/AlertContext';
import { IncidentProvider } from './context/IncidentContext';
import { CartProvider } from './context/CartContext';
import { AgentProvider } from './context/AgentContext';

import BottomNav from './components/BottomNav';
import Toasts from './components/Toasts';
import FirstRunNotice from './components/FirstRunNotice';
import CartDrawer from './components/shop/CartDrawer';

import MapPage from './pages/MapPage';
import AgentPage from './pages/AgentPage';
import IncidentsPage from './pages/IncidentsPage';
import SosPage from './pages/SosPage';
import ShopPage from './pages/ShopPage';

/**
 * Provider order matters:
 *   App      → profile, contacts, settings, location
 *   Alert    → needs location + contacts to dispatch an SOS
 *   Incident → needs location (distance sort) and Alert (toasts)
 *   Cart     → needs Alert (toasts)
 *   Agent    → needs App + Alert; lives here so monitoring survives tab changes
 */
export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <AlertProvider>
          <IncidentProvider>
            <CartProvider>
              <AgentProvider>
                <div className="mx-auto flex min-h-full max-w-xl flex-col bg-ink-900">
                  <main className="flex-1 pb-[calc(58px+var(--sa-bottom))]">
                    <Routes>
                      <Route path="/" element={<Navigate to="/map" replace />} />
                      <Route path="/map" element={<MapPage />} />
                      <Route path="/agent" element={<AgentPage />} />
                      <Route path="/incidents" element={<IncidentsPage />} />
                      <Route path="/sos" element={<SosPage />} />
                      <Route path="/shop" element={<ShopPage />} />
                      <Route path="*" element={<Navigate to="/map" replace />} />
                    </Routes>
                  </main>
                  <BottomNav />
                  <CartDrawer />
                  <Toasts />
                  <FirstRunNotice />
                </div>
              </AgentProvider>
            </CartProvider>
          </IncidentProvider>
        </AlertProvider>
      </AppProvider>
    </HashRouter>
  );
}
