import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { RequireRole } from './auth/RequireRole';
import { RequirePermission } from './auth/RequirePermission';
import { DashboardShell } from './layout/DashboardShell';
import { LoginPage } from './pages/LoginPage';
import { CashierPage } from './pages/CashierPage';
import { ProductsPage } from './pages/ProductsPage';
import { BarcodeGeneratorPage } from './pages/BarcodeGeneratorPage';
import { WorkersPage } from './pages/WorkersPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { OverviewPage } from './pages/OverviewPage';
import { SalesHistoryPage } from './pages/SalesHistoryPage';
import { DeadStockPage } from './pages/DeadStockPage';
import { AIPage } from './pages/AIPage';
import './styles/theme.css';

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'owner' ? '/overview' : '/cashier'} replace />;
}

function App() {
  return (
    <AuthProvider>
      <ToastContainer position="top-right" autoClose={6000} newestOnTop closeOnClick pauseOnHover theme="colored" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireRole roles={['owner', 'cashier']} />}>
          <Route element={<DashboardShell />}>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/cashier" element={<CashierPage />} />

            <Route element={<RequirePermission permission="overview" />}>
              <Route path="/overview" element={<OverviewPage />} />
            </Route>
            <Route element={<RequirePermission permission="ai" />}>
              <Route path="/ai" element={<AIPage />} />
            </Route>
            <Route element={<RequirePermission permission="products" />}>
              <Route path="/products" element={<ProductsPage />} />
            </Route>
            <Route element={<RequirePermission permission="sales-history" />}>
              <Route path="/sales-history" element={<SalesHistoryPage />} />
            </Route>
            <Route element={<RequirePermission permission="dead-stock" />}>
              <Route path="/dead-stock" element={<DeadStockPage />} />
            </Route>
            <Route element={<RequirePermission permission="analytics" />}>
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Route>

            <Route element={<RequireRole roles={['owner']} />}>
              <Route path="/barcode-generator" element={<BarcodeGeneratorPage />} />
              <Route path="/workers" element={<WorkersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
