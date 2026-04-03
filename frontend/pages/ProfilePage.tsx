import { useEffect, useState } from 'react';
import { apiFetch, logout } from '../utils/api';
import { PostCard } from '../components/ui/PostCard';
import type { Post } from '../types/posts';

interface MeResponse {
  id?: string;
  username?: string;
  displayname?: string;
  avatarUrl?: string | null;
}

export function ProfilePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const meRes = await apiFetch('/api/me');
        if (meRes.ok) {
          const data = await meRes.json();
          setMe(data);
        }

        const postRes = await apiFetch('/api/me/posts');
        if (postRes.ok) {
          const payload = await postRes.json();
          setPosts(payload.items || []);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-[#8b98a5]">Loading profile...</div>;
  }

  const token = localStorage.getItem('accessToken');
  if (!token) {
    return (
      <div className="p-8 text-[#8b98a5]">
        Please log in to view your profile. Open the Login page to continue.
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 backdrop-blur-xl bg-[#0f172a]/80 border-b border-[#39444d] z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="font-bold text-[20px] text-[#f7f9f9]">Profile</h1>
        </div>
      </div>

      <div className="p-6 border-b border-[#39444d] flex gap-6 items-center">
        <div className="size-20 rounded-full overflow-hidden bg-[#0b1220]">
          <img
            src={me?.avatarUrl ?? '/uploads/avatars/default.png'}
            alt={me?.displayname || me?.username}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-[18px] font-bold text-[#f7f9f9]">
                {me?.displayname ?? 'Unknown'}
              </h2>
              <div className="text-[15px] text-[#8b98a5]">
                {me?.username ? `@${me.username}` : ''}
              </div>
            </div>
            <div className="ml-auto flex gap-2">
              <button className="bg-[var(--color-1)] hover:bg-[var(--color-1)]/90 text-[#f7f9f9] rounded-full py-2 px-4 transition-colors">
                Edit profile
              </button>
              <button
                onClick={async () => {
                  try {
                    await logout();
                  } catch (e) {
                    console.error('Logout failed', e);
                  }
                }}
                className="bg-transparent border border-[#39444d] text-[#f7f9f9] rounded-full py-2 px-4 transition-colors"
              >
                Logout
              </button>
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

export default ProfilePage;
