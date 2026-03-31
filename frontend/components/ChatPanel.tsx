import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { connectSocketFromStorage, socket } from '../socket';

interface Message {
  id: string;
  user: string;
  message: string;
  time: string;
  isOwn?: boolean;
}

interface ChatPayload {
  text: string;
  from?: string;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    user: 'seagull',
    message: 'Ready to play?',
    time: '2:30 PM',
    isOwn: false,
  },
  {
    id: '2',
    user: 'You',
    message: "Yeah! Let's go",
    time: '2:31 PM',
    isOwn: true,
  },
  {
    id: '3',
    user: 'seagull',
    message: 'You still here?',
    time: '2:31 PM',
    isOwn: false,
  },
];

interface User {
  id: string;
  username: string;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onWelcome = (message: string) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-welcome`,
          user: 'System',
          message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn: false,
        },
      ]);
    };

    const onChatMessage = (payload: ChatPayload) => {
      const isOwn = payload.from === socket.id;
      const userName = isOwn ? 'You' : payload.from ?? 'Player';

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          user: userName,
          message: payload.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn,
        },
      ]);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('welcome', onWelcome);
    socket.on('chat:message', onChatMessage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('welcome', onWelcome);
      socket.off('chat:message', onChatMessage);
    };
  }, []);
  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || !connected) return;
    socket.emit('chat:message', { text, to: socket.id });
    setInputValue('');
  };
  return (
    <div className="flex flex-col h-full bg-[#1e293b] rounded-2xl border border-[#39444d] overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-[#39444d]">
        <h3 className="font-bold text-[17px] text-[#f7f9f9]">Game Chat</h3>
        <p className="text-[13px] text-[#8b98a5]">{connected ? 'Connected' : 'Disconnected'}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[13px] font-medium text-[#f7f9f9]">{msg.user}</span>
              <span className="text-[11px] text-[#8b98a5]">{msg.time}</span>
            </div>
            <div
              className={`px-3 py-2 rounded-lg max-w-[80%] ${
                msg.isOwn ? 'bg-[var(--color-1)] text-[#f7f9f9]' : 'bg-[#334155] text-[#f7f9f9]'
              }`}
            >
              <p className="text-[14px]">{msg.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#39444d]">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-[#334155] border border-[#39444d] rounded-full py-2 px-4 text-[14px] text-[#f7f9f9] placeholder:text-[#8b98a5] focus:outline-none focus:border-[var(--color-1)]"
          />
          <button
            onClick={handleSend}
            disabled={!connected}
            className="p-2 rounded-full transition-colors"
            style={{
              background: 'var(--color-1)',
            }}
          >
            <Send className="size-5 text-[#f7f9f9]" />
          </button>
        </div>
      </div>
    </div>
  );
}
