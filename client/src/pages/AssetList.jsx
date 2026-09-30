import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import AssetTag from '../components/AssetTag';
import StatusBadge, { STATUS_LABELS } from '../components/StatusBadge';
import { daysUntil, formatDate } from '../dates';

const TYPES = ['laptop', 'monitor', 'phone', 'tablet', 'desktop', 'printer', 'other'];

function WarrantyCell({ date }) {
  const days = daysUntil(date);
  if (days === null) return <span className="muted">—</span>;
  let note = null;
  if (days < 0) note = <span className="note note-expired">Expired</span>;
  else if (days <= 90) note = <span className="note note-soon">{days} days left</span>;
  return (
    <>
      {formatDate(date)} {note}
    </>
  );
}

export default function AssetList() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  // Filters live in the URL (?status=assigned) so the back button and links keep them
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const type = params.get('type') || '';
  const search = params.get('search') || '';
  const mine = params.get('mine') === '1';

  const [searchText, setSearchText] = useState(search);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  // Wait until the user stops typing for 300ms before searching
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText !== search) updateParam('search', searchText.trim());
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  // Reload the list whenever a filter changes
  useEffect(() => {
    setLoading(true);
    setError('');
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    if (type) query.set('type', type);
    if (mine) query.set('mine', '1');
    if (search) query.set('search', search);

    api(`/assets?${query}`)
      .then(setAssets)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [status, type, search, mine]);

  const hasFilters = status || type || search;

  function clearFilters() {
    setSearchText('');
    setParams(mine ? { mine: '1' } : {}, { replace: true });
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{mine ? 'My devices' : 'Assets'}</h1>
          <p className="muted">
            {loading ? 'Loading…' : `${assets.length} ${assets.length === 1 ? 'device' : 'devices'}${hasFilters ? ' match your filters' : ''}`}
          </p>
        </div>
        <div className="head-actions">
          <div className="segmented" role="group" aria-label="Which devices to show">
            <button className={mine ? '' : 'active'} aria-pressed={!mine} onClick={() => updateParam('mine', '')}>All devices</button>
            <button className={mine ? 'active' : ''} aria-pressed={mine} onClick={() => updateParam('mine', '1')}>My devices</button>
          </div>
          {isAdmin && (
            <Link to="/assets/new" className="btn btn-primary">Add asset</Link>
          )}
        </div>
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search tag, brand, model, serial, or person"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          aria-label="Search assets"
        />
        <select value={type} onChange={(e) => updateParam('type', e.target.value)} aria-label="Filter by type">
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => updateParam('status', e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {hasFilters && (
          <button className="btn-link" onClick={clearFilters}>Clear filters</button>
        )}
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {!loading && !error && assets.length === 0 && (
        <div className="empty">
          {hasFilters ? (
            <p>No devices match these filters. <button className="btn-link" onClick={clearFilters}>Clear filters</button> to see everything.</p>
          ) : mine ? (
            <p>Nothing is checked out to you right now.</p>
          ) : (
            <p>No devices yet. {isAdmin ? <Link to="/assets/new">Add the first one.</Link> : 'Ask an admin to add some.'}</p>
          )}
        </div>
      )}

      {assets.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tag</th>
                <th>Device</th>
                <th>Status</th>
                <th className="hide-sm">Assigned to</th>
                <th className="hide-sm">Warranty ends</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id} onClick={() => navigate(`/assets/${a.id}`)}>
                  <td>
                    <Link to={`/assets/${a.id}`} onClick={(e) => e.stopPropagation()}>
                      <AssetTag tag={a.asset_tag} />
                    </Link>
                  </td>
                  <td>
                    <div className="device-name">{[a.brand, a.model].filter(Boolean).join(' ') || '—'}</div>
                    <div className="muted small">{a.type}</div>
                  </td>
                  <td><StatusBadge status={a.status} /></td>
                  <td className="hide-sm">
                    {a.assigned_to_name || <span className="muted">{a.location || '—'}</span>}
                  </td>
                  <td className="hide-sm"><WarrantyCell date={a.warranty_end} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
