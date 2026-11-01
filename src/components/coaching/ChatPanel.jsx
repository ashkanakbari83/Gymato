// Demo chat between an athlete and a trainer. Messages live in local state (not a real-time service).
import { Lock, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { formatDateTime } from '../../lib/format.js';
import { getConversation, getMessages } from '../../lib/marketplace.js';

/** `state`: 'open' (can write), 'readonly' (history only), 'locked' (not accepted yet). */
export default function ChatPanel({ request, state }) {
  const { db, user, postMessage, t } = useApp();
  const [text, setText] = useState('');
  const endRef = useRef(null);
  const conversation = getConversation(db, request.id);
  const messages = conversation ? getMessages(db, conversation.id) : [];

  useEffect(() => { endRef.current?.scrollIntoView?.({ block: 'nearest' }); }, [messages.length]);

  if (state === 'locked' || !conversation) {
    return (
      <section className="co-section chat locked">
        <h3>{t('chat.title')}</h3>
        <p className="locked-note">
          <Lock size={16} /> {t('chat.locked')}
        </p>
      </section>
    );
  }

  const send = (event) => {
    event.preventDefault();
    if (postMessage(conversation.id, text).ok) setText('');
  };

  return (
    <section className="co-section chat">
      <h3>{t('chat.title')}</h3>
      <p className="muted">{t('chat.demoNote')}</p>
      <div className="chat-log" role="log">
        {messages.map((m) =>
          m.kind === 'system' ? (
            <p className="chat-system" key={m.id}>
              {t(m.systemKey)}
            </p>
          ) : (
            <div key={m.id} className={`bubble ${m.senderId === user.id ? 'mine' : 'theirs'}`}>
              <span>{m.text}</span>
              <small>{formatDateTime(m.createdAt)}</small>
            </div>
          ),
        )}
        <span ref={endRef} />
      </div>
      {state === 'open' ? (
        <form className="chat-form" onSubmit={send}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('chat.placeholder')} maxLength={2000} />
          <button className="btn" type="submit" disabled={!text.trim()} aria-label={t('chat.send')}>
            <Send size={16} />
          </button>
        </form>
      ) : (
        <p className="locked-note">
          <Lock size={16} /> {t('chat.readonly')}
        </p>
      )}
    </section>
  );
}
