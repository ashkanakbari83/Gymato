// Settings: theme, language, onboarding replay and data backup.
import { CircleHelp, Download, Moon, RotateCcw, Settings, Sun, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';

const THEMES = [
  ['light', 'روشن', Sun],
  ['dark', 'تیره', Moon],
  ['system', 'سیستم', Settings],
];
const LANGUAGES = [
  ['fa', 'فارسی'],
  ['en', 'English'],
];

export default function SettingsPage() {
  const { db, update, exportData, importData, resetData, onboarding } = useApp();

  return (
    <div className="stack narrow">
      <section className="panel">
        <div className="setting">
          <b>پوسته</b>
          <div className="seg">
            {THEMES.map(([id, label, Icon]) => (
              <button key={id} className={db.theme === id ? 'on' : ''} onClick={() => update({ theme: id })}>
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="setting">
          <b>زبان</b>
          <div className="seg">
            {LANGUAGES.map(([id, label]) => (
              <button key={id} className={db.language === id ? 'on' : ''} onClick={() => update({ language: id })}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="setting">
          <b>راهنمای شروع</b>
          <button className="btn ghost" onClick={onboarding.reopen}>
            <CircleHelp size={16} /> نمایش دوباره
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="setting">
          <b>پشتیبان‌گیری</b>
          <button className="btn ghost" onClick={exportData}>
            <Download size={16} /> دریافت
          </button>
        </div>
        <div className="setting">
          <b>بازیابی پشتیبان</b>
          <label className="btn ghost upload">
            <Upload size={16} /> انتخاب فایل
            <input type="file" accept="application/json,.json" onChange={importData} />
          </label>
        </div>
        <div className="setting">
          <b>بازنشانی به داده نمونه</b>
          <button className="btn danger" onClick={resetData}>
            <RotateCcw size={16} /> بازنشانی
          </button>
        </div>
      </section>

      <p className="muted foot">
        داده‌ها فقط در همین مرورگر ذخیره می‌شوند؛ حساب واقعی و همگام‌سازی به بک‌اند نیاز دارد. فایل GIF حرکت‌ها را در{' '}
        <code>public/exercises/</code> بگذار.
      </p>
    </div>
  );
}
