import React, { useEffect, useRef, useState } from 'react';
import '../../styles/edit-profile-modal.css';
import { AuthedImage } from './AuthedImage';
import { uploadAvatar, deleteAvatar, apiFetch } from '../../utils/api';
import { useUserStore } from '../../utils/userStore';
import type { UserStore } from '../../utils/userStore';

interface Props {
  user?: {
    avatarUrl?: string | null;
    displayname?: string | null;
    username?: string;
    email?: string | null;
  };
  onClose?: () => void;
  onUpdated?: (data: { avatarUrl?: string | null; email?: string | null }) => void;
}

export default function EditProfileModal({ user, onClose, onUpdated }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const updateUser = useUserStore((s: UserStore) => s.update);
  const storeUser = useUserStore((s: UserStore) => s.user);
  const [email, setEmail] = useState<string>(storeUser?.email ?? user?.email ?? '');

  useEffect(() => {
    setEmail(storeUser?.email ?? user?.email ?? '');
  }, [storeUser?.email, user?.email]);

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
        const sep = res.avatarUrl.includes('?') ? '&' : '?';
        const newUrl = `${res.avatarUrl}${sep}t=${Date.now()}`;
        onUpdated?.({ avatarUrl: newUrl });
        updateUser({ avatarUrl: newUrl });
        setSelectedFile(null);
      } else {
        alert('Failed to upload avatar.');
      }
    } catch (e) {
      alert('Error uploading avatar.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEmail() {
    const normalized = (email ?? '').trim();
    const payloadEmail = normalized === '' ? null : normalized;
    if (payloadEmail === (storeUser?.email ?? null)) return;

    setLoading(true);
    try {
      const res = await apiFetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: payloadEmail }),
      });

      if (!res.ok) {
        const txt = await res.text();
        alert(`Failed to save email: ${res.status} ${txt}`);
        return;
      }

      const data = await res.json();
      const newEmail = data?.email ?? null;
      const newAvatar = data?.avatarUrl ?? null;
      updateUser({ email: newEmail, ...(newAvatar ? { avatarUrl: newAvatar } : {}) });
      onUpdated?.({ email: newEmail, avatarUrl: newAvatar });
    } catch (e) {
      console.error('Failed to update email', e);
      alert('Error saving email.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Reset avatar to default?')) return;
    setLoading(true);
    try {
      const res = await deleteAvatar();
      if (res.ok && res.avatarUrl) {
        const sep = res.avatarUrl.includes('?') ? '&' : '?';
        const newUrl = `${res.avatarUrl}${sep}t=${Date.now()}`;
        onUpdated?.({ avatarUrl: newUrl });
        updateUser({ avatarUrl: newUrl });
      } else {
        alert('Failed to delete avatar.');
      }
    } catch (e) {
      alert('Error deleting avatar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#071026] rounded-lg w-[640px] p-6 modal-card">
        <div className="flex items-start justify-between">
          <h3 className="font-bold text-[18px] text-[#f7f9f9]">Edit profile</h3>
          <div>
            <button type="button" onClick={onClose} className="text-[#8b98a5] hover:text-[#f7f9f9]">
              Close
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-6">
          <div className="size-24 rounded-full overflow-hidden bg-[#0b1220] avatar-frame">
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
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-ghost"
                disabled={loading}
              >
                Reset
              </button>
            </div>

            <p className="text-[13px] text-[#8b98a5]">
              Supported: JPEG, PNG. Max size per server config.
            </p>

            <div className="mt-3">
              <label className="text-[13px] text-[#8b98a5] block mb-1">Email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 bg-transparent border border-[#39444d] px-3 py-2 rounded-md text-[#f7f9f9] placeholder:text-[#8b98a5] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveEmail}
                  disabled={loading || email.trim() === (storeUser?.email ?? '')}
                  className="bg-[var(--color-1)] hover:bg-[var(--color-1)]/90 text-[#f7f9f9] rounded-full py-2 px-4 transition-colors disabled:opacity-40"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
