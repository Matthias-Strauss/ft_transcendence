import type { ChatMessage } from '../utils/chatState';

export interface UploadedFileMeta {
  fileUrl?: string;
  url?: string;
  path?: string;
  originalName?: string;
  mimeType?: string;
  [key: string]: unknown;
}

export interface NormalizedIncomingMessage {
  chatMessage: ChatMessage;
  otherUsername: string | null;
  senderUsername: string | null;
  recipientUsername: string | null;
  isDirect: boolean;
}

export interface HandleSendParams {
  inputValue: string;
  connected: boolean;
  isUploading: boolean;
  targetUsername: string | null;
  meUsername: string | null;
  fileName?: string;
  uploadedFileMeta: UploadedFileMeta | null;
  socket: {
    emit: (event: string, payload?: unknown) => void;
  };
  showToast: (message: string, type: 'error' | 'success') => void;
  stopTypingForTarget: (username: string | null) => void;
  setInputValue: (value: string) => void;
  setFile: (value: File | null) => void;
  setUploadedFileMeta: (value: UploadedFileMeta | null) => void;
  setProgress: (value: number) => void;
  setIsUploading: (value: boolean) => void;
}
