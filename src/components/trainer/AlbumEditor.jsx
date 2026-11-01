// Trainer's image album: add several pictures at once, replace or delete any, and write a caption for each.
import { Camera, ImagePlus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { uid } from '../../lib/format.js';
import { IMAGE_SIZES, PROFILE_LIMITS } from '../../lib/domain/trainerProfile.js';
import { fileToDataUrl } from '../../lib/images.js';
import { Field } from '../ui/Field.jsx';
import Spinner from '../ui/Spinner.jsx';

export default function AlbumEditor({ value, onChange, errors = {} }) {
  const { t } = useApp();
  const addInput = useRef(null);
  const replaceInput = useRef(null);
  const replacing = useRef(null);
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState(null);
  const room = PROFILE_LIMITS.album - value.length;

  const read = async (files) => {
    const out = [];
    for (const file of files) {
      try {
        out.push(await fileToDataUrl(file, IMAGE_SIZES.album));
      } catch (e) {
        setProblem(e.message === 'too big' ? 'img_too_big' : 'img_invalid');
      }
    }
    return out;
  };

  const add = async (event) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = '';
    if (!files.length) return;
    setLoading(true);
    setProblem(null);
    const sources = await read(files.slice(0, room));
    if (files.length > room) setProblem('album_full');
    onChange([...value, ...sources.map((src) => ({ id: uid(), src, caption: '' }))]);
    setLoading(false);
  };

  const replace = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    const id = replacing.current;
    if (!file || !id) return;
    setLoading(true);
    setProblem(null);
    const [src] = await read([file]);
    if (src) onChange(value.map((item) => (item.id === id ? { ...item, src } : item)));
    setLoading(false);
  };

  return (
    <section className="co-section" aria-labelledby="album-title">
      <h3 id="album-title">{t('album.title')}</h3>
      <p className="muted">{t('album.help', { max: PROFILE_LIMITS.album })}</p>
      {value.length === 0 && <p className="muted empty-line">{t('album.empty')}</p>}
      <ul className="album-edit">
        {value.map((item, index) => (
          <li key={item.id} data-field={`album.${item.id}`} className={errors[`album.${item.id}`] ? 'invalid' : ''}>
            <img src={item.src} alt={item.caption || t('album.itemAlt', { n: index + 1 })} loading="lazy" />
            <Field label={t('album.caption')} value={item.caption} maxLength={PROFILE_LIMITS.caption} onChange={(caption) => onChange(value.map((i) => (i.id === item.id ? { ...i, caption } : i)))} error={errors[`album.${item.id}`] ? t(`field.${errors[`album.${item.id}`]}`) : undefined} />
            <div className="album-edit-actions">
              <button type="button" className="btn ghost" disabled={loading} onClick={() => { replacing.current = item.id; replaceInput.current?.click(); }}>
                <Camera size={15} /> {t('img.replace')}
              </button>
              <button type="button" className="icon-btn" onClick={() => onChange(value.filter((i) => i.id !== item.id))} aria-label={t('album.remove', { n: index + 1 })}>
                <Trash2 size={17} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {(problem || errors.album) && <small className="field-error" role="alert">{t(`field.${problem ?? errors.album}`)}</small>}
      {room > 0 && (
        <button type="button" className="btn ghost wide" disabled={loading} aria-busy={loading} onClick={() => addInput.current?.click()}>
          {loading ? <Spinner /> : <ImagePlus size={16} />} {t('album.add')}
        </button>
      )}
      <input ref={addInput} type="file" accept="image/*" multiple hidden onChange={add} />
      <input ref={replaceInput} type="file" accept="image/*" hidden onChange={replace} />
    </section>
  );
}
