import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Send } from 'lucide-react';
import { socket } from '../socket';
import '../styles/chat.css';
import { uploadFile } from '../utils/send_file';
import { FileUp } from 'lucide-react';

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
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const shortenFileName = (name: string, maxLength = 20) => {
    if (name.length <= maxLength) {
      return name;
    }

    return `${name.slice(0, maxLength - 3)}...`;
  };

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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setProgress(0);
      setIsUploading(true);

      uploadFile(file, {
        onProgress: (percent) => setProgress(percent),
        onComplete: () => setIsUploading(false),
      });
    }
    e.target.value = '';
  };
  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || !connected) return;
    socket.emit('chat:message', { text, to: socket.id });
    setInputValue('');
  };

  return (
    <div className="chat-panel">
      <div className="chat-panel-inner">
        <div className="chat-header">
          <div>
            <p className="chat-title">Live Chat</p>
            <p className="chat-subtitle">Talk with online players</p>
          </div>

          <div className="chat-status-pill">
            <span className={`chat-status-dot ${connected ? 'online' : 'offline'}`} />
            {connected ? 'Connected' : 'Offline'}
          </div>
        </div>

        <div className="chat-messages-wrap">
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message-row ${msg.isOwn ? 'own' : 'other'}`}>
                <div className="chat-message-meta">
                  <span className="chat-message-user">{msg.user}</span>
                  <span className="chat-message-time">{msg.time}</span>
                </div>
                <div
                  className={`chat-bubble ${msg.isOwn ? 'chat-bubble-own' : 'chat-bubble-other'}`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="chat-input-wrap">
          <div className="chat-input-row">
            <input
              type="text"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="chat-input"
            />
            <label className="cursor-pointer text-xl hover:opacity-80 transition">
              <FileUp className="size-6 text-[#8b98a5]" />

              <input
                type="file"
                accept=".doc,.docx,.pdf,video/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
            <button
              onClick={handleSend}
              disabled={!connected}
              className="chat-send-btn"
              aria-label="Send message"
            >
              <Send className="chat-send-icon" />
            </button>
          </div>

          {file && (
            <div className="chat-upload-meta">
              <span className="chat-upload-name" title={file.name}>
                {shortenFileName(file.name)}
              </span>
              <span className="chat-upload-percent">{progress}%</span>
            </div>
          )}

          {(isUploading || progress === 100) && (
            <progress
              id="uploadProgress"
              value={progress}
              max="100"
              className="chat-upload-progress"
            >
              {progress}%
            </progress>
          )}
        </div>
      </div>
    </div>
  );
}
