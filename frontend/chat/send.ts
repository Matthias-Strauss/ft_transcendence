import type { HandleSendParams } from './types';

export function handleSend({
  inputValue,
  connected,
  isUploading,
  targetUsername,
  meUsername,
  fileName,
  uploadedFileMeta,
  socket,
  showToast,
  stopTypingForTarget,
  setInputValue,
  setFile,
  setUploadedFileMeta,
  setProgress,
  setIsUploading,
}: HandleSendParams) {
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
            originalName: fileName || uploadedFileMeta.originalName,
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
}
