// JSON export / import and reset of the locally stored data.
import { clearState } from '../lib/storage';

/** JSON export / import and reset of the locally stored data. */
export function useBackup({ db, setDb, setWorkout, notify }) {
  const exportData = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'jimato-backup.json';
    link.click();
    URL.revokeObjectURL(link.href);
    notify('نسخه پشتیبان آماده شد');
  };

  const importData = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.users || !data.exercises || !data.programs || !data.sessions) throw new Error('invalid');
        if (!confirm('اطلاعات فعلی با نسخه پشتیبان جایگزین شود؟')) return;
        setDb(data);
        setWorkout(data.activeWorkout ?? null);
        notify('بازیابی با موفقیت انجام شد');
      } catch {
        notify('فایل نامعتبر است یا ساختار پشتیبان پشتیبانی نمی‌شود');
      }
    };
    reader.readAsText(file);
  };

  const resetData = () => {
    if (!confirm('همه اطلاعات فعلی با داده‌های نمونه جایگزین شوند؟')) return;
    clearState();
    location.reload();
  };

  return { exportData, importData, resetData };
}
