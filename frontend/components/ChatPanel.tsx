import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Send, FileUp } from 'lucide-react';
import { socket } from '../socket';
import { apiFetch } from '../utils/api';
import '../styles/chat.css';
import { uploadFile } from '../utils/send_file';
import useChatStore, { type ChatMessage } from '../utils/chatState';
import useUserStore from '../utils/userStore';
import showToast from '../utils/toast';
import { AuthedFilePreview } from './ui/AuthedFilePreview';
import { Download, Trash2 } from 'lucide-react';
import { handleSend } from '../chat/send';
import {
  mapApiMessageToChatMessage,
  normalizeIncomingPayload,
  shouldShowMessageInActiveChat,
} from '../chat/messages';
import type { UploadedFileMeta } from '../chat/types';
interface ChatPanelProps {
  onClose?: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [connected, setConnected] = useState(socket.connected);
  const [isTargetTyping, setIsTargetTyping] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileMeta, setUploadedFileMeta] = useState<UploadedFileMeta | null>(null);

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
        const normalized = normalizeIncomingPayload(payload, meUsername, socket.id);

        if (!normalized) return;

        const { chatMessage, otherUsername, senderUsername, recipientUsername } = normalized;

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
        } catch (err) {}
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

  const onSend = () => {
    handleSend({
      inputValue,
      connected,
      isUploading,
      targetUsername,
      meUsername,
      fileName: file?.name,
      uploadedFileMeta,
      socket,
      showToast,
      stopTypingForTarget,
      setInputValue,
      setFile,
      setUploadedFileMeta,
      setProgress,
      setIsUploading,
    });
  };

  const markFileDeletedInState = (username: string, messageId: string) => {
    const current = messagesByUser[username] ?? [];

    const next = current.map((m) => {
      if (m.id !== messageId) return m;
      return {
        ...m,
        message: m.message?.trim() ? m.message : 'Attachment deleted',
        metadata: undefined,
      };
    });

    setMessagesForUser(username, next);
  };

  const handleFileDelete = async ({
    fileId,
    message,
  }: {
    fileId: string;
    message: ChatMessage;
  }) => {
    const res = await apiFetch(`/api/chat/conversations/${targetUsername}/files/${fileId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      showToast('Failed to delete file', 'error');
      return;
    }

    markFileDeletedInState(targetUsername, message.id);
    showToast('File deleted', 'success');
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
              const fileId = msg.id;
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
                          <Trash2
                            className="chat-file-delete"
                            onClick={() => handleFileDelete({ fileId, message: msg })}
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
              onKeyDown={(e) => e.key === 'Enter' && void onSend()}
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
              onClick={() => void onSend()}
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
