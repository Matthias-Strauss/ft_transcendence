import React, { useEffect, useRef, useState } from 'react';
import '../../styles/edit-profile-modal.css';
import { AuthedImage } from './AuthedImage';
import { uploadAvatar, deleteAvatar, apiFetch, logout } from '../../utils/api';
import { useUserStore } from '../../utils/userStore';
import { Eye, EyeOff } from 'lucide-react';
import type { UserStore, User } from '../../utils/userStore';

interface Props {
  user?: User | null;
  onClose: () => void;
  onUpdated?: (patch: Partial<User>) => void;
}

export default function EditProfileModal({ user, onClose, onUpdated }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const updateUser = useUserStore((s: UserStore) => s.update);
  const storeUser = useUserStore((s: UserStore) => s.user);

  const [email, setEmail] = useState<string>(storeUser?.email ?? user?.email ?? '');
  const [displayname, setDisplayname] = useState<string>(
    storeUser?.displayname ?? user?.displayname ?? '',
  );
  const [usernameState, setUsernameState] = useState<string>(
    storeUser?.username ?? user?.username ?? '',
  );

  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordLoading, setPasswordLoading] = useState<boolean>(false);
  const [showCurrent, setShowCurrent] = useState<boolean>(false);
  const [showNew, setShowNew] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  useEffect(() => {
    setEmail(storeUser?.email ?? user?.email ?? '');
    setDisplayname(storeUser?.displayname ?? user?.displayname ?? '');
    setUsernameState(storeUser?.username ?? user?.username ?? '');
  }, [
    storeUser?.email,
    user?.email,
    storeUser?.displayname,
    user?.displayname,
    storeUser?.username,
    user?.username,
  ]);

  const isValidEmail = (v: string) => {
    if (!v) return false;
    const re = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return re.test(v);
  };

  const isValidDisplayname = (v: string) => {
    const t = v.trim();
    if (t.length < 1 || t.length > 30) return false;
    return /^[a-zA-Z0-9._-]+( [a-zA-Z0-9._-]+)*$/.test(t);
  };

  const isValidUsername = (v: string) => {
    const t = v.trim().toLowerCase();
    if (t.length < 3 || t.length > 30) return false;
    return /^[a-z0-9._-]+$/.test(t);
  };

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  function onChooseClick() {
    if (fileRef.current) fileRef.current.value = '';
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
        updateUser({ avatarUrl: newUrl });
        onUpdated?.({ avatarUrl: newUrl });
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

  async function handleSaveProfile() {
    if (loading) return;

    const normalizedEmail = (email ?? '').trim();
    const payloadEmail = normalizedEmail === '' ? null : normalizedEmail;

    const displayTrim = (displayname ?? '').trim();
    const usernameTrim = (usernameState ?? '').trim().toLowerCase();

    if (usernameTrim && !isValidUsername(usernameTrim)) {
      alert('Invalid username — use 3–30 chars: a-z, 0-9, dot, underscore, dash');
      return;
    }

    if (displayTrim && !isValidDisplayname(displayTrim)) {
      alert('Invalid display name — 1–30 chars, words separated by single spaces');
      return;
    }

    const patch: Partial<User> = {};
    if (payloadEmail !== (storeUser?.email ?? null)) patch.email = payloadEmail;
    if (displayTrim !== '' && displayTrim !== (storeUser?.displayname ?? ''))
      patch.displayname = displayTrim;
    if (usernameTrim !== '' && usernameTrim !== (storeUser?.username ?? ''))
      patch.username = usernameTrim;

    if (Object.keys(patch).length === 0) return;

    setLoading(true);
    try {
      const res = await apiFetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        const txt = await res.text();
        alert(`Failed to save profile: ${res.status} ${txt}`);
        return;
      }

      const data = await res.json();
      const updatePatch: Partial<User> = {};
      if (typeof data?.email !== 'undefined') updatePatch.email = data.email;
      if (typeof data?.avatarUrl !== 'undefined' && data.avatarUrl)
        updatePatch.avatarUrl = data.avatarUrl;
      if (typeof data?.displayname !== 'undefined') updatePatch.displayname = data.displayname;
      if (typeof data?.username !== 'undefined') updatePatch.username = data.username;

      updateUser(updatePatch as Partial<User>);
      onUpdated?.(updatePatch as any);
    } catch (e) {
      console.error('Failed to update profile', e);
      alert('Error saving profile.');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    if (passwordLoading) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match.');
      return;
    }
    if (newPassword.length < 3) {
      alert('New password is too short.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await apiFetch('/api/me/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const txt = await res.text();
        alert(`Failed to change password: ${res.status} ${txt}`);
        return;
      }

      alert('Password changed successfully. You will be logged out.');
      await logout();
    } catch (e) {
      console.error('Failed to change password', e);
      alert('Error changing password.');
    } finally {
      setPasswordLoading(false);
    }
  }

  const normalizedEmail = (email ?? '').trim();
  const payloadEmailNormalized = normalizedEmail === '' ? null : normalizedEmail;

  const displayNameNormalized = (displayname ?? '').trim();
  const usernameNormalized = (usernameState ?? '').trim().toLowerCase();

  const emailChanged = payloadEmailNormalized !== (storeUser?.email ?? null);
  const displaynameChanged =
    displayNameNormalized !== '' && displayNameNormalized !== (storeUser?.displayname ?? '');
  const usernameChanged =
    usernameNormalized !== '' && usernameNormalized !== (storeUser?.username ?? '');

  const emailInvalid = payloadEmailNormalized !== null && !isValidEmail(payloadEmailNormalized);
  const displaynameInvalid = displaynameChanged && !isValidDisplayname(displayNameNormalized);
  const usernameInvalid = usernameChanged && !isValidUsername(usernameNormalized);

  const saveDisabled =
    loading ||
    (!emailChanged && !displaynameChanged && !usernameChanged) ||
    emailInvalid ||
    displaynameInvalid ||
    usernameInvalid;

  const saveDisableReason = loading
    ? 'Saving...'
    : !emailChanged && !displaynameChanged && !usernameChanged
    ? 'No changes to save'
    : emailInvalid
    ? 'Invalid email address'
    : displaynameInvalid
    ? 'Invalid display name'
    : usernameInvalid
    ? 'Invalid username'
    : '';

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

        <div className="mt-4 flex items-start gap-6">
          <div className="size-24 rounded-full overflow-hidden bg-[#0b1220] avatar-frame">
            <AuthedImage
              src={previewUrl ?? user?.avatarUrl ?? '/uploads/avatars/default.png'}
              alt={user?.displayname ?? user?.username ?? 'avatar'}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1">
            <div className="flex gap-2 items-center">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg"
                onChange={onFileChange}
                className="hidden"
                style={{ display: 'none' }}
              />
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
              <div className="ml-3 text-sm text-[#8b98a5]">{selectedFile ? selectedFile.name : ''}</div>
            </div>

            <p className="text-[13px] text-[#8b98a5] mt-3">
              Supported: JPEG, PNG.
            </p>

            <div className="mt-4">
              <label className="text-[13px] text-[#8b98a5] block mb-2">Profile</label>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[12px] text-[#8b98a5] block mb-1">Display name</label>
                  <input
                    type="text"
                    value={displayname}
                    onChange={(e) => setDisplayname(e.target.value)}
                    placeholder="Display name"
                    className="w-full bg-transparent border border-[#39444d] px-3 py-2 rounded-md text-[#f7f9f9] placeholder:text-[#8b98a5] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[12px] text-[#8b98a5] block mb-1">Username</label>
                  <input
                    type="text"
                    value={usernameState}
                    onChange={(e) => setUsernameState(e.target.value)}
                    placeholder="username"
                    className="w-full bg-transparent border border-[#39444d] px-3 py-2 rounded-md text-[#f7f9f9] placeholder:text-[#8b98a5] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[12px] text-[#8b98a5] block mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent border border-[#39444d] px-3 py-2 rounded-md text-[#f7f9f9] placeholder:text-[#8b98a5] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <span className="inline-block" title={saveDisabled ? saveDisableReason : ''}>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={saveDisabled}
                      className="bg-[var(--color-1)] hover:bg-[var(--color-1)]/90 text-[#f7f9f9] rounded-full py-2 px-4 transition-colors disabled:opacity-40"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </span>
                </div>

                <div className="text-[12px] text-[#8b98a5]">
                  <div>Display name: 1–30 chars, words separated by single spaces.</div>
                  <div>Username: 3–30 chars, lowercase a-z, 0-9, dot, underscore, dash.</div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="text-[13px] text-[#8b98a5] block mb-2">Change password</label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="flex-1 bg-transparent border border-[#39444d] px-3 py-2 rounded-md text-[#f7f9f9] placeholder:text-[#8b98a5] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((s) => !s)}
                    className="btn btn-ghost px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--color-1)] rounded"
                    aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                    title={showCurrent ? 'Hide current password' : 'Show current password'}
                  >
                    {showCurrent ? (
                      <EyeOff className="size-5 text-[#8b98a5] hover:text-[var(--color-1)] transition-colors" />
                    ) : (
                      <Eye className="size-5 text-[#8b98a5] hover:text-[var(--color-1)] transition-colors" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="flex-1 bg-transparent border border-[#39444d] px-3 py-2 rounded-md text-[#f7f9f9] placeholder:text-[#8b98a5] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((s) => !s)}
                    className="btn btn-ghost px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--color-1)] rounded"
                    aria-label={showNew ? 'Hide new password' : 'Show new password'}
                    title={showNew ? 'Hide new password' : 'Show new password'}
                  >
                    {showNew ? (
                      <EyeOff className="size-5 text-[#8b98a5] hover:text-[var(--color-1)] transition-colors" />
                    ) : (
                      <Eye className="size-5 text-[#8b98a5] hover:text-[var(--color-1)] transition-colors" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="flex-1 bg-transparent border border-[#39444d] px-3 py-2 rounded-md text-[#f7f9f9] placeholder:text-[#8b98a5] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="btn btn-ghost px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--color-1)] rounded"
                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                    title={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirm ? (
                      <EyeOff className="size-5 text-[#8b98a5] hover:text-[var(--color-1)] transition-colors" />
                    ) : (
                      <Eye className="size-5 text-[#8b98a5] hover:text-[var(--color-1)] transition-colors" />
                    )}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={
                      passwordLoading ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword ||
                      newPassword !== confirmPassword
                    }
                    className="bg-[var(--color-1)] hover:bg-[var(--color-1)]/90 text-[#f7f9f9] rounded-full py-2 px-4 transition-colors disabled:opacity-40"
                  >
                    {passwordLoading ? 'Changing...' : 'Change password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
