import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ChatInput({ onSend, disabled }) {
  const { t } = useTranslation('common');
  const [text, setText] = useState('');

  const submit = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="shofy-chat__input">
      <textarea
        rows={1}
        placeholder={t('chat.placeholder')}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        maxLength={2000}
        disabled={disabled}
      />
      <button type="button" onClick={submit} disabled={disabled || !text.trim()}>
        {t('chat.send')}
      </button>
    </div>
  );
}
