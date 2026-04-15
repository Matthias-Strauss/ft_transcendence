import showToast from './toast';

export async function runFriendAction(
  username: string,
  apiCall: (username: string) => Promise<Response>,
  setBusy: (v: boolean) => void,
  onSuccess?: (data: any) => void,
) {
  setBusy(true);
  try {
    const res = await apiCall(username);
    if (res.ok) {
      try {
        const data = await res.json();
        onSuccess?.(data);
      } catch (e) {
        onSuccess?.(undefined);
      }
    } else {
      const text = await res.text().catch(() => '<no body>');
      showToast(`[runFriendAction] request failed ${res.status} ${text}`, 'error');
    }
  } catch (e) {
    showToast('[runFriendAction] error', 'error');
  } finally {
    setBusy(false);
  }
}
