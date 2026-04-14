import { useCallback, useEffect, useState } from 'react';
import type { Post } from '../types/posts';
import { apiFetch } from '../utils/api';
import showToast from '../utils/toast';
import { SavedCard } from '../components/ui/SavedCard';

interface BookmarksResponse {
  items: Post[];
  meta?: {
    hasMore?: boolean;
    nextCursor?: string | null;
  };
}

interface BookmarkedProps {
  pageSize?: number;
}

export function Bookmarked({ pageSize = 10 }: BookmarkedProps) {
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (cursor?: string | null, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const url = `/api/me/bookmarks?limit=${pageSize}${
          cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''
        }`;
        const response = await apiFetch(url, { method: 'GET' });
        if (!response.ok) {
          throw new Error('Failed to load bookmarked posts');
        }

        const data: BookmarksResponse = await response.json();
        const onlySaved = (data.items ?? []).filter((post) => post.bookmarkedByMe);

        if (append) {
          setBookmarkedPosts((prev) => [...prev, ...onlySaved]);
        } else {
          setBookmarkedPosts(onlySaved);
        }

        setHasMore(Boolean(data.meta?.hasMore));
        setNextCursor(data.meta?.nextCursor ?? null);
      } catch {
        showToast('Error loading bookmarked posts. Please try again.', 'error');
      } finally {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    setBookmarkedPosts([]);
    setHasMore(false);
    setNextCursor(null);
    void fetchPage(null, false);
  }, [fetchPage]);

  const loadMore = async () => {
    if (!hasMore || loadingMore || !nextCursor) {
      return;
    }
    await fetchPage(nextCursor, true);
  };

  return (
    <div className="border-b border-[#39444d]">
      <div className="sticky top-0 backdrop-blur-xl bg-[#0f172a]/80 border-b border-[#39444d] z-10">
        <div className="p-4">
          <h1 className="font-bold text-[20px] text-[#f7f9f9]">Saved posts</h1>
          <p className="text-[#8b98a5] text-sm">Posts you bookmarked.</p>
        </div>
      </div>

      {loading && <p className="p-4 text-[#8b98a5]">Loading saved posts...</p>}

      {!loading && bookmarkedPosts.length === 0 && (
        <p className="p-4 text-[#8b98a5]">No saved posts yet.</p>
      )}

      {!loading && bookmarkedPosts.map((post) => <SavedCard key={post.id} post={post} />)}

      {hasMore && (
        <div className="mt-4 mb-6 text-center">
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
