import showToast from './toast';
import { socket } from '../socket';

type UploadFileOptions = {
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
};

export const uploadFile = (
  file: File,
  username: string,
  options: UploadFileOptions = {},
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token');
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/chat/conversations/${username}/files/pdf`, true);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

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
      if (xhr.status >= 200 && xhr.status < 300) {
        options.onProgress?.(100);
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          showToast('Failed to parse server response', 'error');
          reject(new Error('Failed to parse server response'));
        }
      } else {
        showToast('File upload failed', 'error');
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      showToast('File upload failed', 'error');
      reject(new Error('Network error during file upload'));
    };

    options.onProgress?.(0);
    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
};
