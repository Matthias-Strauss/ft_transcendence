import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { PostCard } from './PostCard';
import { Post } from '../../mock_data/mock';

interface ApiResponse {
  items: Post[];
  meta: {
    total: number;
  };
}

interface PostsFeedProps {
  refreshKey?: number;
}

export function PostsFeed({ refreshKey = 0 }: PostsFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const response = await apiFetch('/api/posts', { method: 'GET' });

        if (!response.ok) throw new Error('Failed to fetch posts');

        const data: ApiResponse = await response.json();
        setPosts(data.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void fetchPosts();
  }, [refreshKey]);

  if (loading) return <p>Loading posts...</p>;
  if (posts.length === 0) return <p>No posts found.</p>;

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
