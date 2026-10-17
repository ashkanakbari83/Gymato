// Program card. Coaches get edit / copy / assign, athletes get a start button.
import { Copy, Play } from 'lucide-react';
import { faNum } from '../lib/format';

export default function ProgramCard({ program, isCoach, assigned, onEdit, onCopy, onStart, onAssign }) {
  return (
    <article className="card prog">
      <div className="prog-top">
        <span className={assigned ? 'tag live' : 'tag'}>{assigned ? 'فعال' : program.status || 'قالب'}</span>
        {isCoach && (
          <button className="icon-btn sm" onClick={onCopy} aria-label="کپی برنامه">
            <Copy size={16} />
          </button>
        )}
      </div>

      <h3>{program.name}</h3>
      <p className="muted">
        {program.goal} · {faNum(program.days)} روز در هفته · {faNum(program.weeks)} هفته
      </p>

      <div className="prog-foot">
        <span className="muted">{faNum(program.exercises?.length ?? 0)} حرکت</span>
        <div className="btns">
          {isCoach ? (
            <>
              <button className="btn ghost" onClick={onEdit}>
                ویرایش
              </button>
              <button className="btn" onClick={onAssign}>
                تخصیص
              </button>
            </>
          ) : (
            <button className="btn" onClick={onStart}>
              <Play size={16} fill="currentColor" /> شروع
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
