import showToast from './toast';
import {
  blockSocketReconnects,
  connectSocket,
  disconnectSocket,
  checkSocketConnectionIsUsd,
  unblockSocketReconnects,
} from '../socket';
import useAuthStore from './authStore';
import useChatStore from './chatState';
import useUserStore from './userStore';

type LogoutHandler = () => void;

type RefreshSessionOptions = {
  force?: boolean;
  logoutOnFailure?: boolean;
};

const SESSION_TTL_MS = 15 * 60 * 1000;
const SESSION_REFRESH_LEEWAY_MS = 2 * 60 * 1000;

let logoutHandler: LogoutHandler | null = null;
let refreshing: Promise<boolean> | null = null;
let restoring: Promise<boolean> | null = null;
let sessionVersion = 0;
let loggingOut = false;

export function setLogoutHandler(handler: LogoutHandler) {
  logoutHandler = handler;
}

function fetchWithSession(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    credentials: 'include',
  });
}

function sythUnauthorizedResponse(): Response {
  return new Response(null, {
    status: 401,
    statusText: 'Unauthorized',
  });
}

function resetClientStores() {
  useUserStore.getState().clear();
  useChatStore.setState({
    targetUsername: null,
    panelOpen: false,
    messagesByUser: {},
    unreadByUser: {},
  });
}

function markAuthenticated(refreshedAt = Date.now()) {
  useAuthStore.getState().markAuthenticated(refreshedAt);
}

function isSessionRefreshDue(force = false): boolean {
  if (force) {
    return true;
  }

  const { status, lastSessionRefreshAt } = useAuthStore.getState();

  if (status !== 'authenticated' || !lastSessionRefreshAt) {
    return false;
  }

  return Date.now() >= lastSessionRefreshAt + SESSION_TTL_MS - SESSION_REFRESH_LEEWAY_MS;
}

export function markSessionAuthenticated() {
  sessionVersion += 1;
  markAuthenticated();
  void connectSocket();
}

export function clearClientSession() {
  sessionVersion += 1;
  disconnectSocket();
  resetClientStores();
  useAuthStore.getState().markAnonymous();
}

function handleLogout() {
  clearClientSession();

  if (logoutHandler) {
    try {
      logoutHandler();
    } catch {
      showToast('[apiFetch] logoutHandler error', 'error');
    }
    return;
  }

  window.location.replace('/login');
}

async function waitForOngoingRefresh(): Promise<boolean> {
  if (!refreshing) {
    return true;
  }

  try {
    return await refreshing;
  } catch {
    return false;
  }
}

export async function refreshSession(options: RefreshSessionOptions = {}): Promise<boolean> {
  if (loggingOut) {
    return false;
  }

  if (!options.force && !refreshing && !isSessionRefreshDue(false)) {
    return useAuthStore.getState().status === 'authenticated';
  }

  if (refreshing) {
    return refreshing;
  }

  const startedAtVersion = sessionVersion;
  const shouldReconnectSocket = checkSocketConnectionIsUsd();

  useAuthStore.getState().setRefreshing(true);
  blockSocketReconnects();

  refreshing = (async () => {
    try {
      const response = await fetchWithSession('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (sessionVersion === startedAtVersion) {
          clearClientSession();
        }

        if (options.logoutOnFailure) {
          handleLogout();
        }

        return false;
      }

      if (sessionVersion !== startedAtVersion || loggingOut) {
        return false;
      }

      sessionVersion += 1;
      markAuthenticated();

      if (shouldReconnectSocket) {
        await connectSocket();
      }

      return true;
    } catch {
      return useAuthStore.getState().status === 'authenticated';
    } finally {
      useAuthStore.getState().setRefreshing(false);
      unblockSocketReconnects();
    }
  })();

  refreshing.finally(() => {
    refreshing = null;
  });

  return refreshing;
}

export async function restoreSession(): Promise<boolean> {
  if (loggingOut) {
    clearClientSession();
    return false;
  }

  if (restoring) {
    return restoring;
  }

  const startedAtVersion = sessionVersion;
  useAuthStore.getState().setStatus('loading');

  restoring = (async () => {
    const refreshed = await refreshSession({ force: true });

    if (refreshed) {
      return true;
    }

    if (sessionVersion !== startedAtVersion) {
      return useAuthStore.getState().status === 'authenticated';
    }

    clearClientSession();
    return false;
  })();

  restoring.finally(() => {
    restoring = null;
  });

  return restoring;
}

export async function ensureAuthenticatedSession(
  options: RefreshSessionOptions = {},
): Promise<boolean> {
  if (loggingOut) {
    return false;
  }

  const authState = useAuthStore.getState();

  if (authState.isRefreshing) {
    return waitForOngoingRefresh();
  }

  if (authState.status === 'authenticated') {
    if (isSessionRefreshDue(options.force)) {
      return refreshSession({
        force: true,
        logoutOnFailure: options.logoutOnFailure,
      });
    }

    return true;
  }

  if (authState.status === 'loading') {
    if (restoring) {
      return restoring;
    }

    return restoreSession();
  }

  return restoreSession();
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const sessionReady = await ensureAuthenticatedSession({ logoutOnFailure: true });

  if (!sessionReady) {
    return sythUnauthorizedResponse();
  }

  await waitForOngoingRefresh();

  let response: Response;

  try {
    response = await fetchWithSession(input, init);
  } catch (error) {
    showToast('[apiFetch] Network error', 'error');
    throw error;
  }

  if (response.status !== 401) {
    return response;
  }

  const refreshed = await refreshSession({ force: true, logoutOnFailure: true });

  if (!refreshed) {
    return sythUnauthorizedResponse();
  }

  await waitForOngoingRefresh();

  try {
    return await fetchWithSession(input, init);
  } catch (error) {
    showToast('[apiFetch] Network error on retry', 'error');
    throw error;
  }
}

export async function logout(): Promise<void> {
  loggingOut = true;

  try {
    await waitForOngoingRefresh();

    try {
      await fetchWithSession('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      showToast('[api] logout request failed', 'error');
    }

    handleLogout();
  } finally {
    loggingOut = false;
  }
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

export async function fetchAuthedFileURL(src: string): Promise<string> {
  const response = await apiFetch(src);

  if (!response.ok) {
    showToast(
      `[fetchFile] Failed to fetch file: ${response.status} ${response.statusText}`,
      'error',
    );
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function uploadAvatar(file: File): Promise<{ ok: boolean; avatarUrl?: string }> {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await apiFetch('/api/uploads/avatar', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    return { ok: false };
  }

  const data = await response.json();
  return { ok: true, avatarUrl: data?.avatarUrl };
}

export async function deleteAvatar(): Promise<{ ok: boolean; avatarUrl?: string }> {
  const response = await apiFetch('/api/uploads/avatar', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    return { ok: false };
  }

  const data = await response.json();
  return { ok: true, avatarUrl: data?.avatarUrl };
}

export async function fetchAuthedImageURL(src: string): Promise<string> {
  return fetchAuthedFileURL(src);
}
