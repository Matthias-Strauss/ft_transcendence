import { FormEvent, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type ChatMessage = {
  text: string;
  from?: string;
};

export default function SocketTestPage() {
  const socketBaseUrl = useMemo(() => {
    if (window.location.port === '3000') {
      return `${window.location.protocol}//${window.location.hostname}:8080`;
    }
    return window.location.origin;
  }, []);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const s = io(socketBaseUrl, {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket'],
    });

    const onConnect = () => {
      setConnected(true);
      setMessages((prev) => [...prev, `connected: ${s.id}`]);
    };

    const onDisconnect = () => {
      setConnected(false);
      setMessages((prev) => [...prev, 'disconnected']);
    };

    const onChatMessage = (payload: ChatMessage) => {
      const from = payload.from ?? 'unknown';
      setMessages((prev) => [...prev, `received from ${from}: ${payload.text}`]);
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('chat:message', onChatMessage);

    setSocket(s);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('chat:message', onChatMessage);
      s.disconnect();
    };
  }, [socketBaseUrl]);

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    const text = inputText.trim();

    if (!text || !socket) {
      return;
    }

    socket.emit('chat:message', { text });
    setMessages((prev) => [...prev, `sent: ${text}`]);
    setInputText('');
  };

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 16 }}>
      <h1>Socket.IO Chat Test</h1>
      <p>Backend URL: {socketBaseUrl}</p>
      <p>Status: {connected ? 'connected' : 'disconnected'}</p>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" disabled={!connected}>
          Send
        </button>
      </form>

      <div
        style={{
          border: '1px solid #999',
          borderRadius: 8,
          minHeight: 220,
          padding: 12,
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
        }}
      >
        {messages.length === 0 ? 'No events yet.' : messages.join('\n')}
      </div>
    </div>
  );
}
