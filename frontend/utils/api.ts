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
      console.error('[apiFetch] accessTokenListener error', e);
    }
  }
}

function handleLogout() {
  localStorage.removeItem('accessToken');
  handleTokenUpdate(null);

  if (logoutHandler) {
    try {
      logoutHandler();
    } catch (e) {
      console.error('[apiFetch] logoutHandler error', e);
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
        handleTokenUpdate(data.accessToken);
        return data.accessToken;
      }

      return null;
    } catch (e) {
      console.error('[apiFetch] Error while refreshing token', e);
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
    console.error('[apiFetch] Network error', e);
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
    console.error('[apiFetch] Network error on retry', e);
    throw e;
  }

  if (retryResponse.status === 401) {
    handleLogout();
  }

  return retryResponse;
}
