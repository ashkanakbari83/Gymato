// Upload / replace / remove one picture with a preview. Used for the profile photo and the banner.
// `onChange(dataUrl | '')`; the picture is downscaled to `maxSide` before it is kept.
import { Camera, Trash2 } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { fileToDataUrl } from '../../lib/images.js';
import Spinner from './Spinner.jsx';

export default function ImageField({ label, value, onChange, maxSide, shape = 'wide', alt, hint, error, name, addLabel, fallback }) {
  const { t } = useApp();
  const input = useRef(null);
  const hintId = useId();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(false);

  const pick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // picking the same file again must still fire
    if (!file) return;
    setLoading(true);
    try {
      onChange(await fileToDataUrl(file, maxSide));
      setProblem(null);
    } catch (e) {
      setProblem(e.message === 'too big' ? 'img_too_big' : 'img_invalid');
    } finally {
      setLoading(false);
    }
  };

  const shown = error ? t(`field.${error}`) : problem ? t(`field.${problem}`) : null;
  return (
    <div className={`field image-field ${shown ? 'invalid' : ''}`} data-field={name}>
      <span>{label}</span>
      <div className={`image-field-body ${shape}`}>
        <div className={`image-preview ${shape}`}>
          {value ? <img src={value} alt={alt} /> : fallback ?? <Camera size={26} aria-hidden="true" />}
        </div>
        <div className="image-actions">
          <button type="button" className="btn ghost" disabled={loading} aria-busy={loading} onClick={() => input.current?.click()} aria-describedby={hintId}>
            {loading ? <Spinner /> : <Camera size={16} />} {t(value ? 'img.replace' : addLabel ?? 'img.add')}
          </button>
          {value && (
            <button type="button" className="btn ghost danger" onClick={() => { onChange(''); setProblem(null); }}>
              <Trash2 size={16} /> {t('common.remove')}
            </button>
          )}
        </div>
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={pick} />
      {shown && <small className="field-error" role="alert">{shown}</small>}
      {hint && <small id={hintId} className="field-hint">{hint}</small>}
    </div>
  );
}
