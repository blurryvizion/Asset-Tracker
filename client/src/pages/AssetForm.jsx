import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { STATUS_LABELS } from '../components/StatusBadge';

const EMPTY = {
  asset_tag: '',
  type: 'laptop',
  brand: '',
  model: '',
  serial_number: '',
  status: 'in_stock',
  location: '',
  purchase_date: '',
  warranty_end: '',
  end_of_life: '',
};

const TYPES = ['laptop', 'monitor', 'phone', 'tablet', 'desktop', 'printer', 'other'];

// One form for both "Add asset" and "Edit asset"
export default function AssetForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // When editing, load the current values into the form
  useEffect(() => {
    if (!isEdit) return;
    api(`/assets/${id}`)
      .then((asset) => {
        const values = {};
        for (const key of Object.keys(EMPTY)) values[key] = asset[key] ?? '';
        setForm(values);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    // Empty boxes become null so the database stores "no value" instead of ""
    const body = {};
    for (const [key, value] of Object.entries(form)) {
      body[key] = typeof value === 'string' && value.trim() === '' ? null : value.trim();
    }

    try {
      const saved = isEdit
        ? await api(`/assets/${id}`, { method: 'PUT', body })
        : await api('/assets', { method: 'POST', body });
      navigate(`/assets/${saved.id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) return <p className="page-message">Loading…</p>;

  return (
    <>
      <Link to={isEdit ? `/assets/${id}` : '/assets'} className="back">
        {isEdit ? 'Back to asset' : 'All assets'}
      </Link>
      <h1>{isEdit ? `Edit ${form.asset_tag}` : 'Add asset'}</h1>

      <form onSubmit={handleSubmit} className="form panel form-grid">
        <fieldset>
          <legend>Device</legend>
          <label>
            Asset tag
            <input name="asset_tag" value={form.asset_tag} onChange={update} required placeholder="LT-0010" />
          </label>
          <label>
            Type
            <select name="type" value={form.type} onChange={update}>
              {TYPES.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
            </select>
          </label>
          <label>
            Brand
            <input name="brand" value={form.brand} onChange={update} placeholder="Dell" />
          </label>
          <label>
            Model
            <input name="model" value={form.model} onChange={update} placeholder="Latitude 5440" />
          </label>
          <label>
            Serial number
            <input name="serial_number" value={form.serial_number} onChange={update} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Where it is</legend>
          <label>
            Status
            <select name="status" value={form.status} onChange={update}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            Location
            <input name="location" value={form.location} onChange={update} placeholder="HQ Floor 2" />
          </label>
        </fieldset>

        <fieldset>
          <legend>Dates</legend>
          <label>
            Purchase date
            <input type="date" name="purchase_date" value={form.purchase_date} onChange={update} />
          </label>
          <label>
            Warranty ends
            <input type="date" name="warranty_end" value={form.warranty_end} onChange={update} />
          </label>
          <label>
            End-of-life
            <input type="date" name="end_of_life" value={form.end_of_life} onChange={update} />
          </label>
        </fieldset>

        {error && <p className="error" role="alert">{error}</p>}

        <div className="form-actions">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add asset'}
          </button>
          <Link to={isEdit ? `/assets/${id}` : '/assets'} className="btn">Cancel</Link>
        </div>
      </form>
    </>
  );
}
