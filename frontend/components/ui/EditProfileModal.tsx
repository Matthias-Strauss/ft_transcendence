import React, { useEffect, useRef, useState } from 'react';
import { AuthedImage } from './AuthedImage';
import { uploadAvatar, deleteAvatar, apiFetch, logout } from '../../utils/api';
import { validatePassword } from '../../utils/password';
import { useUserStore } from '../../utils/userStore';
import { Eye, EyeOff } from 'lucide-react';
import type { UserStore, User } from '../../utils/userStore';
import showToast from '../../utils/toast';

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
  const [notification, setNotification] = useState<{
    type: 'error' | 'success' | 'info';
    text: string;
    duration?: number;
  } | null>(null);

  const notifTimeoutRef = useRef<number | null>(null);
  const [confirmingReset, setConfirmingReset] = useState<boolean>(false);

  const showNotification = (
    text: string,
    type: 'error' | 'success' | 'info' = 'error',
    duration = 1000,
  ) => {
    setNotification({ type, text, duration });
    if (notifTimeoutRef.current) window.clearTimeout(notifTimeoutRef.current);
    notifTimeoutRef.current = window.setTimeout(() => setNotification(null), duration);
  };

  useEffect(() => {
    return () => {
      if (notifTimeoutRef.current) window.clearTimeout(notifTimeoutRef.current);
    };
  }, []);

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
        showToast('Profile picture updated successfully!', 'success');
      } else {
        showNotification('Failed to upload avatar. Please try again.');
      }
    } catch (e) {
      showNotification(
        'An unexpected error occurred while uploading the avatar. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  function handleDelete() {
    setConfirmingReset(true);
  }
  async function performDelete() {
    setConfirmingReset(false);
    setLoading(true);
    try {
      const res = await deleteAvatar();
      if (res.ok && res.avatarUrl) {
        const sep = res.avatarUrl.includes('?') ? '&' : '?';
        const newUrl = `${res.avatarUrl}${sep}t=${Date.now()}`;
        onUpdated?.({ avatarUrl: newUrl });
        updateUser({ avatarUrl: newUrl });
        showNotification('Avatar reset to default.', 'success');
      } else {
        showNotification('Failed to delete avatar. Please try again.');
      }
    } catch (e) {
      showNotification('An unexpected error occurred while deleting the avatar. Please try again.');
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
      showNotification('Invalid username — use 3–30 chars: a-z, 0-9, dot, underscore, dash');
      return;
    }

    if (displayTrim && !isValidDisplayname(displayTrim)) {
      showNotification('Invalid display name — 1–30 chars, words separated by single spaces');
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
        showNotification('Failed to save profile. Please check your input and try again.');
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
      showNotification('Profile saved successfully.', 'success');
    } catch (e) {
      showToast('Failed to update profile', 'error');
      showNotification('An unexpected error occurred while saving your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    if (passwordLoading) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification('Please fill all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('New passwords do not match.');
      return;
    }
    const pwdErr = validatePassword(newPassword);
    if (pwdErr) {
      showNotification(pwdErr);
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
        const payload = await res.json().catch(() => null);
        const serverMsg =
          payload?.message || (payload?.details && payload.details[0]?.message) || null;
        showNotification(
          serverMsg ||
            'Failed to change password. Please verify your current password and try again.',
        );
        return;
      }

      showToast('Password changed successfully. You will be logged out.', 'success');
      await logout();
    } catch (e) {
      showToast('Failed to change password', 'error');
      showNotification(
        'An unexpected error occurred while changing your password. Please try again.',
      );
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

  const notificationTypeClasses = {
    error: 'border-rose-500/30 bg-rose-500/90 text-white',
    success: 'border-emerald-500/30 bg-emerald-600 text-white',
    info: 'border-sky-500/30 bg-sky-600 text-white',
  } as const;

  const panelInputClass =
    'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:bg-white/8';
  const pillButtonClass =
    'inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:bg-white/10 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60';
  const ghostButtonClass =
    'inline-flex items-center justify-center rounded-full border border-white/10 bg-transparent px-4 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      {notification && (
        <div
          className="fixed left-1/2 top-1/2 z-[99999] w-[min(900px,calc(100%-48px))] max-w-[92%] -translate-x-1/2 -translate-y-1/2"
          role="status"
          aria-live="polite"
        >
          <div
            className={`rounded-2xl border px-4 py-3 shadow-[0_20px_50px_rgba(2,6,23,0.55)] ${notificationTypeClasses[notification.type]}`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{notification.text}</div>
              <button
                type="button"
                onClick={() => {
                  if (notifTimeoutRef.current) window.clearTimeout(notifTimeoutRef.current);
                  setNotification(null);
                }}
                className="ml-3 text-white/90 transition hover:text-white"
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>

            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full w-full origin-left bg-white/60"
                style={{ animationDuration: `${notification.duration ?? 5000}ms` }}
                onAnimationEnd={() => {
                  if (notifTimeoutRef.current) window.clearTimeout(notifTimeoutRef.current);
                  setNotification(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-[30px] w-[640px] rounded-[18px] border border-white/10 bg-slate-950/90 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.7)] backdrop-blur-xl">
        <div className="flex items-start justify-between">
          <h3 className="font-bold text-[18px] text-[#f7f9f9]">Edit profile</h3>
          <div>
            <button type="button" onClick={onClose} className="text-slate-400 transition hover:text-white">
              Close
            </button>
          </div>
        </div>

        {confirmingReset && (
          <div
            className="fixed left-1/2 top-1/2 z-[100001] w-[min(480px,92%)] -translate-x-1/2 -translate-y-1/2"
            role="dialog"
            aria-modal="true"
          >
            <div className="rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.65)]">
              <div className="text-sm text-white">Reset avatar to default?</div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setConfirmingReset(false)} className={ghostButtonClass}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={performDelete}
                  className="rounded-full bg-[var(--color-1)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-1)]/90"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-start gap-6">
          <div className="size-24 overflow-hidden rounded-full border border-white/10 bg-slate-900 p-1 shadow-[0_16px_40px_rgba(2,6,23,0.55)]">
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
              <button type="button" onClick={onChooseClick} className={pillButtonClass}>
                Choose file
              </button>
              <button
                type="button"
                onClick={handleUpload}
                className={pillButtonClass}
                disabled={!selectedFile || loading}
              >
                {loading ? 'Uploading...' : 'Upload'}
              </button>
              <button type="button" onClick={handleDelete} className={ghostButtonClass} disabled={loading}>
                Reset
              </button>
              <div className="ml-3 text-sm text-[#8b98a5]">
                {selectedFile ? selectedFile.name : ''}
              </div>
            </div>

            <p className="text-[13px] text-[#8b98a5] mt-3">Supported: JPEG, PNG.</p>

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
                    className={panelInputClass}
                  />
                </div>

                <div>
                  <label className="text-[12px] text-[#8b98a5] block mb-1">Username</label>
                  <input
                    type="text"
                    value={usernameState}
                    onChange={(e) => setUsernameState(e.target.value)}
                    placeholder="username"
                    className={panelInputClass}
                  />
                </div>

                <div>
                  <label className="text-[12px] text-[#8b98a5] block mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={panelInputClass}
                  />
                </div>

                <div className="flex justify-end">
                  <span className="inline-block" title={saveDisabled ? saveDisableReason : ''}>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={saveDisabled}
                      className="rounded-full bg-[var(--color-1)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-1)]/90 disabled:cursor-not-allowed disabled:opacity-40"
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
                    className={panelInputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((s) => !s)}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-transparent px-3 py-2 text-slate-400 transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
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
                    className={panelInputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((s) => !s)}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-transparent px-3 py-2 text-slate-400 transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
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
                    className={panelInputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-transparent px-3 py-2 text-slate-400 transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
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
                    className="rounded-full bg-[var(--color-1)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-1)]/90 disabled:cursor-not-allowed disabled:opacity-40"
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
