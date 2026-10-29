// Share a program or a trainer as a picture (story 9:16 or post 1:1) with a QR code: send it straight from
// the phone's share sheet, save it, or copy the link / caption.
import { Copy, Download, Share2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Segmented } from '../components/ui/Field.jsx';
import Sheet from '../components/ui/Sheet.jsx';
import { useApp } from '../context/AppContext.jsx';
import { buildProgramCard, buildTrainerCard, canvasToBlob, renderShareCard } from '../lib/shareCard.js';

export default function ShareModal({ kind, id }) {
  const { db, lang, t, notify } = useApp();
  const [format, setFormat] = useState('story');
  const [image, setImage] = useState(null); // { blob, url }
  const [failed, setFailed] = useState(false);

  const card = useMemo(() => {
    if (kind === 'program') {
      const program = db.programs.find((p) => p.id === id);
      return program ? buildProgramCard(db, program, t, lang) : null;
    }
    const trainer = db.users.find((u) => u.id === id && u.role === 'coach');
    return trainer ? buildTrainerCard(db, trainer, t, lang) : null;
  }, [db, kind, id, lang, t]);

  useEffect(() => {
    if (!card) return undefined;
    let cancelled = false;
    let url = null;
    setImage(null);
    setFailed(false);
    renderShareCard(card, format)
      .then(canvasToBlob)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setImage({ blob, url });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [card, format]);

  if (!card) return null;
  const fileName = `jimato-${kind}-${format}.png`;
  const message = `${card.caption}\n${card.url}`;
  const file = image ? new File([image.blob], fileName, { type: 'image/png' }) : null;
  const canShareFile = Boolean(file) && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });

  const download = () => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = fileName;
    link.click();
    notify(t('share.saved'));
  };
  const share = async () => {
    try {
      await navigator.share({ files: [file], text: message });
    } catch (error) {
      if (error?.name !== 'AbortError') download(); // the share sheet failed: save the picture instead
    }
  };
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(t('common.copied'));
    } catch {
      notify(t('share.copyFailed'));
    }
  };

  return (
    <Sheet title={t('share.title')}>
      <Segmented value={format} onChange={setFormat} options={[{ value: 'story', label: t('share.story') }, { value: 'post', label: t('share.post') }]} />
      <div className={`share-preview ${format}`}>
        {image ? <img src={image.url} alt={t('share.previewAlt')} /> : <span className="muted">{t(failed ? 'share.failed' : 'share.preparing')}</span>}
      </div>
      <div className="btns stack-btns">
        {canShareFile && <button className="btn" onClick={share}><Share2 size={16} /> {t('share.send')}</button>}
        <button className={canShareFile ? 'btn ghost' : 'btn'} disabled={!image} onClick={download}><Download size={16} /> {t('share.save')}</button>
      </div>
      <div className="btns stack-btns">
        <button className="btn ghost" onClick={() => copy(card.url)}><Copy size={16} /> {t('share.copyLink')}</button>
        <button className="btn ghost" onClick={() => copy(message)}><Copy size={16} /> {t('share.copyCaption')}</button>
      </div>
      <p className="muted small">{t('share.linkNote')}</p>
    </Sheet>
  );
}
