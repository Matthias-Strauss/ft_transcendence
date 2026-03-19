import { useState, useEffect } from 'react';
import { PostCard } from './PostCard';
import { Post } from '../../mock_data/mock';

interface ApiResponse {
  items: Post[];
  meta: {
    total: number;
  };
}

export function PostsFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        const response = await fetch('/api/posts', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch posts');

        const data: ApiResponse = await response.json();
        console.log('API response:', data);
        setPosts(data.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

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
