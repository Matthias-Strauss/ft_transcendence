import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Send, FileUp, Ban, ShieldCheck } from 'lucide-react';
import { socket } from '../socket';
import { apiFetch } from '../utils/api';
import { uploadFile } from '../utils/send_file';
import useChatStore, {
  type ChatMessage,
  type PongInviteMetadata,
  type PongNotificationMetadata,
} from '../utils/chatState';
import useUserStore from '../utils/userStore';
import showToast from '../utils/toast';
import { AuthedFilePreview } from './ui/AuthedFilePreview';
import { Download, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Dropdown from './ui/Dropdown';
import { DropdownItem } from '../types/posts';
import { MoreHorizontal } from 'lucide-react';
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

function buildNotificationLabel(metadata: PongNotificationMetadata) {
  if (metadata.event === 'invite_accepted') {
    return 'Invite Accepted';
  }

  if (metadata.event === 'invite_declined') {
    return 'Invite Declined';
  }

  if (metadata.event === 'opponent_left') {
    return 'Player Left';
  }

  if (metadata.event === 'opponent_disconnected') {
    return 'Match Ended';
  }

  return 'Match Result';
}

function buildNotificationCopy(metadata: PongNotificationMetadata) {
  if (metadata.event === 'invite_accepted') {
    return 'The Pong invite was accepted.';
  }

  if (metadata.event === 'invite_declined') {
    return 'The Pong invite was declined.';
  }

  if (metadata.event === 'opponent_left') {
    const who = metadata.endedByUsername ?? 'A player';
    return `${who} left the match.`;
  }

  if (metadata.event === 'opponent_disconnected') {
    const who = metadata.endedByUsername ?? 'A player';
    return `${who} disconnected and did not return in time.`;
  }

  const finalScore = metadata.finalScore;
  if (!finalScore || !metadata.winnerUsername) {
    return 'The Pong match finished.';
  }

  return `${metadata.winnerUsername} won ${finalScore.p1}-${finalScore.p2}.`;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [connected, setConnected] = useState(socket.connected);
  const [isTargetTyping, setIsTargetTyping] = useState(false);
  const [respondingInviteIds, setRespondingInviteIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileMeta, setUploadedFileMeta] = useState<UploadedFileMeta | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const targetUsernameRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);
  const typingTargetRef = useRef<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const targetUsername = useChatStore((state) => state.targetUsername);
  const messagesByUser = useChatStore((s) => s.messagesByUser);
  const setMessagesForUser = useChatStore((s) => s.setMessagesForUser);
  const appendMessageForUser = useChatStore((s) => s.appendMessageForUser);
  const clearTargetUsername = useChatStore((s) => s.clearTargetUsername);
  const clearUnreadForUser = useChatStore((s) => s.clearUnreadForUser);

  const meUsername = useUserStore((s) => s.user?.username ?? null);

  const activeMessages = targetUsername ? messagesByUser[targetUsername] ?? [] : [];
  const inviteOutcomeById = useMemo(
    () =>
      activeMessages.reduce<Record<string, 'ACCEPTED' | 'DECLINED'>>((acc, msg) => {
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
      }, {}),
    [activeMessages],
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
  const items: DropdownItem[] = [
    { id: 0, text: 'Block User', icon: <Ban /> },
    { id: 1, text: 'Unblock User', icon: <ShieldCheck /> },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-[1000] h-[min(560px,calc(100vh-32px))] w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] max-sm:bottom-2 max-sm:right-2 max-sm:h-[min(520px,calc(100vh-16px))] max-sm:w-[calc(100vw-16px)]">
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="m-0 text-sm font-bold text-slate-900">Live Chat</p>
            <Link
              to={targetUsername ? `/users/${targetUsername}` : '/players'}
              className="m-0 text-xs text-slate-500"
            >
              {targetUsername ? `Chat with @${targetUsername}` : 'Talk with online players'}
            </Link>
          </div>

          <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
              <span
                className={`size-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-rose-500'}`}
              />
              {connected ? 'Connected' : 'Offline'}
            </div>
            <div className="relative">
              <button
                className="p-1 hover:bg-[var(--color-1)]/10 rounded-full transition-colors"
                onClick={() => setIsOpen((prev) => !prev)}
              >
                <MoreHorizontal className="size-5 text-[#8b98a5]" />
              </button>
              {isOpen && (
                <Dropdown
                  items={items}
                  isOpen={isOpen}
                  setIsOpen={setIsOpen}
                  postId="null"
                  authorId={targetUsername || 'unknown'}
                />
              )}
            </div>

            {onClose && (
              <button
                type="button"
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={onClose}
              >
                Close
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white px-4 py-4">
          <div className="flex flex-col gap-4">
            {activeMessages.map((msg) => {
              const fileUrl = msg.metadata?.fileUrl;
              const fileId = msg.id;
              const fileName = msg.metadata?.originalName;
              const inviteMetadata = isPongInviteMetadata(msg.metadata) ? msg.metadata : null;
              const notificationMetadata = isPongNotificationMetadata(msg.metadata)
                ? msg.metadata
                : null;
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
                <div
                  key={msg.id}
                  className={`flex w-full flex-col gap-1 ${
                    msg.isOwn ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{msg.user}</span>
                    <span className="text-[11px] text-slate-500">{msg.time}</span>
                  </div>

                  <div
                    className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                      msg.isOwn
                        ? 'rounded-br-md bg-sky-600 text-white'
                        : 'rounded-bl-md border border-slate-200 bg-slate-100 text-slate-900'
                    }`}
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
                          {msg.isOwn
                            ? 'You challenged this player to a match.'
                            : `${msg.user} challenged you to a match.`}
                        </p>
                        <p className="m-0 text-[12px] leading-[1.5] opacity-80">
                          {formatInviteExpiry(inviteMetadata.expiresAt)}
                        </p>
                        {canRespond && (
                          <div className="mt-1 flex gap-2">
                            <button
                              type="button"
                              className="rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-400"
                              onClick={() =>
                                handleInviteResponse(inviteMetadata.inviteId, 'accept')
                              }
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
                    ) : notificationMetadata ? (
                      <div className="flex min-w-[220px] flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="m-0 text-[13px] font-bold">
                            {buildNotificationLabel(notificationMetadata)}
                          </p>
                          <span className="rounded-full bg-sky-900/10 px-2 py-1 text-[10px] font-bold tracking-[0.04em] text-sky-900">
                            PONG
                          </span>
                        </div>
                        <p className="m-0 text-[12px] leading-[1.5]">
                          {buildNotificationCopy(notificationMetadata)}
                        </p>
                        {notificationMetadata.event === 'match_result' &&
                          notificationMetadata.finalScore && (
                            <p className="m-0 text-[12px] font-semibold leading-[1.5] opacity-80">
                              Final score: {notificationMetadata.finalScore.p1}-
                              {notificationMetadata.finalScore.p2}
                            </p>
                          )}
                      </div>
                    ) : fileUrl ? (
                      <div className="flex flex-col gap-2">
                        <p className="m-0 break-words text-[13px] font-semibold">
                          📎 {fileName || 'Attachment'}
                        </p>
                        <div className="flex flex-col gap-2">
                          <AuthedFilePreview
                            src={fileUrl}
                            fileName={fileName || 'Attachment'}
                            mimeType={msg.metadata?.mimeType || 'application/pdf'}
                            className="max-h-40 w-auto max-w-full rounded-lg object-contain"
                          />

                          <div className="flex items-center gap-3 pl-1">
                            <Download
                              className="size-4 cursor-pointer text-slate-500 transition hover:text-slate-900"
                              onClick={() => downloadFile(fileUrl, fileName)}
                            />

                            {msg.isOwn &&
                              msg.metadata &&
                              'fileId' in msg.metadata &&
                              msg.metadata.fileId && (
                                <Trash2
                                  className="size-4 cursor-pointer text-red-500 transition hover:text-red-700"
                                  onClick={() => handleFileDelete({ fileId, message: msg })}
                                />
                              )}
                          </div>
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

        <div className="mt-auto border-t border-slate-200 bg-white px-3 py-3">
          <div className="flex h-11 w-full items-center gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && void onSend()}
              className="h-full flex-1 rounded-full border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500"
            />

            <label className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700">
              <FileUp className="size-5" />
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
              className="inline-flex size-11 items-center justify-center rounded-full bg-sky-600 text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300 disabled:text-slate-100"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </button>
          </div>

          {file && progress < 100 && (
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span className="max-w-[80%] truncate font-medium text-slate-600" title={file.name}>
                {shortenFileName(file.name)}
              </span>
              <span className="font-mono tabular-nums">{progress}%</span>
            </div>
          )}

          {isUploading && progress < 100 && (
            <progress
              id="uploadProgress"
              value={progress}
              max="100"
              className="mt-2 h-2 w-full overflow-hidden rounded-full [appearance:none] [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-sky-500 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-sky-500"
            >
              {progress}%
            </progress>
          )}

          {targetUsername && isTargetTyping && (
            <div className="mt-2 text-xs italic text-slate-500">@{targetUsername} is typing…</div>
          )}
        </div>
      </div>
    </div>
  );
}
