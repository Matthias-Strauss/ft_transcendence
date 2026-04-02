import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { Post } from '../../mock_data/mock';
import { User } from './User';
import { DropdownItem } from '../../mock_data/mock';
import { Bookmark, Repeat2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import Dropdown from './Dropdown';
import CommentSection from './CommentSection';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const items: DropdownItem[] = [
    { id: 0, text: 'Save', icon: <Bookmark /> },
    { id: 1, text: 'Share', icon: <Repeat2 /> },
  ];
  const token = localStorage.getItem('accessToken');
  const [isOpen, setIsOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(
    post.commentCount ?? post.comments?.meta?.total ?? 0,
  );
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [isLiked, setLiked] = useState(post.likedByMe);
  const [isLikePending, setIsLikePending] = useState(false);
  const [shareCount, setShared] = useState(post.shareCount ?? 0);

  useEffect(() => {
    setCommentCount(post.commentCount ?? post.comments?.meta?.total ?? 0);
    setLikeCount(post.likeCount ?? 0);
    setLiked(post.likedByMe);
    setShared(post.shareCount ?? 0);
  }, [
    post.commentCount,
    post.comments?.meta?.total,
    post.likeCount,
    post.likedByMe,
    post.shareCount,
  ]);

  const handleCommentCreated = () => {
    setCommentCount((prev) => prev + 1);
  };

  const handleDropdownActionSuccess = (action: string) => {
    if (action === 'Share') {
      setShared((prev) => prev + 1);
    }
  };

  const handlePostLike = async () => {
    if (isLikePending || !token) {
      return;
    }

    const previousLiked = isLiked;
    const previousLikeCount = likeCount;
    const nextLiked = !isLiked;

    setIsLikePending(true);
    setLiked(nextLiked);
    setLikeCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));

    try {
      const response = await apiFetch(`/api/posts/${post.id}/like`, {
        method: nextLiked ? 'POST' : 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to update like state');
      }

      const payload = (await response.json()) as { likeCount?: number; likedByMe?: boolean };

      if (typeof payload.likeCount === 'number') {
        setLikeCount(payload.likeCount);
      }

      if (typeof payload.likedByMe === 'boolean') {
        setLiked(payload.likedByMe);
      }
    } catch {
      setLiked(previousLiked);
      setLikeCount(previousLikeCount);
    } finally {
      setIsLikePending(false);
    }
  };

  return (
    <div className="border-b border-[#39444d] p-4 hover:bg-[#1e293b]/30 transition-colors cursor-pointer">
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <User
              avatar={post.author.avatarUrl}
              name={post.author.name}
              username={post.author.username}
              verified={post.author.verified}
            />
            <div className="relative">
              <button
                className="p-1 hover:bg-[var(--color-1)]/10 rounded-full transition-colors"
                onClick={() => setIsOpen((prev) => !prev)}
              >
                <MoreHorizontal className="size-5 text-[#8b98a5]" />
              </button>
              {isOpen && (
                <Dropdown
                  items={items}
                  isOpen={isOpen}
                  setIsOpen={setIsOpen}
                  postId={post.id}
                  authorId={post.authorId}
                  onActionSuccess={handleDropdownActionSuccess}
                />
              )}
            </div>
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
          {post.imageUrl && (
            <div className="mb-3 rounded-2xl overflow-hidden border border-[#39444d]">
              <img src={post.imageUrl} alt="Post image" className="w-full h-auto" />
            </div>
          )}

          <div className="flex items-center justify-between max-w-md mt-2">
            <button
              className="flex items-center gap-2 transition-colors"
              onClick={() => setCommentOpen((prev) => !prev)}
            >
              <div className="p-2 rounded-full transition-colors">
                <MessageCircle className="size-[18px] text-[#8b98a5]" />
              </div>
              <span className="text-[13px] text-[#8b98a5]">{commentCount}</span>
            </button>

            <button
              className="flex items-center gap-2 group transition-colors"
              onClick={handlePostLike}
              aria-pressed={isLiked}
              disabled={isLikePending}
            >
              <div
                className={`p-2 rounded-full transition-colors
      ${isLiked ? 'bg-[var(--color-2)]/10' : 'group-hover:bg-[var(--color-2)]/10'}`}
              >
                <Heart
                  fill={isLiked ? 'currentColor' : 'none'}
                  className={`
    size-[18px] transition-colors stroke-current
    ${isLiked ? 'text-[var(--color-2)]' : 'text-[#8b98a5] group-hover:text-[var(--color-2)]'}
  `}
                />
              </div>

              <span
                className={`
      text-[13px] transition-colors
      ${isLiked ? 'text-[var(--color-2)]' : 'text-[#8b98a5] group-hover:text-[var(--color-2)]'}
    `}
              >
                {likeCount}
              </span>
            </button>

            <button className="flex items-center gap-2 group transition-colors">
              <div className="p-2 rounded-full transition-colors">
                <Share2 className="size-[18px] text-[#8b98a5]" />
              </div>
              <span className="text-[13px] text-[#8b98a5] ">{shareCount}</span>
            </button>
          </div>
          {commentOpen && <CommentSection post={post} onCommentCreated={handleCommentCreated} />}
        </div>
      </div>
    </div>
  );
}
