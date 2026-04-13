import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { PostCard } from './PostCard';
import type { Post } from '../../types/posts';

interface ApiResponse {
  items: Post[];
  meta?: {
    count?: number;
    limit?: number;
    hasMore?: boolean;
    nextCursor?: string | null;
  };
}

interface PostsFeedProps {
  refreshKey?: number;
  pageSize?: number;
}

export function PostsFeed({ refreshKey = 0, pageSize = 10 }: PostsFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  async function fetchPage(cursor?: string | null, append = false) {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const url = `/api/posts?limit=${pageSize}${
        cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''
      }`;
      const response = await apiFetch(url, { method: 'GET' });
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data: ApiResponse = await response.json();
      const items = data.items || [];

      if (append) setPosts((prev) => [...prev, ...items]);
      else setPosts(items);

      setHasMore(Boolean(data.meta?.hasMore));
      setNextCursor(data.meta?.nextCursor ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }

  useEffect(() => {
    setPosts([]);
    setNextCursor(null);
    setHasMore(false);
    void fetchPage(null, false);
  }, [refreshKey, pageSize]);

  const loadMore = async () => {
    if (!hasMore || loadingMore || !nextCursor) return;
    await fetchPage(nextCursor, true);
  };

  if (loading) return <p>Loading posts...</p>;
  if (posts.length === 0) return <p>No posts found.</p>;

  return (
    <div>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onDeleted={(id) => {
            setPosts((prev) => prev.filter((p) => p.id !== id));
          }}
        />
      ))}

      {hasMore && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="bg-[var(--color-1)] hover:bg-[var(--color-1)]/90 text-[#f7f9f9] rounded-full py-2 px-4 transition-colors disabled:opacity-40"
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
