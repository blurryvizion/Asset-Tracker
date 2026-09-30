import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <>
      <header className="topbar">
        <Link to="/assets" className="wordmark">Asset Tracker</Link>
        <div className="topbar-user">
          <span>
            {user.name}
            <span className="role">{user.role === 'admin' ? 'Admin' : 'Employee'}</span>
          </span>
          <button className="btn-link" onClick={handleLogout}>Sign out</button>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
