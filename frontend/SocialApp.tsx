import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import './styles/chat.css';
import { ChatPanel } from './components/ChatPanel';
import ConversationsList from './components/ConversationsList';
import { LeftSidebar } from './components/LeftSidebar';
import { HomeFeed } from './pages/HomeFeed';
import { FriendsPage } from './pages/FriendsPage';
import { ProfilePage } from './pages/ProfilePage';
import { setLogoutHandler, setAccessTokenListener, apiFetch } from './utils/api';
import useChatStore from './utils/chatState';
import useUserStore from './utils/userStore';
import { socket } from './socket';
import { Bookmarked } from './pages/Bookmarked';
import showToast from './utils/toast';
import { clearClientSession } from './utils/api';

export default function SocialApp() {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldFocusComposerRef = useRef(false);
  const resolvingDefaultChatRef = useRef(false);
  const [activeTab, setActiveTab] = useState('home');
  const [composerRequestId, setComposerRequestId] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const viewingUser = location.pathname.startsWith('/users/');
  const viewingGame = location.pathname === '/game';
  const showingNestedRoute = viewingUser || viewingGame;

  const handleNewPost = () => {
    shouldFocusComposerRef.current = true;

    if (location.pathname !== '/') {
      navigate('/');
    }
    setActiveTab('home');
    setComposerRequestId((n) => n + 1);
    if (showingNestedRoute) {
      navigate('/');
    }
  };

  useEffect(() => {
    if (!shouldFocusComposerRef.current || activeTab !== 'home' || showingNestedRoute) {
      return;
    }

    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    inputRef.current?.focus();
    shouldFocusComposerRef.current = false;
  }, [activeTab, composerRequestId, showingNestedRoute]);

  useEffect(() => {
    setLogoutHandler(() => navigate('/login', { replace: true }));

    let timer: ReturnType<typeof setTimeout> | null = null;

    function clearTimer() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    function scheduleForToken(token: string | null) {
      clearTimer();
      if (!token) return;
      try {
        const parts = token.split('.');
        if (parts.length < 2) return;
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const exp = payload.exp;
        if (!exp) return;
        const expMs = exp * 1000;
        const now = Date.now();
        const msLeft = expMs - now;
        if (msLeft <= 0) {
          showToast('[tokenWatcher] token already expired — logging out', 'info');
          clearClientSession();
          navigate('/login', { replace: true });
          return;
        }
        showToast(`[tokenWatcher] scheduling logout in ${msLeft}ms`, 'info');
        timer = setTimeout(() => {
          showToast('[tokenWatcher] token expired — logging out', 'info');
          clearClientSession();
          navigate('/login', { replace: true });
        }, msLeft + 500);
      } catch {}
    }

    scheduleForToken(localStorage.getItem('accessToken'));

    setAccessTokenListener((t) => scheduleForToken(t));
  }, [navigate]);

  const chatPanelOpen = useChatStore((state) => state.panelOpen);
  const targetUsername = useChatStore((state) => state.targetUsername);

  const resolveDefaultChatTarget = useCallback(async () => {
    if (resolvingDefaultChatRef.current) {
      return;
    }

    const { targetUsername: currentTarget } = useChatStore.getState();
    if (currentTarget) {
      useChatStore.setState({ panelOpen: true });
      return;
    }

    resolvingDefaultChatRef.current = true;

    try {
      const res = await apiFetch('/api/chat/conversations');

      if (!res.ok) {
        setActiveTab('messages');
        useChatStore.setState({ panelOpen: false });
        return;
      }

      const data = await res.json();
      const latestUsername = data?.items?.[0]?.target?.username;

      if (latestUsername) {
        useChatStore.setState({
          targetUsername: latestUsername,
          panelOpen: true,
        });
        return;
      }

      setActiveTab('messages');
      useChatStore.setState({ panelOpen: false });
    } catch {
      setActiveTab('messages');
      useChatStore.setState({ panelOpen: false });
    } finally {
      resolvingDefaultChatRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!chatPanelOpen || targetUsername || resolvingDefaultChatRef.current) {
      return;
    }

    void resolveDefaultChatTarget();
  }, [chatPanelOpen, targetUsername, resolveDefaultChatTarget]);

  useEffect(() => {
    const onChatMessage = (payload: any) => {
      try {
        if (!payload) return;

        const me = useUserStore.getState().user?.username ?? null;
        if (!me) return;

        const senderUsername = payload?.sender?.username ?? payload?.username ?? null;
        const recipientUsername = payload?.recipient?.username ?? payload?.to ?? null;

        if (!senderUsername || !recipientUsername) return;

        if (recipientUsername !== me) return;

        const other = senderUsername;
        const state = useChatStore.getState();
        const target = state.targetUsername;
        const panelOpen = state.panelOpen;

        if (panelOpen && target === other) {
          state.clearUnreadForUser(other);
        } else {
          state.incrementUnreadForUser(other, 1);
        }
      } catch (err) {
      }
    };

    socket.on('chat:message', onChatMessage);
    return () => {
      socket.off('chat:message', onChatMessage);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function syncUnreadFromServer() {
      try {
        const res = await apiFetch('/api/chat/conversations');
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted || !data?.items) return;
        (data.items || []).forEach((it: any) => {
          const uname = it?.target?.username;
          if (uname) useChatStore.getState().setUnreadForUser(uname, it.unreadCount ?? 0);
        });
      } catch (err) {
      }
    }

    void syncUnreadFromServer();

    const onConnect = () => {
      void syncUnreadFromServer();
    };

    socket.on('connect', onConnect);
    return () => {
      mounted = false;
      socket.off('connect', onConnect);
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeFeed ref={inputRef} />;
      case 'notifications':
        return (
          <div className="p-8 text-center">
            <h2 className="font-bold text-[20px] text-[#f7f9f9] mb-2">Notifications</h2>
            <p className="text-[#8b98a5]">Your notifications will appear here</p>
          </div>
        );
      case 'messages':
        return <ConversationsList />;
      case 'friends':
        return <FriendsPage />;
      case 'saved':
        return <Bookmarked />;
      case 'profile':
        return <ProfilePage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <LeftSidebar activeTab={activeTab} onTabChange={setActiveTab} onNewPost={handleNewPost} />

      <div className="ml-[220px] gap-6 px-4 py-4 flex">
        <main className="min-h-[calc(100vh-2rem)] flex-1 border-x border-[#39444d] bg-[#0f172a]">
          {!showingNestedRoute && <HomeFeed ref={inputRef} isVisible={activeTab === 'home'} />}
          {!showingNestedRoute && activeTab !== 'home' && renderContent()}
          {showingNestedRoute && <Outlet />}
        </main>

        {chatPanelOpen ? (
          <ChatPanel onClose={() => useChatStore.setState({ panelOpen: false })} />
        ) : (
          <button
            type="button"
            className="chat-toggle-btn"
            aria-label="Open chat"
            onClick={() => {
              void resolveDefaultChatTarget();
            }}
          >
            <MessageCircle className="chat-toggle-icon" />
          </button>
        )}
      </div>
    </div>
  );
}
