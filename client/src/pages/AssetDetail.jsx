import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import AssetTag from '../components/AssetTag';
import AssignmentPanel from '../components/AssignmentPanel';
import StatusBadge from '../components/StatusBadge';
import { daysUntil, formatDate } from '../dates';

function DateWithNote({ date, soonLabel, pastLabel }) {
  const days = daysUntil(date);
  if (days === null) return <span className="muted">Not set</span>;
  let note = null;
  if (days < 0) note = <span className="note note-expired">{pastLabel}</span>;
  else if (days <= 90) note = <span className="note note-soon">{soonLabel} in {days} days</span>;
  return <>{formatDate(date)} {note}</>;
}

export default function AssetDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  function loadAsset() {
    api(`/assets/${id}`)
      .then(setAsset)
      .catch((err) => setError(err.message));
  }

  useEffect(loadAsset, [id]);

  async function handleDelete() {
    if (!window.confirm(`Delete ${asset.asset_tag}? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await api(`/assets/${id}`, { method: 'DELETE' });
      navigate('/assets');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (error) {
    return (
      <>
        <Link to="/assets" className="back">All assets</Link>
        <p className="error" role="alert">{error}</p>
      </>
    );
  }
  if (!asset) return <p className="page-message">Loading…</p>;

  const name = [asset.brand, asset.model].filter(Boolean).join(' ') || 'Unnamed device';

  return (
    <>
      <Link to="/assets" className="back">All assets</Link>

      <div className="detail-head">
        <AssetTag tag={asset.asset_tag} size="large" />
        <div className="detail-title">
          <h1>{name}</h1>
          <p className="muted">
            <span className="capitalize">{asset.type}</span> <StatusBadge status={asset.status} />
          </p>
        </div>
        {isAdmin && (
          <div className="detail-actions">
            <Link to={`/assets/${id}/edit`} className="btn">Edit</Link>
            <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      <section className="panel">
        <h2>Details</h2>
        <dl className="fields">
          <div><dt>Serial number</dt><dd className="mono">{asset.serial_number || <span className="muted">Not set</span>}</dd></div>
          <div><dt>Location</dt><dd>{asset.location || <span className="muted">Not set</span>}</dd></div>
          <div><dt>Purchased</dt><dd>{asset.purchase_date ? formatDate(asset.purchase_date) : <span className="muted">Not set</span>}</dd></div>
          <div><dt>Warranty ends</dt><dd><DateWithNote date={asset.warranty_end} soonLabel="Ends" pastLabel="Expired" /></dd></div>
          <div><dt>End-of-life</dt><dd><DateWithNote date={asset.end_of_life} soonLabel="Due" pastLabel="Past end-of-life" /></dd></div>
        </dl>
      </section>

      <AssignmentPanel asset={asset} onChange={loadAsset} />
    </>
  );
}
