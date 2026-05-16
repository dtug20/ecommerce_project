import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useChatSession from '@/hooks/useChatSession';
import ChatBubble from './ChatBubble';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

export default function ChatWidget() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { sessionId, messages, isStreaming, error, sendMessage, reset } =
    useChatSession();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  if (!open) return <ChatBubble onClick={() => setOpen(true)} />;

  const lastIsAssistant =
    messages.length > 0 && messages[messages.length - 1].role === 'assistant';

  return (
    <div className="shofy-chat__panel" role="dialog" aria-label={t('chat.title')}>
      <div className="shofy-chat__header">
        <span>{t('chat.title')}</span>
        <div>
          <button
            type="button"
            onClick={reset}
            aria-label={t('chat.newSession')}
            title={t('chat.newSession')}
          >
            ↻
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('chat.close')}
            title={t('chat.close')}
            style={{ marginLeft: 8 }}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="shofy-chat__messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="shofy-chat__msg shofy-chat__msg--assistant">
            {t('chat.welcome')}
          </div>
        )}
        {messages.map((m, i) => (
          <ChatMessage key={i} message={m} sessionId={sessionId} />
        ))}
        {isStreaming && !lastIsAssistant && (
          <div className="shofy-chat__thinking">{t('chat.thinking')}</div>
        )}
        {error && (
          <div
            className="shofy-chat__msg shofy-chat__msg--assistant"
            style={{ color: '#c00' }}
          >
            {t(`chat.${error}`, { defaultValue: t('chat.errorGeneric') })}
          </div>
        )}
      </div>

      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
