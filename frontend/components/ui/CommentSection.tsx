import { Post } from '../../mock_data/mock';
import { Heart, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { Comment } from '../../mock_data/mock';
import { CommentsResponse } from '../../mock_data/mock';

interface PostProp {
  post: Post;
  onCommentCreated?: () => void;
}

async function getComment({ postId }: { postId: string }): Promise<CommentsResponse> {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Access token is invalid');
  }

  const res = await apiFetch(`/api/posts/${postId}/comments`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch comments: ${res.status}`);
  }

  return res.json();
}

export default function CommentSection({ post, onCommentCreated }: PostProp) {
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<CommentsResponse | null>(null);

  const handleCommentSubmit = async () => {
    const content = commentInput.trim();
    if (!content) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('Access token is invalid');
      return;
    }

    const res = await apiFetch(`/api/posts/${post.id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Failed to submit comment:', res.status, errorText);
      return;
    }

    const createdComment: Comment = await res.json();

    setComments((prev) => {
      if (!prev) {
        return {
          items: [createdComment],
          meta: {
            total: 1,
            order: 'createdAt_asc',
          },
        };
      }

      return {
        items: [...prev.items, createdComment],
        meta: {
          ...prev.meta,
          total: prev.meta.total + 1,
        },
      };
    });

    onCommentCreated?.();
    setCommentInput('');
  };

  useEffect(() => {
    async function load() {
      try {
        const data = await getComment({ postId: post.id });
        setComments(data);
      } catch (error) {
        console.error('Failed to load comments:', error);
      }
    }

    void load();
  }, [post.id]);

  return (
    <div className="border-t border-[#39444d] bg-[#0f172a]">
      <div className="p-4 border-b border-[#39444d]">
        <div className="flex gap-3">
          <div className="size-10 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-[var(--color-1)] to-[var(--color-2)] flex items-center justify-center">
            <span className="text-[14px] font-bold text-white">P</span>
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleCommentSubmit();
                }
              }}
              className="flex-1 bg-transparent border-b border-[#39444d] py-2 text-[15px] text-[#f7f9f9] placeholder:text-[#8b98a5] focus:outline-none focus:border-[var(--color-1)] transition-colors"
            />
            <button
              onClick={() => void handleCommentSubmit()}
              disabled={!commentInput.trim()}
              className="p-2 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-1)]/10"
            >
              <Send
                className="size-5"
                style={{ color: commentInput.trim() ? 'var(--color-1)' : '#8b98a5' }}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {comments?.items?.map((comment) => (
          <div key={comment.id} className="p-4 hover:bg-[#1e293b]/30 transition-colors">
            <div className="flex gap-3">
              <div className="size-10 rounded-full overflow-hidden shrink-0">
                <img
                  src={comment.author?.avatarUrl}
                  alt={comment.author?.displayname}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  <span className="font-bold text-[14px] text-[#f7f9f9]">
                    {comment.author?.displayname}
                  </span>
                  <span className="text-[14px] text-[#8b98a5]">{comment.author?.username}</span>
                  <span className="text-[#8b98a5]">·</span>
                  <span className="text-[13px] text-[#8b98a5]">
                    {comment.createdAt.split('T')[0]}
                  </span>
                </div>
                <p className="text-[14px] text-[#f7f9f9] leading-5 mb-2">{comment.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
