// A picture that opens in the full-screen viewer when tapped. `images` is the whole set (for next/previous) and
// `index` is the one this thumbnail shows. It is a real button, so it works with keyboard and screen readers.
import { useApp } from '../../context/AppContext.jsx';

export default function ViewableImage({ images, index = 0, className = '', imgClassName = '', loading = 'lazy' }) {
  const { openModal, t } = useApp();
  const image = images[index];
  if (!image) return null;
  return (
    <button
      type="button"
      className={`viewable ${className}`}
      onClick={() => openModal({ type: 'image-viewer', images, index })}
      aria-label={t('viewer.open', { alt: image.alt || '' })}
    >
      <img className={imgClassName} src={image.src} alt={image.alt ?? ''} loading={loading} />
    </button>
  );
}
