import showToast from './toast';
import { socket } from '../socket';
import { ensureAuthenticatedSession, refreshSession } from './api';

type UploadFileOptions = {
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
};

type UploadOutcome = {
  status: number;
  responseText: string;
};

function sendUploadAttempt(
  file: File,
  username: string,
  options: UploadFileOptions,
): Promise<UploadOutcome> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/chat/conversations/${encodeURIComponent(username)}/files/pdf`, true);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);

        options.onProgress?.(percent);

        socket.emit('upload-progress', {
          loaded: event.loaded,
          total: event.total,
          percent,
        });
      }
    };

    xhr.onload = () => {
      resolve({
        status: xhr.status,
        responseText: xhr.responseText,
      });
    };

    xhr.onerror = () => {
      reject(new Error('Network error during file upload'));
    };

    options.onProgress?.(0);
    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}

export const uploadFile = async (
  file: File,
  username: string,
  options: UploadFileOptions = {},
): Promise<any> => {
  const sessionReady = await ensureAuthenticatedSession({ logoutOnFailure: true });

  if (!sessionReady) {
    throw new Error('No active session');
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await sendUploadAttempt(file, username, options);

    if (result.status >= 200 && result.status < 300) {
      options.onProgress?.(100);
      options.onComplete?.();
      showToast('File uploaded.', 'success');

      try {
        return JSON.parse(result.responseText);
      } catch {
        showToast('Failed to parse server response', 'error');
        throw new Error('Failed to parse server response');
      }
    }

    if (result.status === 401 && attempt === 0) {
      const refreshed = await refreshSession({ force: true, logoutOnFailure: true });
      if (refreshed) {
        continue;
      }

      showToast('Session expired.', 'error');
    }

    const errMsg = result.status === 413 ? 'File too large' : 'File upload failed';
    showToast(errMsg, 'error');
    throw new Error(`Upload failed with status ${result.status}`);
  }

  showToast('File upload failed', 'error');
  throw new Error('Upload failed');
};
