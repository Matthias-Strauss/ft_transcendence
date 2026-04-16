import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Send, FileUp } from 'lucide-react';
import { socket } from '../socket';
import { apiFetch } from '../utils/api';
import '../styles/chat.css';
import { uploadFile } from '../utils/send_file';
import useChatStore, {
  type ChatMessage,
  type PongInviteMetadata,
  type PongNotificationMetadata,
} from '../utils/chatState';
import useUserStore from '../utils/userStore';
import showToast from '../utils/toast';
import { AuthedFilePreview } from './ui/AuthedFilePreview';
import { Download } from 'lucide-react';
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

function isPongInviteMetadata(metadata: ChatMessage['metadata']): metadata is PongInviteMetadata {
  return metadata?.kind === 'pong_invite' && metadata.game === 'pong';
}

function isPongNotificationMetadata(
  metadata: ChatMessage['metadata'],
): metadata is PongNotificationMetadata {
  return metadata?.kind === 'pong_notification' && metadata.game === 'pong';
}

function formatInviteExpiry(expiresAt: string) {
  const expiry = new Date(expiresAt);
  const isExpired = expiry.getTime() <= Date.now();

  if (isExpired) {
    return 'Expired';
  }

  return `Expires ${expiry.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [connected, setConnected] = useState(socket.connected);
  const [isTargetTyping, setIsTargetTyping] = useState(false);
  const [respondingInviteIds, setRespondingInviteIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileMeta, setUploadedFileMeta] = useState<any | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const targetUsernameRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);
  const typingTargetRef = useRef<string | null>(null);

  const targetUsername = useChatStore((state) => state.targetUsername);
  const messagesByUser = useChatStore((s) => s.messagesByUser);
  const setMessagesForUser = useChatStore((s) => s.setMessagesForUser);
  const appendMessageForUser = useChatStore((s) => s.appendMessageForUser);
  const clearTargetUsername = useChatStore((s) => s.clearTargetUsername);
  const clearUnreadForUser = useChatStore((s) => s.clearUnreadForUser);

  const meUsername = useUserStore((s) => s.user?.username ?? null);

  const activeMessages = targetUsername ? messagesByUser[targetUsername] ?? [] : [];
  const inviteOutcomeById = activeMessages.reduce<Record<string, 'ACCEPTED' | 'DECLINED'>>(
    (acc, msg) => {
      const notification = isPongNotificationMetadata(msg.metadata) ? msg.metadata : null;
      if (!notification) {
        return acc;
      }

      if (notification.event === 'invite_accepted') {
        acc[notification.inviteId] = 'ACCEPTED';
      } else if (notification.event === 'invite_declined') {
        acc[notification.inviteId] = 'DECLINED';
      }

      return acc;
    },
    {},
  );

  const emitTypingEvent = (target: string, isTyping: boolean) => {
    if (!connected) {
      return;
    }

    if (!target || (meUsername && target === meUsername)) {
      return;
    }

    socket.emit('chat:typing', {
      to: target,
      isTyping,
    });
  };

  const stopTypingForTarget = (target: string | null) => {
    if (!target) {
      return;
    }

    if (isTypingRef.current) {
      emitTypingEvent(target, false);
    }

    isTypingRef.current = false;
    typingTargetRef.current = null;

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const shortenFileName = (name: string, maxLength = 20) => {
    if (name.length <= maxLength) return name;
    return `${name.slice(0, maxLength - 3)}...`;
  };

  const fetchFileBlobUrl = async (fileUrl: string) => {
    const res = await apiFetch(fileUrl);
    if (!res.ok) {
      throw new Error(`Failed with status ${res.status}`);
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  };

  const downloadFile = async (fileUrl: string, fileName?: string) => {
    try {
      const blobUrl = await fetchFileBlobUrl(fileUrl);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.download = fileName || 'chat-file.pdf';
      document.body.appendChild(tempLink);
      tempLink.click();
      tempLink.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
    } catch {
      showToast('Unable to download file', 'error');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  useEffect(() => {
    targetUsernameRef.current = targetUsername;
  }, [targetUsername]);

  useEffect(() => {
    const previousTarget = typingTargetRef.current;
    if (previousTarget && previousTarget !== targetUsername) {
      stopTypingForTarget(previousTarget);
    }

    setIsTargetTyping(false);
  }, [targetUsername]);

  useEffect(() => {
    return () => {
      stopTypingForTarget(typingTargetRef.current);
    };
  }, []);

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

        if (activeTarget && senderUsername === activeTarget) {
          setIsTargetTyping(false);
        }

        if (otherUsername) {
          appendMessageForUser(otherUsername, chatMessage);
        }
        if (chatMessage.isOwn) return;

        if (activeTarget) {
          const shouldShow = shouldShowMessageInActiveChat(
            activeTarget,
            senderUsername,
            recipientUsername,
          );

          if (!shouldShow) {
          } else {
            if (otherUsername) clearUnreadForUser(otherUsername);
          }

          return;
        }

      } catch (e) {
        showToast('Error handling chat message', 'error');
      }
    };

    const onChatTyping = (payload: any) => {
      const activeTarget = targetUsernameRef.current;
      const typingUsername = typeof payload?.username === 'string' ? payload.username : null;

      if (!activeTarget || !typingUsername || typingUsername !== activeTarget) {
        return;
      }

      setIsTargetTyping(Boolean(payload?.isTyping));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat:message', onChatMessage);
    socket.on('chat:typing', onChatTyping);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat:message', onChatMessage);
      socket.off('chat:typing', onChatTyping);
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
          clearUnreadForUser(username);
        } catch (err) {
        }
        try {
          await apiFetch(`/api/chat/conversations/${encodeURIComponent(username)}/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
        } catch {}
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

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (meUsername && targetUsername === meUsername) {
      showToast('You cannot chat with yourself', 'error');
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
    setProgress(0);
    setIsUploading(true);
    setUploadedFileMeta(null);

    try {
      const meta = await uploadFile(selectedFile, targetUsername!, {
        onProgress: (percent: number) => setProgress(percent),
        onComplete: () => setIsUploading(false),
      });
      setUploadedFileMeta(meta);
      setIsUploading(false);
      setProgress(100);
    } catch (err) {
      setIsUploading(false);
      setProgress(0);
      setUploadedFileMeta(null);
      setFile(null);
    }
    e.target.value = '';
  };

  const handleSend = async () => {
    const text = inputValue.trim();

    if (!connected || !targetUsername || isUploading) return;
    if (!text && !uploadedFileMeta) return;

    if (meUsername && targetUsername === meUsername) {
      showToast('You cannot chat with yourself', 'error');
      return;
    }

    stopTypingForTarget(targetUsername);

    try {
      socket.emit('chat:message', {
        text,
        to: targetUsername,
        metadata: uploadedFileMeta
          ? {
              fileUrl: uploadedFileMeta.fileUrl || uploadedFileMeta.url || uploadedFileMeta.path,
              originalName: file?.name || uploadedFileMeta.originalName,
              ...uploadedFileMeta,
            }
          : undefined,
      });

      setInputValue('');
      setFile(null);
      setUploadedFileMeta(null);
      setProgress(0);
    } catch {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (!targetUsername || (meUsername && targetUsername === meUsername) || !connected) {
      return;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      stopTypingForTarget(targetUsername);
      return;
    }

    const currentTypingTarget = typingTargetRef.current;

    if (currentTypingTarget && currentTypingTarget !== targetUsername) {
      stopTypingForTarget(currentTypingTarget);
    }

    if (!isTypingRef.current || typingTargetRef.current !== targetUsername) {
      emitTypingEvent(targetUsername, true);
      isTypingRef.current = true;
      typingTargetRef.current = targetUsername;
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      stopTypingForTarget(targetUsername);
    }, 1200);
  };

  const handleInvitePong = () => {
    if (!connected || !targetUsername) return;

    if (meUsername && targetUsername === meUsername) {
      showToast('You cannot invite yourself', 'error');
      return;
    }

    socket.emit('game:invite:create', {
      to: targetUsername,
    });
  };

  const handleInviteResponse = (inviteId: string, action: 'accept' | 'decline') => {
    setRespondingInviteIds((current) => [...new Set([...current, inviteId])]);

    socket.emit(`game:invite:${action}`, {
      inviteId,
    });
  };

  useEffect(() => {
    setRespondingInviteIds((current) =>
      current.filter((inviteId) => !(inviteId in inviteOutcomeById)),
    );
  }, [inviteOutcomeById]);

  useEffect(() => {
    const onChatError = (payload: any) => {
      const code = typeof payload?.code === 'string' ? payload.code : '';

      if (!code.startsWith('GAME_INVITE_')) {
        return;
      }

      setRespondingInviteIds([]);
      showToast(payload?.message || 'Unable to update invite', 'error');
    };

    socket.on('chat:error', onChatError);
    return () => {
      socket.off('chat:error', onChatError);
    };
  }, []);

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
            {targetUsername && (
              <button
                type="button"
                className="rounded-full bg-slate-900 px-[10px] py-1.5 text-[11px] font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                onClick={handleInvitePong}
                disabled={!connected}
              >
                Play Pong
              </button>
            )}

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
              const inviteMetadata = isPongInviteMetadata(msg.metadata) ? msg.metadata : null;
              const inviteExpired =
                inviteMetadata && new Date(inviteMetadata.expiresAt).getTime() <= Date.now();
              const inviteOutcome = inviteMetadata
                ? inviteOutcomeById[inviteMetadata.inviteId] ??
                  (inviteExpired ? 'EXPIRED' : inviteMetadata.status)
                : null;
              const canRespond =
                Boolean(inviteMetadata) &&
                !msg.isOwn &&
                inviteOutcome === 'PENDING' &&
                !inviteExpired;
              const isResponding =
                inviteMetadata && respondingInviteIds.includes(inviteMetadata.inviteId);
              return (
                <div key={msg.id} className={`chat-message-row ${msg.isOwn ? 'own' : 'other'}`}>
                  <div className="chat-message-meta">
                    <span className="chat-message-user">{msg.user}</span>
                    <span className="chat-message-time">{msg.time}</span>
                  </div>

                  <div
                    className={`chat-bubble ${msg.isOwn ? 'chat-bubble-own' : 'chat-bubble-other'}`}
                  >
                    {inviteMetadata ? (
                      <div className="flex min-w-[220px] flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="m-0 text-[13px] font-bold">Pong Invite</p>
                          <span className="rounded-full bg-slate-900/10 px-2 py-1 text-[10px] font-bold tracking-[0.04em]">
                            {inviteOutcome}
                          </span>
                        </div>
                        <p className="m-0 text-[12px] leading-[1.5]">
                          {msg.isOwn ? 'You challenged this player to a match.' : `${msg.user} challenged you to a match.`}
                        </p>
                        <p className="m-0 text-[12px] leading-[1.5] opacity-80">
                          {formatInviteExpiry(inviteMetadata.expiresAt)}
                        </p>
                        {canRespond && (
                          <div className="mt-1 flex gap-2">
                            <button
                              type="button"
                              className="rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-400"
                              onClick={() => handleInviteResponse(inviteMetadata.inviteId, 'accept')}
                              disabled={Boolean(isResponding)}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-slate-300 px-3 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                              onClick={() =>
                                handleInviteResponse(inviteMetadata.inviteId, 'decline')
                              }
                              disabled={Boolean(isResponding)}
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ) : fileUrl ? (
                      <div className="chat-file-card">
                        <p className="chat-file-title">📎 {fileName || 'Attachment'}</p>
                        <div className="chat-file-actions">
                          <AuthedFilePreview
                            src={fileUrl}
                            fileName={fileName || 'Attachment'}
                            mimeType={msg.metadata?.mimeType || 'application/pdf'}
                            className="chat-file-preview"
                          />
                          <Download
                            className="chat-file-download"
                            onClick={() => downloadFile(fileUrl, fileName)}
                          />
                        </div>
                      </div>
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
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
              className="chat-input"
            />

            <label className="cursor-pointer text-xl hover:opacity-80 transition">
              <FileUp className="size-6 text-[#8b98a5]" />
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>

            <button
              onClick={() => void handleSend()}
              disabled={!connected || isUploading || (!inputValue.trim() && !file)}
              className="chat-send-btn"
              aria-label="Send message"
            >
              <Send className="chat-send-icon" />
            </button>
          </div>

          {file && progress < 100 && (
            <div className="chat-upload-meta">
              <span className="chat-upload-name" title={file.name}>
                {shortenFileName(file.name)}
              </span>
              <span className="chat-upload-percent">{progress}%</span>
            </div>
          )}

          {isUploading && progress < 100 && (
            <progress
              id="uploadProgress"
              value={progress}
              max="100"
              className="chat-upload-progress"
            >
              {progress}%
            </progress>
          )}

          {targetUsername && isTargetTyping && (
            <div className="chat-typing-indicator">@{targetUsername} is typing…</div>
          )}
        </div>
      </div>
    </div>
  );
}
