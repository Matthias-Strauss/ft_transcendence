import { useEffect, useState } from 'react';
import { FriendsCard } from '../components/ui/FriendsCard';
import { User } from '../components/ui/User';
import type { FriendUser } from '../types/users';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  apiFetch,
  acceptFriendRequest,
  declineFriendRequest,
  withdrawFriendRequest,
} from '../utils/api';
import { runFriendAction } from '../utils/friendActions';

export function FriendsPage() {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

  return (
    <div className="border-b border-[#39444d]">
      <div className="sticky top-0 backdrop-blur-xl bg-[#0f172a]/80 border-b border-[#39444d] z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="font-bold text-[20px] text-[#f7f9f9]">Friends</h1>
          <button className="p-2 hover:bg-[#1e293b] rounded-full transition-colors">
            <Sparkles className="size-5" style={{ color: 'var(--color-1)' }} />
          </button>
        </div>
        <div className="flex border-b border-[#39444d]">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-4 font-medium text-[15px] transition-colors hover:bg-[#1e293b] ${
              activeTab === 'friends' ? 'text-[#f7f9f9] border-b-4' : 'text-[#8b98a5]'
            }`}
            style={activeTab === 'friends' ? { borderColor: 'var(--color-1)' } : {}}
          >
            Your Friends
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-4 font-medium text-[15px] transition-colors hover:bg-[#1e293b] ${
              activeTab === 'requests' ? 'text-[#f7f9f9] border-b-4' : 'text-[#8b98a5]'
            }`}
            style={activeTab === 'requests' ? { borderColor: 'var(--color-1)' } : {}}
          >
            Following Requests
          </button>
        </div>
      </div>
      {activeTab === 'friends' ? <FriendsList /> : <RequestsList />}
    </div>
  );
}

function FriendsList() {
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await apiFetch('/api/me/friends');
        if (res.ok) {
          const data = await res.json();
          if (mounted) setFriends(data.items || []);
        } else {
          if (mounted) setFriends([]);
        }
      } catch (e) {
        console.error('Failed to load friends', e);
        if (mounted) setFriends([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="p-4 space-y-6">
      <section className="rounded-2xl border border-[#39444d] bg-[#0f172a]/40 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`size-2 rounded-full bg-[#8b98a5]`} />
            <h2 className="text-[15px] font-semibold text-[#f7f9f9]">Your Friends</h2>
          </div>
          <span className="text-[13px] text-[#8b98a5]">{friends.length}</span>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="p-4 text-[#8b98a5]">Loading friends...</div>
          ) : friends.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#39444d] px-4 py-6 text-center text-[13px] text-[#8b98a5]">
              No friends yet.
            </div>
          ) : (
            <FriendsCard
              key="friends-list"
              friends={{
                online: [],
                offline: friends,
              }}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function RequestsList() {
  const [requests, setRequests] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const res = await apiFetch('/api/me/friends/requests');
        if (res.ok) {
          const data = await res.json();
          if (mounted) setRequests(data.items || []);
        } else {
          if (mounted) setRequests([]);
        }
      } catch (e) {
        console.error('Failed to load requests', e);
        if (mounted) setRequests([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const setProcessingFlag = (username: string, value: boolean) =>
    setProcessing((prev) => ({ ...prev, [username]: value }));

  const handleAccept = async (username: string) => {
    await runFriendAction(
      username,
      acceptFriendRequest,
      (v) => setProcessingFlag(username, v),
      () => setRequests((prev) => prev.filter((r) => r.username !== username)),
    );
  };

  const handleDecline = async (username: string) => {
    await runFriendAction(
      username,
      declineFriendRequest,
      (v) => setProcessingFlag(username, v),
      () => setRequests((prev) => prev.filter((r) => r.username !== username)),
    );
  };

  const handleWithdraw = async (username: string) => {
    await runFriendAction(
      username,
      withdrawFriendRequest,
      (v) => setProcessingFlag(username, v),
      () => setRequests((prev) => prev.filter((r) => r.username !== username)),
    );
  };

  const incoming = requests.filter((r) => Boolean(r.friendRequestIncoming));
  const outgoing = requests.filter((r) => Boolean(r.friendRequestSentByMe));

  return (
    <div className="p-4 space-y-6">
      <section className="rounded-2xl border border-[#39444d] bg-[#0f172a]/40 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`size-2 rounded-full bg-[#8b98a5]`} />
            <h2 className="text-[15px] font-semibold text-[#f7f9f9]">Incoming Requests</h2>
          </div>
          <span className="text-[13px] text-[#8b98a5]">{incoming.length}</span>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="p-4 text-[#8b98a5]">Loading requests...</div>
          ) : incoming.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#39444d] px-4 py-6 text-center text-[13px] text-[#8b98a5]">
              No incoming requests.
            </div>
          ) : (
            incoming.map((req) => (
              <div
                key={req.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-[#39444d] bg-[#0f172a]/40 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <User
                    avatar={req.avatarUrl ?? '/uploads/avatars/default.png'}
                    name={req.displayname ?? req.username}
                    username={req.username}
                  />
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => void handleAccept(req.username)}
                      disabled={Boolean(processing[req.username])}
                      className="bg-[var(--color-1)] hover:bg-[var(--color-1)]/90 text-[#f7f9f9] rounded-full py-2 px-4 transition-colors"
                    >
                      {processing[req.username] ? 'Processing...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => void handleDecline(req.username)}
                      disabled={Boolean(processing[req.username])}
                      className="bg-transparent border border-[#39444d] text-[#f7f9f9] rounded-full py-2 px-4 transition-colors"
                    >
                      {processing[req.username] ? 'Processing...' : 'Decline'}
                    </button>
                  </div>
                  <Link
                    to={`/users/${req.username}`}
                    className="text-[13px] text-[#8b98a5] hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[#39444d] bg-[#0f172a]/40 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`size-2 rounded-full bg-[#8b98a5]`} />
            <h2 className="text-[15px] font-semibold text-[#f7f9f9]">Outgoing Requests</h2>
          </div>
          <span className="text-[13px] text-[#8b98a5]">{outgoing.length}</span>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="p-4 text-[#8b98a5]">Loading requests...</div>
          ) : outgoing.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#39444d] px-4 py-6 text-center text-[13px] text-[#8b98a5]">
              No outgoing requests.
            </div>
          ) : (
            outgoing.map((req) => (
              <div
                key={req.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-[#39444d] bg-[#0f172a]/40 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <User
                    avatar={req.avatarUrl ?? '/uploads/avatars/default.png'}
                    name={req.displayname ?? req.username}
                    username={req.username}
                  />
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => void handleWithdraw(req.username)}
                      disabled={Boolean(processing[req.username])}
                      className="bg-transparent border border-[#39444d] text-[#f7f9f9] rounded-full py-2 px-4 transition-colors"
                    >
                      {processing[req.username] ? 'Processing...' : 'Cancel request'}
                    </button>
                  </div>
                  <Link
                    to={`/users/${req.username}`}
                    className="text-[13px] text-[#8b98a5] hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
