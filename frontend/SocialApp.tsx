import { useEffect, useState, useRef } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import './styles/chat.css';
import { ChatPanel } from './components/ChatPanel';
import { LeftSidebar } from './components/LeftSidebar';
import { HomeFeed } from './pages/HomeFeed';
import { FriendsPage } from './pages/FriendsPage';
import { ProfilePage } from './pages/ProfilePage';
import { setLogoutHandler, setAccessTokenListener } from './utils/api';
import useChatStore from './utils/chatState';
import { Bookmarked } from './pages/Bookmarked';

export default function SocialApp() {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldFocusComposerRef = useRef(false);
  const [activeTab, setActiveTab] = useState('home');
  const navigate = useNavigate();
  const location = useLocation();
  const viewingUser = location.pathname.startsWith('/users/');

  const handleNewPost = () => {
    shouldFocusComposerRef.current = true;

    if (location.pathname !== '/') {
      navigate('/');
    }
    setActiveTab('home');
  };

  useEffect(() => {
    if (!shouldFocusComposerRef.current || activeTab !== 'home') {
      return;
    }

    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    inputRef.current?.focus();
    shouldFocusComposerRef.current = false;
  }, [activeTab]);

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
          console.log('[tokenWatcher] token already expired — logging out');
          localStorage.removeItem('accessToken');
          navigate('/login', { replace: true });
          return;
        }
        console.log(`[tokenWatcher] scheduling logout in ${msLeft}ms`);
        timer = setTimeout(() => {
          console.log('[tokenWatcher] token expired — logging out');
          localStorage.removeItem('accessToken');
          navigate('/login', { replace: true });
        }, msLeft + 500);
      } catch {}
    }

    scheduleForToken(localStorage.getItem('accessToken'));

    setAccessTokenListener((t) => scheduleForToken(t));
  }, [navigate]);

  const chatPanelOpen = useChatStore((state) => state.panelOpen);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeFeed ref={inputRef} />;
      case 'leaderboard':
        return (
          <div className="p-8 text-center">
            <h2 className="font-bold text-[20px] text-[#f7f9f9] mb-2">Leaderboard</h2>
            <p className="text-[#8b98a5]">Check out the top players!</p>
          </div>
        );
      case 'notifications':
        return (
          <div className="p-8 text-center">
            <h2 className="font-bold text-[20px] text-[#f7f9f9] mb-2">Notifications</h2>
            <p className="text-[#8b98a5]">Your notifications will appear here</p>
          </div>
        );
      case 'messages':
        return (
          <div className="p-8 text-center">
            <h2 className="font-bold text-[20px] text-[#f7f9f9] mb-2">Messages</h2>
            <p className="text-[#8b98a5]">Your messages will appear here</p>
          </div>
        );
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
          {!viewingUser && <HomeFeed ref={inputRef} isVisible={activeTab === 'home'} />}
          {!viewingUser && activeTab !== 'home' && renderContent()}
          {viewingUser && <Outlet />}
        </main>

        {chatPanelOpen ? (
          <aside className="fixed right-0 top-0 hidden h-[calc(100vh-2rem)] w-[390px] xl:block">
            <ChatPanel onClose={() => useChatStore.setState({ panelOpen: false })} />
          </aside>
        ) : (
          <button
            type="button"
            className="chat-toggle-btn"
            aria-label="Open chat"
            onClick={() => {
              useChatStore.setState({ panelOpen: true });
            }}
          >
            <MessageCircle className="chat-toggle-icon" />
          </button>
        )}
      </div>
    </div>
  );
}
