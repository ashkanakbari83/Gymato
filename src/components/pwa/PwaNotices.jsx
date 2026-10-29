// Two small system notices: "you are offline" (the app still works) and "a new version is ready".
// The update is applied only when the person taps it, so a workout in progress is never interrupted.
import { RefreshCw, WifiOff } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { usePwa } from '../../hooks/usePwa.js';
import { applyUpdate } from '../../lib/pwa.js';

export default function PwaNotices() {
  const { page, t } = useApp();
  const { online, updateReady } = usePwa();

  return (
    <>
      {!online && (
        <div className="offline-pill" role="status">
          <WifiOff size={15} /> {t('pwa.offline')}
        </div>
      )}
      {updateReady && page !== 'player' && (
        <div className="update-banner" role="status">
          <span>{t('pwa.updateReady')}</span>
          <button className="btn" onClick={applyUpdate}>
            <RefreshCw size={15} /> {t('pwa.updateBtn')}
          </button>
        </div>
      )}
    </>
  );
}
