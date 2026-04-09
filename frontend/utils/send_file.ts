import { socket } from '../socket';

type UploadFileOptions = {
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
};

export const uploadFile = (file: File, options: UploadFileOptions = {}) => {
  const chunkSize = 64 * 1024;
  const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));
  let chunkIndex = 0;

  const sendChunk = () => {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    socket.emit('upload-progress', chunk);

    chunkIndex += 1;
    const percent = Math.min(100, Math.round((chunkIndex / totalChunks) * 100));
    options.onProgress?.(percent);

    if (chunkIndex < totalChunks) {
      setTimeout(sendChunk, 0);
      return;
    }

    options.onComplete?.();
  };

  options.onProgress?.(0);
  sendChunk();
};
