import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { useSelector } from 'react-redux';
import { getSocket } from '@/utils/socketClient';
import { useSendChatMessageMutation } from '@/redux/features/chat/chatApi';

const SESSION_KEY = 'shofy_chat_session';

function getOrCreateSessionId() {
  if (typeof window === 'undefined') return uuidv4();
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function useChatSession() {
  const { i18n } = useTranslation('common');
  const [sessionId, setSessionId] = useState(() => getOrCreateSessionId());
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const streamingTextRef = useRef('');
  const cart = useSelector((s) => s.cart.cart_products);
  const [sendMessageMutation] = useSendChatMessageMutation();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    socket.emit('chat:join', { sessionId });

    const onToken = (payload) => {
      if (payload.sessionId !== sessionId) return;
      streamingTextRef.current += payload.token || '';
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant' && last.streaming) {
          return [
            ...prev.slice(0, -1),
            { ...last, content: streamingTextRef.current },
          ];
        }
        return [
          ...prev,
          {
            role: 'assistant',
            content: streamingTextRef.current,
            streaming: true,
          },
        ];
      });
    };

    const onDone = (payload) => {
      if (payload.sessionId !== sessionId) return;
      setIsStreaming(false);
      const finalText = payload.text || streamingTextRef.current;
      streamingTextRef.current = '';
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant' && last.streaming) {
          return [
            ...prev.slice(0, -1),
            {
              role: 'assistant',
              content: finalText,
              suggestedActions: payload.suggestedActions || [],
              messageId: payload.messageId,
            },
          ];
        }
        return [
          ...prev,
          {
            role: 'assistant',
            content: finalText,
            suggestedActions: payload.suggestedActions || [],
            messageId: payload.messageId,
          },
        ];
      });
    };

    const onError = (payload) => {
      if (payload.sessionId !== sessionId) return;
      setIsStreaming(false);
      streamingTextRef.current = '';
      setError(payload.error || 'errorGeneric');
    };

    socket.on('chat:token', onToken);
    socket.on('chat:done', onDone);
    socket.on('chat:error', onError);

    return () => {
      socket.emit('chat:leave', { sessionId });
      socket.off('chat:token', onToken);
      socket.off('chat:done', onDone);
      socket.off('chat:error', onError);
    };
  }, [sessionId]);

  const sendMessage = useCallback(
    async (text) => {
      if (!text || !text.trim() || isStreaming) return;
      setError(null);
      setMessages((prev) => [...prev, { role: 'user', content: text }]);
      setIsStreaming(true);
      streamingTextRef.current = '';
      try {
        await sendMessageMutation({
          sessionId,
          message: text,
          locale: i18n.language || 'en',
          cartSnapshot: cart.map((c) => ({
            productId: c._id,
            title: c.title,
            price: c.price,
            qty: c.orderQuantity || 1,
          })),
        }).unwrap();
      } catch (e) {
        setIsStreaming(false);
        setError(
          e?.data?.error?.code || e?.data?.message || 'errorGeneric'
        );
      }
    },
    [sessionId, i18n.language, cart, sendMessageMutation, isStreaming]
  );

  const reset = useCallback(() => {
    const id = uuidv4();
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, id);
    }
    setSessionId(id);
    setMessages([]);
    setError(null);
    streamingTextRef.current = '';
  }, []);

  return { sessionId, messages, isStreaming, error, sendMessage, reset };
}
