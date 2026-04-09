import React, { useEffect, useRef, useState } from 'react';
import { AuthedImage } from './AuthedImage';
import { uploadAvatar, deleteAvatar } from '../../utils/api';

interface Props {
  user?: { avatarUrl?: string | null; displayname?: string | null; username?: string };
  onClose?: () => void;
  onUpdated?: (data: { avatarUrl?: string | null }) => void;
}

export default function EditProfileModal({ user, onClose, onUpdated }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  function onChooseClick() {
    fileRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setSelectedFile(f);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setLoading(true);
    try {
      const res = await uploadAvatar(selectedFile);
      if (res.ok && res.avatarUrl) {
        onUpdated?.({ avatarUrl: res.avatarUrl });
        setSelectedFile(null);
      } else {
        // eslint-disable-next-line no-alert
        alert('Не удалось загрузить аватарку.');
      }
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert('Ошибка при загрузке аватарки.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    // eslint-disable-next-line no-alert
    if (!confirm('Сбросить аватарку на умолчание?')) return;
    setLoading(true);
    try {
      const res = await deleteAvatar();
      if (res.ok && res.avatarUrl) {
        onUpdated?.({ avatarUrl: res.avatarUrl });
      } else {
        // eslint-disable-next-line no-alert
        alert('Не удалось удалить аватарку.');
      }
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert('Ошибка при удалении аватарки.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#071026] rounded-lg w-[640px] p-6">
        <div className="flex items-start justify-between">
          <h3 className="font-bold text-[18px] text-[#f7f9f9]">Edit profile</h3>
          <div>
            <button
              type="button"
              onClick={onClose}
              className="text-[#8b98a5] hover:text-[#f7f9f9]"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-6">
          <div className="size-24 rounded-full overflow-hidden bg-[#0b1220]">
            <AuthedImage
              src={previewUrl ?? user?.avatarUrl ?? '/uploads/avatars/default.png'}
              alt={user?.displayname ?? user?.username ?? 'avatar'}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={onFileChange}
              className="hidden"
            />

            <div className="flex gap-2">
              <button type="button" onClick={onChooseClick} className="btn">
                Choose file
              </button>
              <button
                type="button"
                onClick={handleUpload}
                className="btn"
                disabled={!selectedFile || loading}
              >
                {loading ? 'Uploading...' : 'Upload'}
              </button>
              <button type="button" onClick={handleDelete} className="btn btn-ghost" disabled={loading}>
                Reset
              </button>
            </div>

            <p className="text-[13px] text-[#8b98a5]">Supported: JPEG, PNG. Max size per server config.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
