// Trainer: manage general programs (publish, edit, unpublish, delete) and decks.
// Buyers are listed as customers; they are not coaching clients.
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import ProgramListing from '../components/marketplace/ProgramListing.jsx';
import Badge from '../components/ui/Badge.jsx';
import Empty from '../components/ui/Empty.jsx';
import { useApp } from '../context/AppContext.jsx';
import { PROGRAM_STATUS } from '../lib/constants.js';
import { num } from '../lib/format.js';
import { getBuyers, getOwnPrograms } from '../lib/marketplace.js';
import { CalendarDays } from 'lucide-react';

function Buyers({ programId }) {
  const { db, lang, t } = useApp();
  const buyers = getBuyers(db, programId);
  const saved = db.freeLibrary.filter((e) => e.programId === programId).length;
  if (!buyers.length && !saved) return null;
  return (
    <p className="muted buyers">
      {buyers.length > 0 && t('programs.buyers', { n: num(buyers.length), names: buyers.map((b) => b.name).join(lang === 'fa' ? '، ' : ', ') })}
      {saved > 0 && t('programs.savedBy', { n: num(saved) })}
    </p>
  );
}

export default function TrainerProgramsPage() {
  const { db, user, openGeneralEditor, setStatus, removeProgram, openDeckForm, t } = useApp();
  const programs = getOwnPrograms(db, user.id);
  const decks = db.decks.filter((d) => d.owner === user.id);

  return (
    <section className="stack">
      <p className="muted">{t('programs.generalHelp')}</p>
      <div className="grid-cards">
        {programs.map((program) => {
          const published = program.status === PROGRAM_STATUS.PUBLISHED;
          return (
            <ProgramListing
              key={program.id}
              program={program}
              owner
              status={<Badge tone={published ? 'ok' : 'warn'}>{t(`programStatus.${program.status}`)}</Badge>}
              onOpen={() => openGeneralEditor(program)}
            >
              <Buyers programId={program.id} />
              <button className="btn ghost" onClick={() => openGeneralEditor(program)}><Pencil size={15} /> {t('common.edit')}</button>
              <button className="btn ghost" onClick={() => setStatus(program.id, published ? PROGRAM_STATUS.DRAFT : PROGRAM_STATUS.PUBLISHED)}>
                {published ? <EyeOff size={15} /> : <Eye size={15} />} {t(published ? 'gp.unpublish' : 'gp.publish')}
              </button>
              <button className="btn danger" onClick={() => removeProgram(program.id)} aria-label={t('common.delete')}><Trash2 size={15} /></button>
            </ProgramListing>
          );
        })}
      </div>
      {!programs.length && <Empty icon={CalendarDays} title={t('programs.emptyTrainerTitle')} text={t('programs.emptyTrainerText')} actionLabel={t('programs.newGeneral')} onAction={() => openGeneralEditor()} />}

      <div className="section-title sec-gap">
        <div>
          <h2>{t('deck.title')}</h2>
          <p>{t('deck.help')}</p>
        </div>
        <button className="btn ghost" onClick={() => openDeckForm()}><Plus size={18} /> {t('deck.new')}</button>
      </div>
      {decks.length ? (
        <div className="grid-cards">
          {decks.map((deck) => (
            <article className="card deck" key={deck.id}>
              <h3>{deck.name}</h3>
              <p className="muted">{t('home.moves', { n: num(deck.exercises.length) })}{deck.desc ? ` · ${deck.desc}` : ''}</p>
              <div className="btns"><button className="btn ghost" onClick={() => openDeckForm(deck)}>{t('common.edit')}</button></div>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">{t('deck.empty')}</p>
      )}
    </section>
  );
}
