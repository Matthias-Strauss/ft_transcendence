import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  apiFetch,
  logout,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  withdrawFriendRequest,
  removeFriend,
} from '../utils/api';
import EditProfileModal from '../components/ui/EditProfileModal';
import { runFriendAction } from '../utils/friendActions';
import { PostCard } from '../components/ui/PostCard';
import type { Post } from '../types/posts';
import ChatState from '../utils/chatState';
import '../styles/UserProfile.css';
import { AuthedImage } from '../components/ui/AuthedImage';
import { useUserStore } from '../utils/userStore';
import type { UserStore } from '../utils/userStore';
import showToast from '../utils/toast';

interface UserResponse {
  username?: string;
  displayname?: string | null;
  avatarUrl?: string | null;
  postsCount?: number;
  friendsCount?: number;
  isFriend?: boolean;
  friendStatus?: 'friend' | 'requested' | 'none';
  friendRequestIncoming?: boolean;
  friendRequestSentByMe?: boolean;
}

interface UserSearchResult {
  username: string;
  displayname?: string | null;
  avatarUrl?: string | null;
  postsCount?: number;
  friendsCount?: number;
}

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [me, setMe] = useState<UserResponse | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoadingMore, setPostsLoadingMore] = useState(false);
  const [postsHasMore, setPostsHasMore] = useState(false);
  const [postsNextCursor, setPostsNextCursor] = useState<string | null>(null);
  const POSTS_PAGE_SIZE = 10;
  const storeUser = useUserStore((s: UserStore) => s.user);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!username) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setPosts([]);
      setPostsNextCursor(null);
      setPostsHasMore(false);

      try {
        const res = await apiFetch(`/api/users/${username}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setUser(data);
        } else {
          if (!cancelled) setUser(null);
        }

        const postsRes = await apiFetch(`/api/users/${username}/posts?limit=${POSTS_PAGE_SIZE}`);
        if (postsRes.ok) {
          const payload = await postsRes.json();
          if (!cancelled) {
            setPosts(payload.items || []);
            setPostsHasMore(Boolean(payload.meta?.hasMore));
            setPostsNextCursor(payload.meta?.nextCursor ?? null);
          }
        } else {
          if (!cancelled) setPosts([]);
        }
      } catch (e) {
        console.error('Failed to load user profile', e);
        if (!cancelled) {
          setUser(null);
          setPosts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [username]);

  const loadMorePosts = async () => {
    if (!postsHasMore || postsLoadingMore || !postsNextCursor || !username) return;
    setPostsLoadingMore(true);
    try {
      const res = await apiFetch(
        `/api/users/${username}/posts?limit=${POSTS_PAGE_SIZE}&cursor=${encodeURIComponent(
          postsNextCursor,
        )}`,
      );
      if (!res.ok) throw new Error('Failed to load more posts');
      const payload = await res.json();
      setPosts((prev) => [...prev, ...(payload.items || [])]);
      setPostsHasMore(Boolean(payload.meta?.hasMore));
      setPostsNextCursor(payload.meta?.nextCursor ?? null);
    } catch (e) {
      console.error('Failed to load more posts', e);
    } finally {
      setPostsLoadingMore(false);
    }
  };

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await apiFetch('/api/me');
        if (res.ok) {
          const data = await res.json();
          setMe(data);
          useUserStore.getState().setUser(data);
        }
      } catch (e) {
        console.error('Failed to load current user', e);
      }
    }

    void loadMe();
  }, []);

  useEffect(() => {
    if (storeUser) setMe(storeUser as UserResponse);
  }, [storeUser]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const id = setTimeout(async () => {
      setSearchLoading(true);

      try {
        const res = await apiFetch(`/api/users?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const payload = await res.json();
          setSearchResults(payload.items || []);
        } else {
          setSearchResults([]);
        }
      } catch (e) {
        console.error('Search failed', e);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(id);
  }, [searchQuery]);

  const normalize = (s?: string | null) => (s ?? '').toString().replace(/^@/, '').toLowerCase();
  const isMine = normalize(me?.username) === normalize(username as string | undefined);

  useEffect(() => {
    if (!user?.username || !user?.avatarUrl) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.author?.username === user.username
          ? { ...p, author: { ...p.author, avatarUrl: user.avatarUrl } }
          : p,
      ),
    );
  }, [user?.avatarUrl, user?.username]);

  const handleSendFriendRequest = async () => {
    if (!user?.username) return;
    await runFriendAction(user.username, sendFriendRequest, setSendingRequest, (data) => {
      if (data?.user) setUser((prev) => ({ ...(prev ?? {}), ...data.user }));
    });
  };

  const handleAcceptFriendRequest = async () => {
    if (!user?.username) return;
    await runFriendAction(user.username, acceptFriendRequest, setSendingRequest, (data) => {
      if (data?.user) setUser((prev) => ({ ...(prev ?? {}), ...data.user }));
    });
  };

  const handleDeclineFriendRequest = async () => {
    if (!user?.username) return;
    await runFriendAction(user.username, declineFriendRequest, setSendingRequest, (data) => {
      if (data?.user) setUser((prev) => ({ ...(prev ?? {}), ...data.user }));
    });
  };

  const handleWithdrawFriendRequest = async () => {
    if (!user?.username) return;
    await runFriendAction(user.username, withdrawFriendRequest, setSendingRequest, (data) => {
      if (data?.user) setUser((prev) => ({ ...(prev ?? {}), ...data.user }));
    });
  };

  const handleRemoveFriend = async () => {
    if (!user?.username) return;
    await runFriendAction(user.username, removeFriend, setSendingRequest, (data) => {
      if (data?.user) setUser((prev) => ({ ...(prev ?? {}), ...data.user }));
    });
  };

  if (loading) {
    return <div className="p-8 text-[#8b98a5]">Loading profile...</div>;
  }

  if (!user) {
    return <div className="p-8 text-[#8b98a5]">User not found</div>;
  }

  return (
    <div>
      {editing && (
        <EditProfileModal
          user={user}
          onClose={() => setEditing(false)}
          onUpdated={(data) => {
            setUser((prev) => ({ ...(prev ?? {}), ...data }));
            setMe((prev) => ({ ...(prev ?? {}), ...data }));
            if (data?.avatarUrl && data.avatarUrl !== me?.avatarUrl) {
              showToast('Profile picture updated successfully!', 'success');
            }
            if (data?.avatarUrl) {
              setPosts((prev) =>
                prev.map((p) =>
                  p.author?.username === user?.username
                    ? { ...p, author: { ...p.author, avatarUrl: data.avatarUrl } }
                    : p,
                ),
              );
              showToast('Profile updated successfully!', 'success');
            }
            if (data?.username && data.username !== username) {
              setEditing(false);
              navigate(`/users/${data.username}`, { replace: true });
              return;
            }
          }}
        />
      )}
      <div className="user-profile-header">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-[20px] font-bold text-[#f7f9f9]">
            {user.displayname ?? user.username}
          </h1>

          <div className="user-search-wrap">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by nickname"
              className="w-full rounded-md border border-[#39444d] bg-[#071026] px-3 py-2 text-sm text-[#f7f9f9] outline-none"
            />

            {searchLoading && searchQuery.trim().length >= 2 && (
              <div className="user-search-status">Searching...</div>
            )}

            {!searchLoading && searchQuery.trim().length >= 2 && searchResults.length > 0 && (
              <div className="user-search-dropdown">
                {searchResults.map((r) => (
                  <button
                    key={r.username}
                    type="button"
                    className="user-search-item"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      navigate(`/users/${r.username}`);
                    }}
                  >
                    <div className="user-search-avatar">
                      <AuthedImage
                        src={r.avatarUrl ?? '/uploads/avatars/default.png'}
                        alt={r.displayname ?? r.username}
                      />
                    </div>

                    <div className="user-search-main">
                      <div className="user-search-name">{r.displayname ?? r.username}</div>
                      <div className="user-search-username">@{r.username}</div>
                    </div>

                    <div className="user-search-meta">{r.postsCount ?? 0} posts</div>

                    <div className="user-search-meta">{r.friendsCount ?? 0} friends</div>
                  </button>
                ))}
              </div>
            )}

            {!searchLoading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <div className="user-search-status">No users found</div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 border-b border-[#39444d] flex gap-6 items-center">
        <div className="size-20 rounded-full overflow-hidden bg-[#0b1220]">
          <AuthedImage
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
              {isMine ? (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-[var(--color-1)] hover:bg-[var(--color-1)]/90 text-[#f7f9f9] rounded-full py-2 px-4 transition-colors"
                  >
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
              ) : (
                <>
                  {user.username && (
                    <button
                      onClick={() => {
                        const targetUsername = user.username;
                        if (!targetUsername) return;
                        ChatState.setState({ targetUsername });
                        ChatState.setState({ panelOpen: true });
                      }}
                      className="bg-[var(--color-2)] hover:bg-[var(--color-2)]/90 text-[#f7f9f9] rounded-full py-2 px-4 transition-colors"
                    >
                      Message
                    </button>
                  )}

                  {!user.isFriend &&
                    user.friendStatus !== 'requested' &&
                    !user.friendRequestIncoming && (
                      <button
                        onClick={handleSendFriendRequest}
                        disabled={sendingRequest}
                        className="bg-[var(--color-1)] hover:bg-[var(--color-1)]/90 text-[#f7f9f9] rounded-full py-2 px-4 transition-colors"
                      >
                        {sendingRequest ? 'Sending...' : 'Add friend'}
                      </button>
                    )}

                  {user.friendStatus === 'requested' && user.friendRequestSentByMe && (
                    <button
                      onClick={handleWithdrawFriendRequest}
                      disabled={sendingRequest}
                      className="bg-transparent border border-[#39444d] text-[#f7f9f9] rounded-full py-2 px-4 transition-colors"
                    >
                      {sendingRequest ? 'Processing...' : 'cancel request'}
                    </button>
                  )}

                  {user.isFriend && (
                    <button
                      onClick={handleRemoveFriend}
                      disabled={sendingRequest}
                      className="bg-transparent border border-[#39444d] text-[#f7f9f9] rounded-full py-2 px-4 transition-colors"
                    >
                      {sendingRequest ? 'Processing...' : 'delete from friends'}
                    </button>
                  )}

                  {user.friendRequestIncoming && !user.isFriend && (
                    <>
                      <button
                        onClick={handleAcceptFriendRequest}
                        disabled={sendingRequest}
                        className="bg-[var(--color-1)] hover:bg-[var(--color-1)]/90 text-[#f7f9f9] rounded-full py-2 px-4 transition-colors"
                      >
                        {sendingRequest ? 'Processing...' : 'Accept'}
                      </button>
                      <button
                        onClick={handleDeclineFriendRequest}
                        disabled={sendingRequest}
                        className="bg-transparent border border-[#39444d] text-[#f7f9f9] rounded-full py-2 px-4 transition-colors"
                      >
                        {sendingRequest ? 'Processing...' : 'Decline'}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-3 text-[#8b98a5]">
            {user.postsCount ?? posts.length} posts • {user.friendsCount ?? 0} friends
          </div>
        </div>
      </div>

      <div>
        {posts.length === 0 ? (
          <div className="p-8 text-[#8b98a5]">No posts yet</div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                post={post}
                key={post.id}
                onDeleted={(id) => {
                  setPosts((prev) => prev.filter((p) => p.id !== id));
                  setUser((prev) =>
                    prev
                      ? { ...(prev as any), postsCount: Math.max(0, (prev.postsCount ?? 0) - 1) }
                      : prev,
                  );
                }}
              />
            ))}

            {postsHasMore && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={loadMorePosts}
                  disabled={postsLoadingMore}
                  className="bg-[var(--color-1)] hover:bg-[var(--color-1)]/90 text-[#f7f9f9] rounded-full py-2 px-4 transition-colors disabled:opacity-40"
                >
                  {postsLoadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
