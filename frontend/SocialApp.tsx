import { useEffect, useState } from 'react';
// import { RightPanel } from './components/RightPanel';
import { ChatPanel } from './components/ChatPanel';
import { LeftSidebar } from './components/LeftSidebar';
import { HomeFeed } from './pages/HomeFeed';
import { FriendsPage } from './pages/FriendsPage';
import { useRef } from 'react';

export default function SocialApp() {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldFocusComposerRef = useRef(false);
  const [activeTab, setActiveTab] = useState('home');

  const handleNewPost = () => {
    shouldFocusComposerRef.current = true;
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
        return (
          <div className="p-8 text-center">
            <h2 className="font-bold text-[20px] text-[#f7f9f9] mb-2">Saved</h2>
            <p className="text-[#8b98a5]">Your saved posts will appear here</p>
          </div>
        );
      case 'profile':
        return (
          <div className="p-8 text-center">
            <h2 className="font-bold text-[20px] text-[#f7f9f9] mb-2">Profile</h2>
            <p className="text-[#8b98a5]">Your profile will appear here</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <LeftSidebar activeTab={activeTab} onTabChange={setActiveTab} onNewPost={handleNewPost} />

      <div className="ml-[220px] gap-6 px-4 py-4 flex">
        <main className="min-h-[calc(100vh-2rem)] flex-1 border-x border-[#39444d] bg-[#0f172a]">
          <HomeFeed ref={inputRef} isVisible={activeTab === 'home'} />
          {activeTab !== 'home' && renderContent()}
        </main>

        <aside className="fixed right-0 top-0 hidden h-[calc(100vh-2rem)] w-[390px] xl:block">
          <ChatPanel />
        </aside>
      </div>
    </div>
  );
}
