import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { Menu, MessageCircle, X } from 'lucide-react';
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
import Notifications from './pages/Notifications';
import showToast from './utils/toast';
import { clearClientSession } from './utils/api';
import usePongStore from './utils/pongState';
import useNotificationStore from './utils/notificationStore';
import useFriendRequestStore from './utils/friendRequestStore';

const ROOT_TABS = new Set(['home', 'notifications', 'messages', 'friends', 'saved']);

export default function SocialApp() {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldFocusComposerRef = useRef(false);
  const resolvingDefaultChatRef = useRef(false);
  const [activeTab, setActiveTab] = useState('home');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [composerRequestId, setComposerRequestId] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const viewingUser = location.pathname.startsWith('/users/');
  const viewingGame = location.pathname === '/game';
  const showingNestedRoute = viewingUser || viewingGame;
  const handleTabChange = useCallback(
    (tab: string) => {
      if (ROOT_TABS.has(tab) && location.pathname !== '/') {
        navigate('/');
      }
      setActiveTab(tab);
    },
    [location.pathname, navigate],
  );

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
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    type ChatMessagePayload = {
      sender?: { username?: string | null } | null;
      username?: string | null;
      recipient?: { username?: string | null } | null;
      to?: string | null;
    };

    const onChatMessage = (payload: ChatMessagePayload) => {
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
      } catch (err) {}
    };

    socket.on('chat:message', onChatMessage);
    return () => {
      socket.off('chat:message', onChatMessage);
    };
  }, []);

  useEffect(() => {
    const onNotification = (payload: any) => {
      try {
        const me = useUserStore.getState().user?.username ?? null;
        if (!me) return;
        const recipientUsername = payload?.recipient?.username ?? null;
        if (!recipientUsername || recipientUsername !== me) return;

        if (activeTab === 'notifications') return;

        useNotificationStore.getState().incrementUnread(1);
      } catch {}
    };

    socket.on('notification', onNotification);
    return () => {
      socket.off('notification', onNotification);
    };
  }, [activeTab]);

  useEffect(() => {
    const onFriendRequest = (payload: any) => {
      try {
        const me = useUserStore.getState().user?.username ?? null;
        const recipientUsername = payload?.recipient?.username ?? null;
        if (!me || !recipientUsername || recipientUsername !== me) return;

        useFriendRequestStore.getState().incrementIncoming(1);
        try {
          window.dispatchEvent(new CustomEvent('friend:request', { detail: payload }));
        } catch {}
      } catch {}
    };

    socket.on('friend:request', onFriendRequest);
    return () => {
      socket.off('friend:request', onFriendRequest);
    };
  }, []);

  useEffect(() => {
    const onFriendAccepted = (payload: any) => {
      try {
        const me = useUserStore.getState().user?.username ?? null;
        const recipientUsername = payload?.recipient?.username ?? null;
        if (!me || !recipientUsername || recipientUsername !== me) return;

        window.dispatchEvent(new CustomEvent('friend:accepted', { detail: payload }));

        const name = payload?.accepter?.displayname ?? payload?.accepter?.username ?? 'Someone';
        showToast(`${name} accepted your friend request!`, 'success');
      } catch {}
    };

    const onFriendDeclined = (payload: any) => {
      try {
        const me = useUserStore.getState().user?.username ?? null;
        const recipientUsername = payload?.recipient?.username ?? null;
        if (!me || !recipientUsername || recipientUsername !== me) return;

        window.dispatchEvent(new CustomEvent('friend:declined', { detail: payload }));

        const name = payload?.decliner?.displayname ?? payload?.decliner?.username ?? 'Someone';
        showToast(`${name} declined your friend request.`, 'info');
      } catch {}
    };

    const onFriendWithdrawn = (payload: any) => {
      try {
        const me = useUserStore.getState().user?.username ?? null;
        const recipientUsername = payload?.recipient?.username ?? null;
        if (!me || !recipientUsername || recipientUsername !== me) return;
 
        useFriendRequestStore.getState().incrementIncoming(-1);
        window.dispatchEvent(new CustomEvent('friend:withdrawn', { detail: payload }));

        const name = payload?.withdrawer?.displayname ?? payload?.withdrawer?.username ?? 'Someone';
        showToast(`${name} withdrew their friend request.`, 'info');
      } catch {}
    };

    socket.on('friend:accepted', onFriendAccepted);
    socket.on('friend:declined', onFriendDeclined);
    socket.on('friend:withdrawn', onFriendWithdrawn);

    return () => {
      socket.off('friend:accepted', onFriendAccepted);
      socket.off('friend:declined', onFriendDeclined);
      socket.off('friend:withdrawn', onFriendWithdrawn);
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
        (data.items || []).forEach(
          (it: { target?: { username?: string | null }; unreadCount?: number }) => {
            const uname = it?.target?.username;
            if (uname) useChatStore.getState().setUnreadForUser(uname, it.unreadCount ?? 0);
          },
        );
      } catch {}
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

  useEffect(() => {
    const onMatched = (payload: any) => {
      if (!payload?.matchId || !payload?.youAre || !payload?.opponent) {
        return;
      }

      usePongStore.getState().setActiveMatch({
        matchId: payload.matchId,
        youAre: payload.youAre,
        opponent: payload.opponent,
        score: { p1: 0, p2: 0 },
      });

      useChatStore.getState().setPanelOpen(false);

      if (location.pathname !== '/game') {
        navigate('/game');
      }
    };

    const onResumed = (payload: any) => {
      if (!payload?.matchId || !payload?.youAre || !payload?.opponent || !payload?.score) {
        return;
      }

      usePongStore.getState().setActiveMatch({
        matchId: payload.matchId,
        youAre: payload.youAre,
        opponent: payload.opponent,
        score: payload.score,
      });

      useChatStore.getState().setPanelOpen(false);

      if (location.pathname !== '/game') {
        navigate('/game');
      }
    };

    const onEnded = () => {
      usePongStore.getState().clearActiveMatch();
    };

    socket.on('pong:matched', onMatched);
    socket.on('pong:resumed', onResumed);
    socket.on('pong:ended', onEnded);

    return () => {
      socket.off('pong:matched', onMatched);
      socket.off('pong:resumed', onResumed);
      socket.off('pong:ended', onEnded);
    };
  }, [location.pathname, navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeFeed ref={inputRef} />;
      case 'notifications':
        return <Notifications />;
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
      <button
        type="button"
        className="fixed left-3 top-3 z-[1300] inline-flex size-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900/95 text-slate-100 shadow-lg backdrop-blur md:hidden"
        aria-label={mobileSidebarOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileSidebarOpen}
        onClick={() => setMobileSidebarOpen((v) => !v)}
      >
        {mobileSidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {mobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[1100] bg-black/50 backdrop-blur-[1px] md:hidden"
          aria-label="Close sidebar backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <LeftSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onNewPost={handleNewPost}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="ml-0 flex gap-3 px-2 pb-2 pt-14 md:ml-[220px] md:gap-6 md:px-4 md:py-4">
        <main className="min-h-[calc(100vh-1rem)] flex-1 bg-[#0f172a] md:min-h-[calc(100vh-2rem)] md:border-x md:border-[#39444d]">
          {!showingNestedRoute && <HomeFeed ref={inputRef} isVisible={activeTab === 'home'} />}
          {!showingNestedRoute && activeTab !== 'home' && renderContent()}
          {showingNestedRoute && <Outlet />}
        </main>

        {chatPanelOpen ? (
          <ChatPanel onClose={() => useChatStore.setState({ panelOpen: false })} />
        ) : (
          <button
            type="button"
            className="fixed bottom-4 right-4 z-[1100] inline-flex size-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_8px_24px_rgba(148,163,184,0.35)] transition hover:-translate-y-0.5 hover:bg-slate-50 md:bottom-6 md:right-6 md:size-14"
            aria-label="Open chat"
            onClick={() => {
              void resolveDefaultChatTarget();
            }}
          >
            <MessageCircle className="size-5 text-sky-600 md:size-6" />
          </button>
        )}
      </div>
    </div>
  );
}
