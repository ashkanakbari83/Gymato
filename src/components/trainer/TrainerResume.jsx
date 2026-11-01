// Public view of a trainer's resume, grouped as work history / certificates / awards.
import { Award, Briefcase, GraduationCap } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { num } from '../../lib/format.js';
import { RESUME_KINDS } from '../../lib/domain/trainerProfile.js';

const ICON = { work: Briefcase, certificate: GraduationCap, award: Award };

export default function TrainerResume({ resume }) {
  const { t } = useApp();
  return (
    <div className="resume-groups">
      {RESUME_KINDS.map((kind) => {
        const rows = resume.filter((row) => row.kind === kind).sort((a, b) => (b.year || 0) - (a.year || 0));
        if (!rows.length) return null;
        const Icon = ICON[kind];
        return (
          <section key={kind} aria-labelledby={`resume-${kind}`}>
            <h3 id={`resume-${kind}`}><Icon size={17} aria-hidden="true" /> {t(`resume.kind.${kind}`)}</h3>
            <ul className="resume-list">
              {rows.map((row) => (
                <li key={row.id}>
                  <b>{row.title}</b>
                  <small>{[row.place, row.year ? num(row.year) : ''].filter(Boolean).join(' · ')}</small>
                  {row.text && <p>{row.text}</p>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
