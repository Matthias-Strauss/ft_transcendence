import { PostCard } from '../components/ui/PostCard';
import { MOCK_POSTS } from '../mock_data/mock';
import { Sparkles } from 'lucide-react';

export function HomeFeed() {
  return (
    <div className="border-b border-[#39444d]">
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

      <div className="border-b border-[#39444d] p-4">
        <div className="flex gap-3">
          <div className="size-12 rounded-full bg-gradient-to-br from-[var(--color-1)] to-[var(--color-2)] shrink-0" />
          <div className="flex-1">
            <textarea
              placeholder="What's happening in your game?"
              className="w-full bg-transparent text-[20px] text-[#f7f9f9] placeholder:text-[#8b98a5] resize-none outline-none mb-3"
              rows={2}
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">{/* Icon buttons would go here */}</div>
              <button
                className="px-6 py-2 rounded-full font-bold text-[15px] transition-colors"
                style={{
                  background: 'var(--color-1)',
                  color: '#f7f9f9',
                }}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
      <div>
        {MOCK_POSTS.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
