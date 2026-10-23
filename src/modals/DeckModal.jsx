// Deck editor: a named bundle of exercises (with sets/reps) a trainer can drop into any program.
import { Save } from 'lucide-react';
import ExercisePlanner from '../components/exercise/ExercisePlanner.jsx';
import { Field } from '../components/ui/Field.jsx';
import Sheet from '../components/ui/Sheet.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function DeckModal({ editing }) {
  const { db, draft, setDraft, saveDeck, t } = useApp();
  return (
    <Sheet title={t(editing ? 'deck.edit' : 'deck.new')}>
      <Field label={t('deck.name')} value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
      <Field label={t('deck.desc')} value={draft.desc} onChange={(desc) => setDraft({ ...draft, desc })} />
      <ExercisePlanner exercises={db.exercises} draft={draft} setDraft={setDraft} />
      <button className="btn wide" onClick={saveDeck}>
        <Save size={17} /> {t('deck.save')}
      </button>
    </Sheet>
  );
}
