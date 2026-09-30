// Looks like the printed asset label stuck on real equipment
export default function AssetTag({ tag, size = 'small' }) {
  return (
    <span className={`asset-tag asset-tag-${size}`}>
      {size === 'large' && <span className="asset-tag-owner">Property of IT</span>}
      <span className="asset-tag-code">{tag}</span>
      {size === 'large' && <span className="asset-tag-bars" aria-hidden="true" />}
    </span>
  );
}
