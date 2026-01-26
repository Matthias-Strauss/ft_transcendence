import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { Post } from '../mock_data/mock';
import { BadgeCheck } from 'lucide-react';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <div className="border-b border-[#39444d] p-4 hover:bg-[#1e293b]/30 transition-colors cursor-pointer">
      <div className="flex gap-3">
        <div className="size-12 rounded-full overflow-hidden shrink-0">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-bold text-[15px] text-[#f7f9f9] truncate">
                {post.author.name}
              </span>
              {post.author.verified && <BadgeCheck className="size-5" color="var(--color-1)" />}

              <span className="text-[15px] text-[#8b98a5] truncate">{post.author.username}</span>
              <span className="text-[#8b98a5]">·</span>
              <span className="text-[15px] text-[#8b98a5]">{post.timestamp}</span>
            </div>
            <button className="p-1 hover:bg-[var(--color-1)]/10 rounded-full transition-colors">
              <MoreHorizontal className="size-5 text-[#8b98a5]" />
            </button>
          </div>

          {post.gameTag && (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-[var(--color-1)]/20 to-[var(--color-2)]/20 border border-[var(--color-1)]/30 text-[var(--color-3)]">
                {post.gameTag}
              </span>
            </div>
          )}

          <p className="text-[15px] text-[#f7f9f9] leading-5 mb-3 whitespace-pre-wrap">
            {post.content}
          </p>
          {post.image && (
            <div className="mb-3 rounded-2xl overflow-hidden border border-[#39444d]">
              <img src={post.image} alt="Post image" className="w-full h-auto" />
            </div>
          )}

          <div className="flex items-center justify-between max-w-md mt-2">
            <button className="flex items-center gap-2 group hover:text-[var(--color-1)] transition-colors">
              <div className="p-2 rounded-full group-hover:bg-[var(--color-1)]/10 transition-colors">
                <MessageCircle className="size-[18px] text-[#8b98a5] group-hover:text-[var(--color-1)]" />
              </div>
              <span className="text-[13px] text-[#8b98a5] group-hover:text-[var(--color-1)]">
                {post.comments}
              </span>
            </button>

            <button className="flex items-center gap-2 group hover:text-[var(--color-2)] transition-colors">
              <div className="p-2 rounded-full group-hover:bg-[var(--color-2)]/10 transition-colors">
                <Heart className="size-[18px] text-[#8b98a5] group-hover:text-[var(--color-2)] group-hover:fill-[var(--color-2)]" />
              </div>
              <span className="text-[13px] text-[#8b98a5] group-hover:text-[var(--color-2)]">
                {post.likes}
              </span>
            </button>

            <button className="flex items-center gap-2 group hover:text-[var(--color-3)] transition-colors">
              <div className="p-2 rounded-full group-hover:bg-[var(--color-3)]/10 transition-colors">
                <Share2 className="size-[18px] text-[#8b98a5] group-hover:text-[var(--color-3)]" />
              </div>
              <span className="text-[13px] text-[#8b98a5] group-hover:text-[var(--color-3)]">
                {post.shares}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
