import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { PostCard } from '../components/ui/PostCard';
import { Post } from '../mock_data/mock';

interface UserResponse {
  username?: string;
  displayname?: string;
  avatarUrl?: string | null;
}

export default function UserProfile() {
  const { username } = useParams();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;

    async function load() {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/users/${username}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }

        const postsRes = await apiFetch(`/api/users/${username}/posts`);
        if (postsRes.ok) {
          const payload = await postsRes.json();
          setPosts(payload.items || []);
        }
      } catch (e) {
        console.error('Failed to load user profile', e);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [username]);
  if (loading) return <div className="p-8 text-[#8b98a5]">Loading profile...</div>;

  if (!user) return <div className="p-8 text-[#8b98a5]">User not found</div>;

  return (
    <div>
      <div className="sticky top-0 backdrop-blur-xl bg-[#0f172a]/80 border-b border-[#39444d] z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="font-bold text-[20px] text-[#f7f9f9]">
            {user.displayname ?? user.username}
          </h1>
        </div>
      </div>

      <div className="p-6 border-b border-[#39444d] flex gap-6 items-center">
        <div className="size-20 rounded-full overflow-hidden bg-[#0b1220]">
          <img
            src={user.avatarUrl ?? '/uploads/avatars/default.png'}
            alt={user.displayname ?? user.username}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-[18px] font-bold text-[#f7f9f9]">
                {user.displayname ?? 'Unknown'}
              </h2>
              <div className="text-[15px] text-[#8b98a5]">
                {user.username ? `@${user.username}` : ''}
              </div>
            </div>
          </div>
          <div className="mt-3 text-[#8b98a5]">
            {posts.length} posts • — followers • — following
          </div>
        </div>
      </div>

      <div>
        {posts.length === 0 ? (
          <div className="p-8 text-[#8b98a5]">No posts yet</div>
        ) : (
          posts.map((post) => <PostCard post={post} key={post.id} />)
        )}
      </div>
    </div>
  );
}
