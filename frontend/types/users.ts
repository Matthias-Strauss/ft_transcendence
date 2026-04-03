export interface FriendUser {
  id: string;
  username: string;
  displayname?: string;
  avatarUrl?: string | null;
  isFriend?: boolean;
  friendStatus?: 'friend' | 'requested' | 'none';
  friendRequestIncoming?: boolean;
  friendRequestSentByMe?: boolean;
}

export interface MeResponse {
  id?: string;
  username?: string;
  displayname?: string;
  email?: string | null;
  avatarUrl?: string | null;
  postsCount?: number;
  friendsCount?: number;
}
