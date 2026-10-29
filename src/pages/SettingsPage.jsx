// Settings: theme, language, onboarding replay and data backup.
import { CircleHelp, Download, Moon, RotateCcw, Settings, Sun, Upload, Volume2 } from 'lucide-react';
import InstallCard from '../components/pwa/InstallCard.jsx';
import Switch from '../components/ui/Switch.jsx';
import { useApp } from '../context/AppContext.jsx';
import { canKeepAwake, canVibrate, feedbackPrefs, playCue, unlockAudio } from '../lib/feedback.js';

const THEMES = [['light', Sun], ['dark', Moon], ['system', Settings]];
const LANGUAGES = [['fa', 'فارسی'], ['en', 'English']];

export default function SettingsPage() {
  const { db, update, exportData, importData, resetData, onboarding, t } = useApp();
  const prefs = feedbackPrefs(db);
  const setPref = (key) => (value) => update({ feedback: { ...prefs, [key]: value } });
  const testCue = () => {
    unlockAudio();
    playCue('restEnd', prefs);
  };

  return (
    <div className="stack narrow">
      <section className="panel">
        <div className="setting">
          <b>{t('settings.theme')}</b>
          <div className="seg">
            {THEMES.map(([id, Icon]) => (
              <button key={id} className={db.theme === id ? 'on' : ''} onClick={() => update({ theme: id })}>
                <Icon size={16} /> {t(`settings.theme.${id}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="setting">
          <b>{t('settings.language')}</b>
          <div className="seg">
            {LANGUAGES.map(([id, label]) => (
              <button key={id} className={db.language === id ? 'on' : ''} onClick={() => update({ language: id })}>{label}</button>
            ))}
          </div>
        </div>
        <div className="setting">
          <b>{t('settings.guide')}</b>
          <button className="btn ghost" onClick={onboarding.reopen}><CircleHelp size={16} /> {t('settings.showAgain')}</button>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">{t('settings.workoutTitle')}</h2>
        <Switch label={t('settings.sound')} hint={t('settings.soundHint')} checked={prefs.sound} onChange={setPref('sound')} />
        <Switch
          label={t('settings.vibrate')}
          hint={t(canVibrate() ? 'settings.vibrateHint' : 'settings.vibrateUnsupported')}
          checked={prefs.vibrate}
          disabled={!canVibrate()}
          onChange={setPref('vibrate')}
        />
        <Switch
          label={t('settings.keepAwake')}
          hint={t(canKeepAwake() ? 'settings.keepAwakeHint' : 'settings.keepAwakeUnsupported')}
          checked={prefs.keepAwake}
          disabled={!canKeepAwake()}
          onChange={setPref('keepAwake')}
        />
        <div className="setting">
          <b>{t('settings.testCue')}</b>
          <button className="btn ghost" onClick={testCue}><Volume2 size={16} /> {t('settings.testCueBtn')}</button>
        </div>
      </section>

      <InstallCard />

      <section className="panel">
        <div className="setting">
          <b>{t('settings.backup')}</b>
          <button className="btn ghost" onClick={exportData}><Download size={16} /> {t('settings.download')}</button>
        </div>
        <div className="setting">
          <b>{t('settings.restore')}</b>
          <label className="btn ghost upload">
            <Upload size={16} /> {t('settings.chooseFile')}
            <input type="file" accept="application/json,.json" onChange={importData} />
          </label>
        </div>
        <div className="setting">
          <b>{t('settings.reset')}</b>
          <button className="btn danger" onClick={resetData}><RotateCcw size={16} /> {t('settings.resetBtn')}</button>
        </div>
      </section>

      <p className="muted foot">{t('settings.localNote')}</p>
    </div>
  );
}
