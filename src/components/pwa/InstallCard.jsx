// "Install on your phone". Android / desktop Chrome: a real install button. iPhone: the Add to Home Screen
// steps (Safari offers no prompt). Hidden once the app runs installed. `compact` is the dismissible home banner.
import { Download, Share, X } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { usePwa } from '../../hooks/usePwa.js';
import { isIos, promptInstall } from '../../lib/pwa.js';

const DISMISS_KEY = 'jimato:install-hint-dismissed';
const read = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
};

export default function InstallCard({ compact = false }) {
  const { t, notify } = useApp();
  const { installEvent, installed } = usePwa();
  const [dismissed, setDismissed] = useState(read);

  if (compact && (installed || dismissed || !installEvent)) return null; // the banner only shows when installing is one tap away
  const ios = isIos();

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // storage unavailable: it just comes back next time
    }
    setDismissed(true);
  };
  const install = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') notify(t('pwa.installedToast'));
  };

  return (
    <section className={`install-card ${compact ? 'is-compact' : ''}`}>
      <span className="install-icon">{ios && !installEvent ? <Share size={20} /> : <Download size={20} />}</span>
      <div className="install-body">
        <b>{t(installed ? 'pwa.installedTitle' : 'pwa.installTitle')}</b>
        <p>{installed ? t('pwa.installedText') : installEvent ? t('pwa.installText') : t(ios ? 'pwa.iosSteps' : 'pwa.genericHint')}</p>
        {!installed && <small>{t('pwa.backupHint')}</small>}
      </div>
      {!installed && installEvent && (
        <button className="btn" onClick={install}>
          {t('pwa.installBtn')}
        </button>
      )}
      {compact && (
        <button className="icon-btn sm install-close" onClick={dismiss} aria-label={t('pwa.later')}>
          <X size={16} />
        </button>
      )}
    </section>
  );
}
