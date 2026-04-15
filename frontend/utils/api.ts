import showToast from './toast';
import { disconnectSocket, connectSocketWithToken } from '../socket';
import useChatStore from './chatState';
import useUserStore from './userStore';

type LogoutHandler = () => void;

let logoutHandler: LogoutHandler | null = null;

export function setLogoutHandler(handler: LogoutHandler) {
  logoutHandler = handler;
}

let accessTokenListener: ((token: string | null) => void) | null = null;
export function setAccessTokenListener(fn: (token: string | null) => void) {
  accessTokenListener = fn;
}

let refreshing: Promise<string | null> | null = null;

function handleTokenUpdate(token: string | null) {
  if (accessTokenListener) {
    try {
      accessTokenListener(token);
    } catch (e) {
      showToast('[apiFetch] accessTokenListener error', 'error');
    }
  }
}

export function clearClientSession() {
  localStorage.removeItem('accessToken');
  disconnectSocket();
  useUserStore.getState().clear();
  useChatStore.setState({
    targetUsername: null,
    panelOpen: false,
    messagesByUser: {},
  });
  handleTokenUpdate(null);
}

function handleLogout() {
  clearClientSession();

  if (logoutHandler) {
    try {
      logoutHandler();
    } catch (e) {
      showToast('[apiFetch] logoutHandler error', 'error');
    }
  } else {
    window.location.replace('/login');
  }
}

async function doRefresh(): Promise<string | null> {
  if (refreshing) {
    return refreshing;
  }

  refreshing = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) return null;

      const data = await res.json();

      if (data?.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        connectSocketWithToken(data.accessToken);
        handleTokenUpdate(data.accessToken);
        return data.accessToken;
      }

      return null;
    } catch (e) {
      showToast('[apiFetch] Error while refreshing token', 'error');
      return null;
    }
  })();

  refreshing.finally(() => {
    refreshing = null;
  });

  return refreshing;
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem('accessToken');

  const headers = new Headers(init?.headers ?? {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(input, { ...init, headers });
  } catch (e) {
    showToast('[apiFetch] Network error', 'error');
    throw e;
  }

  if (response.status !== 401) {
    return response;
  }

  const newToken = await doRefresh();

  if (!newToken) {
    handleLogout();
    return response;
  }

  const retryHeaders = new Headers(init?.headers ?? {});
  retryHeaders.set('Authorization', `Bearer ${newToken}`);

  let retryResponse: Response;

  try {
    retryResponse = await fetch(input, { ...init, headers: retryHeaders });
  } catch (e) {
    showToast('[apiFetch] Network error on retry', 'error');
    throw e;
  }

  if (retryResponse.status === 401) {
    handleLogout();
  }

  return retryResponse;
}

export async function logout(): Promise<void> {
  try {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    showToast(`[api] logout response ${res.status}`, 'info');
  } catch (e) {
    showToast('[api] logout request failed', 'error');
  }
  handleLogout();
}

export async function sendFriendRequest(username: string): Promise<Response> {
  const encoded = encodeURIComponent(username);
  return apiFetch(`/api/users/${encoded}/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function acceptFriendRequest(username: string): Promise<Response> {
  const encoded = encodeURIComponent(username);
  return apiFetch(`/api/users/${encoded}/request/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function declineFriendRequest(username: string): Promise<Response> {
  const encoded = encodeURIComponent(username);
  return apiFetch(`/api/users/${encoded}/request/decline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function withdrawFriendRequest(username: string): Promise<Response> {
  const encoded = encodeURIComponent(username);
  return apiFetch(`/api/users/${encoded}/request`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function removeFriend(username: string): Promise<Response> {
  const encoded = encodeURIComponent(username);
  return apiFetch(`/api/users/${encoded}/friends`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function fetchAuthedImageURL(src: string): Promise<string> {
  const apiRes = await apiFetch(src);

  if (!apiRes.ok) {
    showToast(`[fetchImage] Failed to fetch image: ${apiRes.status} ${apiRes.statusText}`, 'error');
    throw new Error(`Failed to fetch image: ${apiRes.status} ${apiRes.statusText}`);
  }

  const blob = await apiRes.blob();
  return URL.createObjectURL(blob);
}

export async function uploadAvatar(file: File): Promise<{ ok: boolean; avatarUrl?: string }> {
  const fd = new FormData();
  fd.append('avatar', file);

  const res = await apiFetch('/api/uploads/avatar', {
    method: 'POST',
    body: fd,
  });

  if (!res.ok) return { ok: false };

  const data = await res.json();
  return { ok: true, avatarUrl: data?.avatarUrl };
}

export async function deleteAvatar(): Promise<{ ok: boolean; avatarUrl?: string }> {
  const res = await apiFetch('/api/uploads/avatar', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) return { ok: false };

  const data = await res.json();
  return { ok: true, avatarUrl: data?.avatarUrl };
}
