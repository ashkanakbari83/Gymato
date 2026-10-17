// Athlete profile: public ID to share with a coach and editable body info.
import { Copy, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Field, SelectField } from '../components/ui/Field';
import { useApp } from '../context/AppContext';
import { LEVELS } from '../lib/constants';

const toForm = (user) => ({
  name: user.name,
  goal: user.goal || '',
  level: user.level || LEVELS[0],
  height: user.height || '',
  weight: user.weight || '',
});

export default function ProfilePage() {
  const { user, update, notify } = useApp();
  const [form, setForm] = useState(() => toForm(user));
  const [copied, setCopied] = useState(false);
  useEffect(() => setForm(toForm(user)), [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const copyId = () => {
    navigator.clipboard?.writeText(user.publicId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const save = () => {
    const changes = { ...form, height: Number(form.height) || '', weight: Number(form.weight) || '' };
    update((d) => ({ users: d.users.map((u) => (u.id === user.id ? { ...u, ...changes } : u)) }));
    notify('پروفایل به‌روزرسانی شد');
  };

  return (
    <div className="stack narrow">
      <section className="panel">
        <div className="id-row">
          <div>
            <small className="muted">شناسه حساب</small>
            <b className="pid">{user.publicId}</b>
          </div>
          <button className="btn ghost" onClick={copyId}>
            <Copy size={16} /> {copied ? 'کپی شد' : 'کپی'}
          </button>
        </div>
        <p className="muted">این شناسه را به مربی‌ات بده تا تو را اضافه کند.</p>
      </section>

      <section className="panel">
        <div className="form-grid">
          <Field label="نام" value={form.name} onChange={set('name')} />
          <SelectField label="سطح" value={form.level} onChange={set('level')} options={LEVELS} />
          <Field label="قد (cm)" type="number" value={form.height} onChange={set('height')} />
          <Field label="وزن (kg)" type="number" value={form.weight} onChange={set('weight')} />
        </div>
        <Field label="هدف" value={form.goal} onChange={set('goal')} />
        <button className="btn wide" onClick={save}>
          <Save size={17} /> ذخیره
        </button>
      </section>
    </div>
  );
}
