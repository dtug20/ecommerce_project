import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SuggestedActionCard from './SuggestedActionCard';
import { useSubmitChatFeedbackMutation } from '@/redux/features/chat/chatApi';

export default function ChatMessage({ message, sessionId }) {
  const { t } = useTranslation('common');
  const [rated, setRated] = useState(null);
  const [submit] = useSubmitChatFeedbackMutation();

  const rate = async (rating) => {
    if (!message.messageId || rated) return;
    setRated(rating);
    try {
      await submit({ sessionId, messageId: message.messageId, rating }).unwrap();
    } catch (_e) {
      setRated(null);
    }
  };

  return (
    <>
      <div className={`shofy-chat__msg shofy-chat__msg--${message.role}`}>
        {message.content}
      </div>
      {message.suggestedActions &&
        message.suggestedActions.map((a, i) => (
          <SuggestedActionCard key={i} action={a} />
        ))}
      {message.role === 'assistant' && message.messageId && (
        <div className="shofy-chat__feedback">
          <button
            type="button"
            className={rated === 'up' ? 'active' : ''}
            onClick={() => rate('up')}
            aria-label={t('chat.thumbsUp')}
          >
            👍
          </button>
          <button
            type="button"
            className={rated === 'down' ? 'active' : ''}
            onClick={() => rate('down')}
            aria-label={t('chat.thumbsDown')}
          >
            👎
          </button>
        </div>
      )}
    </>
  );
}
