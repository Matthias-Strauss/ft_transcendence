import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch, logout } from '../utils/api';
import { PostCard } from '../components/ui/PostCard';
import { Post } from '../mock_data/mock';

interface UserResponse {
  username?: string;
  displayname?: string;
  avatarUrl?: string | null;
}

interface UserSearchResult {
  username: string;
  displayname?: string;
  avatarUrl?: string | null;
}


export default function UserProfile() {
  const { username } = useParams();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [me, setMe] = useState<UserResponse | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

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

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await apiFetch('/api/me');
        if (res.ok) {
          const data = await res.json();
          setMe(data);
        }
      } catch (e) {
        console.error('Failed to load current user', e);
      }
    }

    void loadMe();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const id = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await apiFetch(`/api/users?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const payload = await res.json();
          setSearchResults(payload.items || []);
        }
      } catch (e) {
        console.error('Search failed', e);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(id);
  }, [searchQuery]);
  const normalize = (s?: string | null) => (s ?? '').toString().replace(/^@/, '').toLowerCase();
  const isMine = normalize(me?.username) === normalize(username as string | undefined);
  if (loading) return <div className="p-8 text-[#8b98a5]">Loading profile...</div>;

  if (!user) return <div className="p-8 text-[#8b98a5]">User not found</div>;

  return (
    <div>
      <div className="sticky top-0 backdrop-blur-xl bg-[#0f172a]/80 border-b border-[#39444d] z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="font-bold text-[20px] text-[#f7f9f9]">
            {user.displayname ?? user.username}
          </h1>
          <div className="ml-4 w-60 relative">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by nickname"
              className="w-full rounded-md bg-[#071026] border border-[#39444d] py-2 px-3 text-sm text-[#f7f9f9]"
            />
            {searchLoading && <div className="text-xs text-[#8b98a5] mt-1">Searching...</div>}
            {searchResults.length > 0 && (
              <div className="absolute mt-2 bg-[#071026] border border-[#39444d] w-60 max-h-60 overflow-auto rounded">
                {searchResults.map((r) => (
                  <div
                    key={r.username}
                    className="p-2 hover:bg-[#0e1b2b] cursor-pointer flex items-center gap-2"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      navigate(`/users/${r.username}`);
                    }}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#0b1220]">
                      <img
                        src={r.avatarUrl ?? '/uploads/avatars/default.png'}
                        alt={r.displayname ?? r.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-sm text-[#f7f9f9]">{r.displayname ?? r.username}</div>
                      <div className="text-xs text-[#8b98a5]">@{r.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
            <div className="ml-auto flex gap-2">
              {isMine && (
                <>
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
                </>
              )}
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
