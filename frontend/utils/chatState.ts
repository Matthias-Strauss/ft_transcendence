const CHAT_TARGET_KEY = 'chat.targetUsername';
const CHAT_PANEL_OPEN_KEY = 'chat.panelOpen';
const CHAT_STATE_EVENT = 'chat-state-updated';

function notifyChatStateUpdated() {
  window.dispatchEvent(new Event(CHAT_STATE_EVENT));
}

export function getChatTargetUsername(): string | null {
  const value = localStorage.getItem(CHAT_TARGET_KEY);
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function setChatTargetUsername(username: string) {
  const normalized = username.trim().replace(/^@/, '');
  if (!normalized) return;
  localStorage.setItem(CHAT_TARGET_KEY, normalized);
  notifyChatStateUpdated();
}

export function clearChatTargetUsername() {
  localStorage.removeItem(CHAT_TARGET_KEY);
  notifyChatStateUpdated();
}

export function isChatPanelOpen(): boolean {
  const raw = localStorage.getItem(CHAT_PANEL_OPEN_KEY);
  return raw !== '0';
}

export function setChatPanelOpen(isOpen: boolean) {
  localStorage.setItem(CHAT_PANEL_OPEN_KEY, isOpen ? '1' : '0');
  notifyChatStateUpdated();
}

export function subscribeToChatState(onChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (!event.key) return;
    if (event.key === CHAT_TARGET_KEY || event.key === CHAT_PANEL_OPEN_KEY) {
      onChange();
    }
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(CHAT_STATE_EVENT, onChange);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(CHAT_STATE_EVENT, onChange);
  };
}
