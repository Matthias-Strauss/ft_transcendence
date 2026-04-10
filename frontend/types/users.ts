export interface FriendUser {
  id: string;
  username: string;
  displayname?: string | null;
  avatarUrl?: string | null;
  isOnline?: boolean;
  isFriend?: boolean;
  friendStatus?: 'friend' | 'requested' | 'none';
  friendRequestIncoming?: boolean;
  friendRequestSentByMe?: boolean;
}

export interface MeResponse {
  id?: string;
  username?: string;
  displayname?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  postsCount?: number;
  friendsCount?: number;
}
