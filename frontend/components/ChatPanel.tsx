import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Send } from 'lucide-react';
import { socket } from '../socket';
import { apiFetch } from '../utils/api';
import '../styles/chat.css';
import { uploadFile } from '../utils/send_file';
import { FileUp } from 'lucide-react';
import useChatStore, { type ChatMessage } from '../utils/chatState';
import useUserStore from '../utils/userStore';

interface Message {
  id: string;
  user: string;
  message: string;
  time: string;
  isOwn?: boolean;
}

// interface ChatPayload {
//   text: string;
//   from?: string;
//   username?: string;
// }

const MOCK_MESSAGES: Message[] = [];

interface ChatPanelProps {
  onClose?: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
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

  const targetUsername = useChatStore((state) => state.targetUsername);
  const targetUsernameRef = useRef<string | null>(null);

  const meUsername = useUserStore((s) => s.user?.username ?? null);

  const setMessagesForUser = useChatStore((s) => s.setMessagesForUser);
  const appendMessageForUser = useChatStore((s) => s.appendMessageForUser);
  const messagesByUser = useChatStore((s) => s.messagesByUser);

  useEffect(() => {
    targetUsernameRef.current = targetUsername;
  }, [targetUsername]);

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

    const onChatMessage = (payload: any) => {
      try {
        const activeTarget = targetUsernameRef.current;

        if (payload && typeof payload === 'object' && 'text' in payload && 'sender' in payload) {
          const senderUsername = payload.sender?.username ?? null;
          const recipientUsername = payload.recipient?.username ?? null;
          const isDirect = Boolean(senderUsername && recipientUsername);

          let otherUsername: string | null = null;
          if (meUsername) {
            if (senderUsername === meUsername) otherUsername = recipientUsername;
            else otherUsername = senderUsername;
          } else {
            otherUsername = senderUsername ?? recipientUsername;
          }

          if (activeTarget) {
            if (!(senderUsername === activeTarget || recipientUsername === activeTarget)) {
              if (otherUsername) {
                const mapped: ChatMessage = {
                  id: payload.id ?? `${Date.now()}-${Math.random()}`,
                  user:
                    payload.sender?.displayname ??
                    payload.sender?.username ??
                    payload.sender?.username ??
                    'Player',
                  message: payload.text,
                  time: new Date(payload.createdAt ?? Date.now()).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  isOwn: Boolean(payload.isOwn),
                };
                appendMessageForUser(otherUsername, mapped);
              }
              return;
            }
          } else {
            if (isDirect) {
              if (otherUsername) {
                const mapped: ChatMessage = {
                  id: payload.id ?? `${Date.now()}-${Math.random()}`,
                  user:
                    payload.sender?.displayname ??
                    payload.sender?.username ??
                    payload.sender?.username ??
                    'Player',
                  message: payload.text,
                  time: new Date(payload.createdAt ?? Date.now()).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  isOwn: Boolean(payload.isOwn),
                };
                appendMessageForUser(otherUsername, mapped);
              }
              return;
            }
          }

          const isOwn = Boolean(payload.isOwn);
          const userName = isOwn
            ? 'You'
            : payload.sender.displayname ?? payload.sender.username ?? 'Player';
          const createdAt = payload.createdAt ? new Date(payload.createdAt) : new Date();

          const mapped: ChatMessage = {
            id: payload.id ?? `${Date.now()}-${Math.random()}`,
            user: userName,
            message: payload.text,
            time: createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn,
          };

          if (otherUsername) appendMessageForUser(otherUsername, mapped);
          setMessages((prev) => [...prev, mapped]);
          return;
        }

        const senderName = payload?.username ?? null;
        const toName = payload?.to ?? null;
        const isDirectFallback = Boolean(toName);

        let otherUsernameFallback: string | null = null;
        if (meUsername) {
          if (senderName === meUsername) otherUsernameFallback = toName;
          else otherUsernameFallback = senderName;
        } else {
          otherUsernameFallback = senderName ?? toName;
        }

        if (activeTarget) {
          if (
            !(
              senderName === activeTarget ||
              toName === activeTarget ||
              (payload?.from === socket.id && toName === activeTarget)
            )
          ) {
            if (otherUsernameFallback) {
              const mapped: ChatMessage = {
                id: `${Date.now()}-${Math.random()}`,
                user: senderName ?? 'Player',
                message: payload.text ?? '',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isOwn: payload.from === socket.id,
              };
              appendMessageForUser(otherUsernameFallback, mapped);
            }
            return;
          }
        } else {
          if (isDirectFallback) {
            if (otherUsernameFallback) {
              const mapped: ChatMessage = {
                id: `${Date.now()}-${Math.random()}`,
                user: senderName ?? 'Player',
                message: payload.text ?? '',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isOwn: payload.from === socket.id,
              };
              appendMessageForUser(otherUsernameFallback, mapped);
            }
            return;
          }
        }

        const isOwn = payload.from === socket.id;
        const userName = isOwn ? 'You' : payload.username ?? 'Player';

        const mappedFallback: ChatMessage = {
          id: `${Date.now()}-${Math.random()}`,
          user: userName,
          message: payload.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn,
        };

        if (otherUsernameFallback) appendMessageForUser(otherUsernameFallback, mappedFallback);
        setMessages((prev) => [...prev, mappedFallback]);
      } catch (e) {
        console.error('Error handling chat message', e);
      }
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

  useEffect(() => {
    let mounted = true;

    async function loadConversation(username: string) {
      try {
        const res = await apiFetch(
          `/api/chat/conversations/${encodeURIComponent(username)}/messages`,
        );
        if (!res.ok) return;
        const data = await res.json();
        const mapped: ChatMessage[] = (data.messages || []).map((m: any) => ({
          id: m.id,
          user: m.isOwn ? 'You' : m.sender.displayname ?? m.sender.username,
          message: m.text ?? '',
          time: new Date(m.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isOwn: Boolean(m.isOwn),
        }));

        setMessagesForUser(username, mapped as ChatMessage[]);
        if (mounted) setMessages(mapped as Message[]);

        try {
          await apiFetch(`/api/chat/conversations/${encodeURIComponent(username)}/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (e) {}
      } catch (e) {
        console.error('Failed to load conversation', e);
      }
    }

    if (targetUsername) {
      const cached = messagesByUser[targetUsername];
      if (cached) setMessages(cached as Message[]);
      else setMessages([]);
      void loadConversation(targetUsername);
    }

    return () => {
      mounted = false;
    };
  }, [targetUsername, messagesByUser, setMessagesForUser]);

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
    socket.emit('chat:message', { text, to: targetUsername ?? undefined });
    setInputValue('');
  };

  return (
    <div className="chat-panel">
      <div className="chat-panel-inner">
        <div className="chat-header">
          <div>
            <p className="chat-title">Live Chat</p>
            <p className="chat-subtitle">
              {targetUsername ? `Chat with @${targetUsername}` : 'Talk with online players'}
            </p>
          </div>

          <div className="chat-header-actions">
            <div className="chat-status-pill">
              <span className={`chat-status-dot ${connected ? 'online' : 'offline'}`} />
              {connected ? 'Connected' : 'Offline'}
            </div>
            {onClose && (
              <button type="button" className="chat-close-btn" onClick={onClose}>
                Close
              </button>
            )}
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
