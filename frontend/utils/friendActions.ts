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
      showToast('Failed to perform friend action', 'error');
    }
  } catch (e) {
    showToast('An error occurred while performing friend action', 'error');
  } finally {
    setBusy(false);
  }
}
