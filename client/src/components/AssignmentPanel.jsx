import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Who has the asset now, check out / check in controls, and past assignments.
// onChange tells the parent page to reload the asset (its status changes).
export default function AssignmentPanel({ asset, onChange }) {
  const { isAdmin } = useAuth();
  const [history, setHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function loadHistory() {
    api(`/assets/${asset.id}/assignments`).then(setHistory).catch((err) => setError(err.message));
  }

  useEffect(loadHistory, [asset.id, asset.status]);

  // Only admins need the list of people to check out to
  useEffect(() => {
    if (isAdmin) api('/users').then(setUsers).catch(() => {});
  }, [isAdmin]);

  async function run(path, body) {
    setBusy(true);
    setError('');
    try {
      await api(`/assets/${asset.id}/${path}`, { method: 'POST', body });
      setUserId('');
      setNotes('');
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleCheckout(e) {
    e.preventDefault();
    if (!userId) {
      setError('Choose who is getting this asset.');
      return;
    }
    run('checkout', { user_id: Number(userId), notes: notes.trim() || null });
  }

  function handleCheckin(e) {
    e.preventDefault();
    run('checkin', { notes: notes.trim() || null });
  }

  const current = history.find((h) => !h.checked_in_at);
  const past = history.filter((h) => h.checked_in_at);

  return (
    <section className="panel">
      <h2>Assignment</h2>

      {current ? (
        <div className="holder">
          <p>
            With <strong>{current.user_name}</strong>
            {current.department && <span className="muted"> in {current.department}</span>}
            <span className="muted"> since {formatDateTime(current.checked_out_at)}</span>
          </p>
          {current.notes && <p className="muted small">{current.notes}</p>}
        </div>
      ) : (
        <p className="muted">
          {asset.status === 'in_stock' && 'Nobody has this asset. It is ready to check out.'}
          {asset.status === 'in_repair' && 'This asset is in repair. Set its status back to In stock before checking it out.'}
          {asset.status === 'retired' && 'This asset is retired and can no longer be checked out.'}
        </p>
      )}

      {isAdmin && asset.status === 'in_stock' && (
        <form onSubmit={handleCheckout} className="form assign-form">
          <label>
            Check out to
            <select value={userId} onChange={(e) => { setUserId(e.target.value); setError(''); }}>
              <option value="">Choose a person</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}{u.department ? ` (${u.department})` : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Note <span className="muted">(optional)</span></span>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Replacement for a broken laptop" />
          </label>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Checking out…' : 'Check out'}</button>
        </form>
      )}

      {isAdmin && current && (
        <form onSubmit={handleCheckin} className="form assign-form">
          <label>
            <span>Return note <span className="muted">(optional)</span></span>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="With charger, no damage" />
          </label>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Checking in…' : 'Check in'}</button>
        </form>
      )}

      {error && <p className="error" role="alert">{error}</p>}

      <h3 className="history-title">History</h3>
      {past.length === 0 ? (
        <p className="muted small">No past assignments.</p>
      ) : (
        <ol className="history">
          {past.map((h) => (
            <li key={h.id}>
              <span className="history-name">{h.user_name}</span>
              <span className="muted small">
                {formatDateTime(h.checked_out_at)} to {formatDateTime(h.checked_in_at)}
              </span>
              {h.notes && <span className="muted small">{h.notes}</span>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
