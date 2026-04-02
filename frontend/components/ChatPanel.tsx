import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { socket } from '../socket';

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
  username?: string;
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

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [connected, setConnected] = useState(socket.connected);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      const userName = isOwn ? 'You' : payload.username ?? 'Player';

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
    <div className="relative h-full w-full overflow-hidden rounded-[20px] border border-[#dbe3ee] bg-white shadow-[0_14px_50px_rgba(2,8,23,0.18)]">
      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
          <div>
            <p className="text-[14px] font-semibold text-[#0f172a]">Live Chat</p>
            <p className="text-[12px] text-[#64748b]">Talk with online players</p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[#dbe3ee] bg-[#f8fafc] px-2 py-1 text-[11px] text-[#334155]">
            <span
              className={`size-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-rose-400'}`}
            />
            {connected ? 'Connected' : 'Offline'}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#334155] [&::-webkit-scrollbar]:w-2">
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex w-full flex-col gap-1.5 ${
                  msg.isOwn ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-[#0f172a]">{msg.user}</span>
                  <span className="text-[11px] text-[#64748b]">{msg.time}</span>
                </div>
                <div
                  className={`max-w-[82%] rounded-2xl px-3 py-2 text-[14px] leading-relaxed ${
                    msg.isOwn
                      ? 'rounded-tr-md bg-[var(--color-1)] text-[#f8fafc] shadow-[0_8px_24px_rgba(14,116,144,0.35)]'
                      : 'rounded-tl-md border border-[#dbe3ee] bg-[#f1f5f9] text-[#0f172a]'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="mt-auto border-t border-[#e2e8f0] bg-white p-3">
          <div className="flex h-[42px] w-full items-center gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="h-full flex-1 rounded-full border border-[#cbd5e1] bg-white px-4 text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[var(--color-1)] focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!connected}
              className="flex h-full w-[42px] items-center justify-center rounded-full bg-[var(--color-1)] text-[#f8fafc] transition-colors hover:bg-[var(--color-1)]/90 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
