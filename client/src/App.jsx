import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import AssetList from './pages/AssetList';
import AssetDetail from './pages/AssetDetail';
import AssetForm from './pages/AssetForm';

// Sends logged-out users to the login page
function RequireAuth({ children }) {
  const { user, checking } = useAuth();
  if (checking) return <p className="page-message">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Sends non-admins back to the asset list
function RequireAdmin({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/assets" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/assets" element={<AssetList />} />
        <Route path="/assets/new" element={<RequireAdmin><AssetForm /></RequireAdmin>} />
        <Route path="/assets/:id" element={<AssetDetail />} />
        <Route path="/assets/:id/edit" element={<RequireAdmin><AssetForm /></RequireAdmin>} />
      </Route>
      <Route path="*" element={<Navigate to="/assets" replace />} />
    </Routes>
  );
}
