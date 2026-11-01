// Public image gallery of a trainer. Every picture opens in the full-screen viewer, with next / previous across the album.
import { useApp } from '../../context/AppContext.jsx';
import { num } from '../../lib/format.js';
import ViewableImage from '../ui/ViewableImage.jsx';

export default function TrainerAlbum({ album, trainerName }) {
  const { t } = useApp();
  const images = album.map((item, index) => ({ src: item.src, alt: item.caption || t('album.publicAlt', { name: trainerName, n: num(index + 1) }) }));
  return (
    <ul className="album-grid">
      {album.map((item, index) => (
        <li key={item.id}>
          <ViewableImage images={images} index={index} />
          {item.caption && <small>{item.caption}</small>}
        </li>
      ))}
    </ul>
  );
}
