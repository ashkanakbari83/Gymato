// JSON export / import and reset of the locally stored data.
import { STATE_VERSION } from '../lib/constants.js';
import { clearState } from '../lib/storage.js';

/** JSON export / import and reset of the locally stored data. */
export function useBackup({ db, setDb, setWorkout, notify, t }) {
  const exportData = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'jimato-backup.json';
    link.click();
    URL.revokeObjectURL(link.href);
    notify(t('backup.ready'));
  };

  const importData = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.version !== STATE_VERSION || !data.users || !data.programs || !data.requests) throw new Error('invalid');
        if (!confirm(t('backup.confirmRestore'))) return;
        setDb(data);
        setWorkout(data.activeWorkout ?? null);
        notify(t('backup.restored'));
      } catch {
        notify(t('backup.invalid'));
      }
    };
    reader.readAsText(file);
  };

  const resetData = () => {
    if (!confirm(t('backup.confirmReset'))) return;
    clearState();
    location.reload();
  };

  return { exportData, importData, resetData };
}
