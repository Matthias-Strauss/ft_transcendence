import { FormEvent, useEffect, useState } from 'react';
import { connectSocketFromStorage, socket } from '../socket';

type ChatMessage = {
  text: string;
  from?: string;
};

export default function SocketTestPage() {
  const [connected, setConnected] = useState(socket.connected);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
      setMessages((prev) => [...prev, `connected: ${socket.id}`]);
    };

    const onDisconnect = () => {
      setConnected(false);
      setMessages((prev) => [...prev, 'disconnected']);
    };

    const onChatMessage = (payload: ChatMessage) => {
      const from = payload.from ?? 'unknown';
      setMessages((prev) => [...prev, `received from ${from}: ${payload.text}`]);
    };

    const onWelcome = (message: string) => {
      setMessages((prev) => [...prev, `welcome: ${message}`]);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat:message', onChatMessage);
    socket.on('welcome', onWelcome);
    connectSocketFromStorage();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat:message', onChatMessage);
      socket.off('welcome', onWelcome);
    };
  }, []);

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    const text = inputText.trim();

    if (!text || !connected) {
      return;
    }

    socket.emit('chat:message', { text });
    setMessages((prev) => [...prev, `sent: ${text}`]);
    setInputText('');
  };

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 16 }}>
      <h1>Socket.IO Chat Test</h1>
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
