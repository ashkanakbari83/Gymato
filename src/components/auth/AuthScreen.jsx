// Shown until someone signs in: sign in with a mobile number (or username) and password, or create an
// account with a mobile number and password. The starter admin accounts share the username "admin", so
// when more than one account matches, the person picks which one to open.
import { Activity, LogIn, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { MIN_PASSWORD_LENGTH } from '../../lib/auth.js';
import { GOALS, LEVELS } from '../../lib/constants.js';
import { ChipSelect, Field, PasswordField, Segmented, SelectField } from '../ui/Field.jsx';
import LocationFields from '../ui/LocationFields.jsx';

const LANGUAGES = [['fa', 'فارسی'], ['en', 'English']];

function LoginForm() {
  const { findLogin, signInTo, t } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [failed, setFailed] = useState(false);
  const [choices, setChoices] = useState(null);

  const submit = (event) => {
    event.preventDefault();
    const matches = findLogin(identifier, password);
    if (!matches.length) return setFailed(true);
    if (matches.length === 1) return signInTo(matches[0].id);
    setChoices(matches);
  };

  if (choices) {
    return (
      <div className="form-stack">
        <div>
          <b>{t('auth.pickTitle')}</b>
          <p className="muted">{t('auth.pickLead')}</p>
        </div>
        <div className="list">
          {choices.map((u) => (
            <button key={u.id} type="button" className="select-user-row" onClick={() => signInTo(u.id)}>
              <span className="avatar">{u.name[0]}</span>
              <span>
                <b>{u.name}</b>
                <small>{t(u.role === 'coach' ? 'role.coach' : 'role.athlete')}</small>
              </span>
              <LogIn size={17} />
            </button>
          ))}
        </div>
        <button type="button" className="link" onClick={() => setChoices(null)}>{t('auth.pickBack')}</button>
      </div>
    );
  }

  return (
    <form className="form-stack" onSubmit={submit} noValidate>
      <Field label={t('auth.identifier')} value={identifier} onChange={(v) => { setIdentifier(v); setFailed(false); }} autoComplete="username" autoCapitalize="none" autoCorrect="off" enterKeyHint="next" />
      <PasswordField label={t('auth.password')} value={password} onChange={(v) => { setPassword(v); setFailed(false); }} autoComplete="current-password" enterKeyHint="go" error={failed ? t('auth.invalid') : undefined} />
      <button className="btn wide" type="submit"><LogIn size={17} /> {t('auth.login')}</button>
      <p className="auth-hint">{t('auth.demoHint')}</p>
    </form>
  );
}

const EMPTY_SIGNUP = { name: '', phone: '', password: '', role: 'athlete', province: '', city: '', age: '', height: '', weight: '', goal: GOALS[0], level: LEVELS[0] };

function SignupForm() {
  const { signUp, t } = useApp();
  const [form, setForm] = useState(EMPTY_SIGNUP);
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const messages = {
    name: { required: t('field.required') },
    phone: { required: t('field.required'), invalid: t('auth.err.phoneInvalid'), duplicate: t('auth.err.phoneDuplicate') },
    password: { required: t('field.required'), too_short: t('auth.err.passwordShort', { n: MIN_PASSWORD_LENGTH }) },
  };
  const submit = (event) => {
    event.preventDefault();
    const result = signUp(form);
    if (result.ok) return;
    setErrors(Object.fromEntries(Object.entries(result.fields ?? {}).map(([key, code]) => [key, messages[key]?.[code] ?? t('field.invalid')])));
  };

  return (
    <form className="form-stack" onSubmit={submit} noValidate>
      <Field label={t('cr.name')} value={form.name} onChange={set('name')} autoComplete="name" error={errors.name} />
      <Field label={t('auth.phone')} value={form.phone} onChange={set('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder={t('auth.phonePlaceholder')} error={errors.phone} />
      <PasswordField label={t('auth.password')} value={form.password} onChange={set('password')} autoComplete="new-password" hint={t('auth.passwordHint', { n: MIN_PASSWORD_LENGTH })} error={errors.password} />
      <ChipSelect label={t('acct.role')} value={form.role} onChange={set('role')} options={[{ value: 'athlete', label: t('role.athlete') }, { value: 'coach', label: t('role.coach') }]} />
      <div className="form-grid">
        <LocationFields province={form.province} city={form.city} emptyLabel={t('common.notSet')} onChange={(loc) => setForm((f) => ({ ...f, ...loc }))} />
      </div>
      {form.role === 'athlete' && (
        <>
          <SelectField label={t('cr.goal')} value={form.goal} onChange={set('goal')} options={GOALS.map((id) => ({ value: id, label: t(`goal.${id}`) }))} />
          <SelectField label={t('cr.level')} value={form.level} onChange={set('level')} options={LEVELS.map((id) => ({ value: id, label: t(`level.${id}`) }))} />
          <div className="form-grid">
            <Field label={t('cr.age')} type="number" inputMode="numeric" value={form.age} onChange={set('age')} />
            <Field label={t('body.heightCm')} type="number" inputMode="numeric" value={form.height} onChange={set('height')} />
            <Field label={t('body.weightKg')} type="number" inputMode="numeric" value={form.weight} onChange={set('weight')} />
          </div>
        </>
      )}
      <button className="btn wide" type="submit"><UserPlus size={17} /> {t('auth.signup')}</button>
    </form>
  );
}

export default function AuthScreen() {
  const { db, update, t } = useApp();
  const [mode, setMode] = useState('login');
  const isLogin = mode === 'login';

  return (
    <main className="auth">
      <div className="auth-langs" role="group" aria-label={t('settings.language')}>
        {LANGUAGES.map(([id, label]) => (
          <button key={id} className={db.language === id ? 'on' : ''} onClick={() => update({ language: id })}>{label}</button>
        ))}
      </div>

      <section className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark"><Activity size={22} /></span>
          <b>{t('app.name')}</b>
        </div>
        <h1>{t(isLogin ? 'auth.loginTitle' : 'auth.signupTitle')}</h1>
        <p className="muted">{t(isLogin ? 'auth.loginLead' : 'auth.signupLead')}</p>

        <Segmented
          value={mode}
          onChange={setMode}
          options={[{ value: 'login', label: t('auth.tabLogin') }, { value: 'signup', label: t('auth.tabSignup') }]}
        />

        {isLogin ? <LoginForm /> : <SignupForm />}
      </section>
      <p className="muted auth-note">{t('auth.localNote')}</p>
    </main>
  );
}
