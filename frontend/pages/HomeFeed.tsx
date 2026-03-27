import { PostsFeed } from '../components/ui/PostsFeed';
import { Sparkles } from 'lucide-react';
import CreatePostForm from '../components/ui/NewPost';
import { forwardRef, useState } from 'react';

interface HomeFeedProps {
  isVisible?: boolean;
}

export const HomeFeed = forwardRef<HTMLTextAreaElement, HomeFeedProps>(
  ({ isVisible = true }, ref) => {
    const [postsRefreshKey, setPostsRefreshKey] = useState(0);

    const handlePostCreated = () => {
      setPostsRefreshKey((prev) => prev + 1);
    };

    return (
      <div className="border-b border-[#39444d]" style={{ display: isVisible ? 'block' : 'none' }}>
        <div className="sticky top-0 backdrop-blur-xl bg-[#0f172a]/80 border-b border-[#39444d] z-10">
          <div className="flex items-center justify-between p-4">
            <h1 className="font-bold text-[20px] text-[#f7f9f9]">Home</h1>
            <button className="p-2 hover:bg-[#1e293b] rounded-full transition-colors">
              <Sparkles className="size-5" style={{ color: 'var(--color-1)' }} />
            </button>
          </div>
          <div className="flex border-b border-[#39444d]">
            <button
              className="flex-1 py-4 font-medium text-[15px] text-[#f7f9f9] border-b-4 transition-colors hover:bg-[#1e293b]"
              style={{ borderColor: 'var(--color-1)' }}
            >
              For You
            </button>
            <button className="flex-1 py-4 font-medium text-[15px] text-[#8b98a5] hover:bg-[#1e293b] transition-colors">
              Following
            </button>
          </div>
        </div>
        <CreatePostForm onPostCreated={handlePostCreated} ref={ref} />
        <PostsFeed refreshKey={postsRefreshKey} />
      </div>
    );
  },
);

HomeFeed.displayName = 'HomeFeed';
