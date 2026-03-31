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

async function doRefresh(): Promise<string | null> {
  if (refreshing) {
    console.log('[apiFetch] Refresh already in progress - awaiting existing refresh');
    return refreshing;
  }

  refreshing = (async () => {
    try {
      console.log('[apiFetch] Requesting refresh token: POST /api/auth/refresh');
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log(`[apiFetch] Refresh response status: ${res.status}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.accessToken) {
        const masked =
          typeof data.accessToken === 'string' ? `${data.accessToken.slice(0, 8)}...` : 'masked';
        console.log(`[apiFetch] Received new accessToken (masked): ${masked}`);
        localStorage.setItem('accessToken', data.accessToken);
        if (accessTokenListener) {
          try {
            accessTokenListener(data.accessToken);
          } catch (e) {
            console.error('[apiFetch] accessTokenListener error', e);
          }
        }
        return data.accessToken;
      }
      return null;
    } catch (e) {
      console.error('[apiFetch] Error while refreshing token', e);
      return null;
    }
  })();

  refreshing.then(() => (refreshing = null)).catch(() => (refreshing = null));
  return refreshing;
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem('accessToken');
  let requestUrl = '';
  let method = (init && init.method) || 'GET';
  if (typeof input === 'string') {
    requestUrl = input;
  } else if (input instanceof URL) {
    requestUrl = input.toString();
  } else {
    requestUrl = (input as Request).url;
    method = (input as Request).method || method;
  }

  console.log(`[apiFetch] Request: ${method} ${requestUrl} (hasToken: ${!!token})`);

  const headers = new Headers(init?.headers ?? {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(input, { ...init, headers });
  } catch (e) {
    console.error(`[apiFetch] Network error for ${method} ${requestUrl}`, e);
    throw e;
  }

  console.log(`[apiFetch] Response: ${response.status} for ${method} ${requestUrl}`);

  if (response.status !== 401) {
    return response;
  }

  console.warn(`[apiFetch] 401 Unauthorized for ${method} ${requestUrl}. Attempting refresh.`);

  const newToken = await doRefresh();
  if (!newToken) {
    console.warn('[apiFetch] Refresh failed — logging out.');
    localStorage.removeItem('accessToken');
    if (accessTokenListener) {
      try {
        accessTokenListener(null);
      } catch (e) {
        console.error('[apiFetch] accessTokenListener error', e);
      }
    }
    if (logoutHandler) {
      try {
        console.log('[apiFetch] Calling logout handler');
        logoutHandler();
      } catch (e) {
        console.error('[apiFetch] logoutHandler error', e);
      }
    } else {
      window.location.replace('/login');
    }
    return response;
  }

  console.log(`[apiFetch] Retrying ${method} ${requestUrl} with refreshed token`);

  const retryHeaders = new Headers(init?.headers ?? {});
  retryHeaders.set('Authorization', `Bearer ${newToken}`);

  let retryResponse: Response;
  try {
    retryResponse = await fetch(input, { ...init, headers: retryHeaders });
  } catch (e) {
    console.error(`[apiFetch] Network error on retry for ${method} ${requestUrl}`, e);
    throw e;
  }

  console.log(`[apiFetch] Retry response: ${retryResponse.status} for ${method} ${requestUrl}`);

  if (retryResponse.status === 401) {
    console.warn('[apiFetch] Retry returned 401 — logging out.');
    localStorage.removeItem('accessToken');
    if (accessTokenListener) {
      try {
        accessTokenListener(null);
      } catch (e) {
        console.error('[apiFetch] accessTokenListener error', e);
      }
    }
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

  return retryResponse;
}
