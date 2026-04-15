import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Send, FileUp } from 'lucide-react';
import { socket } from '../socket';
import { apiFetch } from '../utils/api';
import '../styles/chat.css';
import { uploadFile as uploadFileRaw } from '../utils/send_file';

const uploadFile = (
  file: File,
  opts?: { onProgress?: (percent: number) => void; onComplete?: () => void },
) => (uploadFileRaw as unknown as (file: File, opts?: any) => any)(file, opts);
import useChatStore, { type ChatMessage } from '../utils/chatState';
import useUserStore from '../utils/userStore';
import showToast from '../utils/toast';

interface ChatPanelProps {
  onClose?: () => void;
}

interface NormalizedIncomingMessage {
  chatMessage: ChatMessage;
  otherUsername: string | null;
  senderUsername: string | null;
  recipientUsername: string | null;
  isDirect: boolean;
}

function formatTime(value?: string | number | Date) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function mapApiMessageToChatMessage(m: any): ChatMessage {
  return {
    id: m.id,
    user: m.isOwn ? 'You' : m.sender?.displayname ?? m.sender?.username ?? 'Player',
    message: m.text ?? '',
    time: formatTime(m.createdAt),
    isOwn: Boolean(m.isOwn),
    metadata: m.metadata ?? undefined,
  };
}

function normalizeIncomingPayload(
  payload: any,
  meUsername: string | null,
): NormalizedIncomingMessage | null {
  if (!payload || typeof payload !== 'object') return null;

  if ('text' in payload && 'sender' in payload) {
    const senderUsername = payload.sender?.username ?? null;
    const recipientUsername = payload.recipient?.username ?? null;
    const isOwn = Boolean(payload.isOwn);
    const isDirect = Boolean(senderUsername && recipientUsername);

    let otherUsername: string | null = null;
    if (senderUsername && recipientUsername) {
      otherUsername = isOwn ? recipientUsername : senderUsername;
    } else if (meUsername) {
      otherUsername = senderUsername === meUsername ? recipientUsername : senderUsername;
    } else {
      otherUsername = senderUsername ?? recipientUsername;
    }

    if (senderUsername && recipientUsername && senderUsername === recipientUsername) {
      return null;
    }

    return {
      chatMessage: {
        id: payload.id ?? `${Date.now()}-${Math.random()}`,
        user: isOwn ? 'You' : payload.sender?.displayname ?? payload.sender?.username ?? 'Player',
        message: payload.text ?? '',
        time: formatTime(payload.createdAt),
        isOwn,
        metadata: payload.metadata ?? undefined,
      },
      otherUsername,
      senderUsername,
      recipientUsername,
      isDirect,
    };
  }

  const senderUsername = payload.username ?? null;
  const recipientUsername = payload.to ?? null;
  const isOwn = payload.from === socket.id;
  const isDirect = Boolean(recipientUsername);

  let otherUsername: string | null = null;
  if (meUsername) {
    otherUsername = senderUsername === meUsername ? recipientUsername : senderUsername;
  } else {
    otherUsername = senderUsername ?? recipientUsername;
  }

  return {
    chatMessage: {
      id: payload.id ?? `${Date.now()}-${Math.random()}`,
      user: isOwn ? 'You' : senderUsername ?? 'Player',
      message: payload.text ?? '',
      time: formatTime(),
      isOwn,
      metadata: payload.metadata ?? undefined,
    },
    otherUsername,
    senderUsername,
    recipientUsername,
    isDirect,
  };
}

function shouldShowMessageInActiveChat(
  activeTarget: string | null,
  senderUsername: string | null,
  recipientUsername: string | null,
) {
  if (!activeTarget) return false;

  return senderUsername === activeTarget || recipientUsername === activeTarget;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [connected, setConnected] = useState(socket.connected);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const targetUsernameRef = useRef<string | null>(null);

  const targetUsername = useChatStore((state) => state.targetUsername);
  const messagesByUser = useChatStore((s) => s.messagesByUser);
  const setMessagesForUser = useChatStore((s) => s.setMessagesForUser);
  const appendMessageForUser = useChatStore((s) => s.appendMessageForUser);
  const clearTargetUsername = useChatStore((s) => s.clearTargetUsername);

  const meUsername = useUserStore((s) => s.user?.username ?? null);

  const activeMessages = targetUsername ? messagesByUser[targetUsername] ?? [] : [];

  const shortenFileName = (name: string, maxLength = 20) => {
    if (name.length <= maxLength) return name;
    return `${name.slice(0, maxLength - 3)}...`;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  useEffect(() => {
    targetUsernameRef.current = targetUsername;
  }, [targetUsername]);

  useEffect(() => {
    if (!targetUsername || !meUsername) {
      return;
    }

    if (targetUsername !== meUsername) {
      return;
    }

    clearTargetUsername();
    showToast('You cannot chat with yourself', 'error');
  }, [clearTargetUsername, meUsername, targetUsername]);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onChatMessage = (payload: any) => {
      try {
        const activeTarget = targetUsernameRef.current;
        const normalized = normalizeIncomingPayload(payload, meUsername);

        if (!normalized) return;

        const { chatMessage, otherUsername, senderUsername, recipientUsername, isDirect } =
          normalized;

        if (otherUsername) {
          appendMessageForUser(otherUsername, chatMessage);
        }

        if (activeTarget) {
          const shouldShow = shouldShowMessageInActiveChat(
            activeTarget,
            senderUsername,
            recipientUsername,
          );

          if (!shouldShow) return;
          return;
        }

        if (!activeTarget && isDirect) {
          return;
        }
      } catch (e) {
        showToast('Error handling chat message', 'error');
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat:message', onChatMessage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat:message', onChatMessage);
    };
  }, [appendMessageForUser, meUsername]);

  useEffect(() => {
    let mounted = true;

    async function loadConversation(username: string) {
      try {
        const res = await apiFetch(
          `/api/chat/conversations/${encodeURIComponent(username)}/messages`,
        );
        if (!res.ok) return;

        const data = await res.json();
        const mapped: ChatMessage[] = (data.messages || []).map(mapApiMessageToChatMessage);

        if (!mounted) return;

        setMessagesForUser(username, mapped);

        try {
          await apiFetch(`/api/chat/conversations/${encodeURIComponent(username)}/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
        } catch {
          // ignore read-mark errors
        }
      } catch (e) {
        showToast('Failed to load conversation', 'error');
      }
    }

    if (targetUsername && targetUsername !== meUsername) {
      void loadConversation(targetUsername);
    }

    return () => {
      mounted = false;
    };
  }, [meUsername, targetUsername, setMessagesForUser]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && targetUsername) {
      setFile(selectedFile);
      setIsUploading(true);
      uploadFileRaw(selectedFile, targetUsername, {
        onProgress: (percent: number) => setProgress(percent),
        onComplete: () => setIsUploading(false),
      })
        .then(() => {
          // Send a chat message with the file info
          setFile(null);
          setProgress(0);
        })
        .catch(() => {
          setIsUploading(false);
          setFile(null);
          setProgress(0);
        });
    }
    e.target.value = '';
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || !connected || !targetUsername) return;

    if (meUsername && targetUsername === meUsername) {
      showToast('You cannot chat with yourself', 'error');
      return;
    }

    socket.emit('chat:message', {
      text,
      to: targetUsername,
    });

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
            {activeMessages.map((msg) => {
              const fileUrl = msg.metadata?.fileUrl;
              const fileName = msg.metadata?.originalName;
              return (
                <div key={msg.id} className={`chat-message-row ${msg.isOwn ? 'own' : 'other'}`}>
                  <div className="chat-message-meta">
                    <span className="chat-message-user">{msg.user}</span>
                    <span className="chat-message-time">{msg.time}</span>
                  </div>

                  <div
                    className={`chat-bubble ${msg.isOwn ? 'chat-bubble-own' : 'chat-bubble-other'}`}
                  >
                    {fileUrl ? (
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                        📎 {fileName || 'Download file'}
                      </a>
                    ) : (
                      msg.message
                    )}
                  </div>
                </div>
              );
            })}
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
