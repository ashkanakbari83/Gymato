import { Check, Target, Users } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DEMO_ACCOUNTS } from '../lib/constants';
import Stickman from './exercise/Stickman';
import Sheet from './ui/Sheet';

const STEPS = [
  {
    id: 'welcome',
    art: <Stickman id="jacks" />,
    title: 'به جیماتو خوش آمدی',
    lead: 'جیماتو دو سمت دارد: مربی برنامه می‌نویسد و ورزشکار تمرین می‌کند. در یک دقیقه ببین چطور کار می‌کند.',
  },
  {
    id: 'coach',
    icon: Users,
    title: 'اگر مربی هستی',
    points: [
      'هر حساب یک شناسه یکتا دارد؛ شناسه ورزشکار را وارد کن تا شاگردت شود.',
      'برنامه را از بانک حرکات بساز و ست و تکرار هر حرکت را خودت تعیین کن. با دک‌ها سریع‌تر می‌شود.',
      'پیشرفت شاگردها را ببین. تا سه شاگرد رایگان است.',
    ],
  },
  {
    id: 'athlete',
    art: <Stickman id="pushup" />,
    title: 'اگر ورزشکاری',
    points: [
      'مربی‌ات را انتخاب کن یا شناسه‌ات را به او بده تا برنامه را برایت ثبت کند.',
      'تمرین را شروع کن؛ انیمیشن حرکت، توضیح، تایمر و ست‌ها راهنمای تو هستند.',
      'پیشرفتت را ببین: مجموع هر حرکت و هدف بعدی.',
    ],
  },
  {
    id: 'start',
    icon: Target,
    title: 'از کدام سمت شروع کنیم؟',
    lead: 'یکی از پروفایل‌های نمونه را باز می‌کنیم. بعداً از بالای صفحه می‌توانی بینشان جابه‌جا شوی.',
    roles: true,
  },
];

const ROLE_CHOICES = [
  { id: 'coach', title: 'مربی‌ام', hint: 'شاگرد و برنامه مدیریت کنم' },
  { id: 'athlete', title: 'ورزشکارم', hint: 'تمرین کنم و پیشرفتم را ببینم' },
];

/** First-run guide shown as a dialog. Can be reopened from Settings. */
export default function Onboarding() {
  const { onboarding, update, setPage } = useApp();
  const [index, setIndex] = useState(0);
  if (!onboarding.open) return null;

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;
  const Icon = step.icon;

  const startAs = (role) => {
    update({ activeUser: DEMO_ACCOUNTS[role] });
    setPage('home');
    onboarding.finish();
  };

  return (
    <Sheet onClose={onboarding.finish} bodyClassName="ob">
      <div className="ob-art">
        {step.art ?? (
          <span className="ob-icon">
            <Icon size={34} />
          </span>
        )}
      </div>

      <h2>{step.title}</h2>
      {step.lead && <p className="ob-lead">{step.lead}</p>}
      {step.points && (
        <ul className="ob-points">
          {step.points.map((point) => (
            <li key={point}>
              <Check size={18} />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}

      {step.roles && (
        <div className="ob-roles">
          {ROLE_CHOICES.map(({ id, title, hint }) => (
            <button key={id} onClick={() => startAs(id)}>
              <b>{title}</b>
              <small>{hint}</small>
            </button>
          ))}
        </div>
      )}

      <div className="ob-foot">
        {isLast ? <span /> : (
          <button className="ob-skip" onClick={onboarding.finish}>
            رد کردن
          </button>
        )}
        <div className="ob-dots" aria-hidden="true">
          {STEPS.map((s, i) => (
            <i key={s.id} className={i === index ? 'on' : ''} />
          ))}
        </div>
        <div className="btns">
          {index > 0 && (
            <button className="btn ghost" onClick={() => setIndex(index - 1)}>
              قبلی
            </button>
          )}
          {!isLast && (
            <button className="btn" onClick={() => setIndex(index + 1)}>
              بعدی
            </button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
