import { useState } from 'react';
import { RightPanel } from '@/components/RightPanel';
import { LeftSidebar } from './components/LeftSidebar';
import { HomeFeed } from './pages/HomeFeed';
import { FriendsPage } from './pages/FriendsPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  const handleNewPost = () => {
    // Logic for creating a new post
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeFeed />;
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
      default:
        return <HomeFeed />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <LeftSidebar activeTab={activeTab} onTabChange={setActiveTab} onNewPost={handleNewPost} />
      <main className="ml-[220px] mr-[520px] min-h-screen border-x border-[#39444d]">
        {renderContent()}
      </main>
      <RightPanel />
    </div>
  );
}
