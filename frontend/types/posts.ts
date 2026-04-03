import type { ReactNode } from 'react';

export interface Author {
  id: string;
  username: string;
  displayname?: string;
  avatarUrl?: string | null;
  isFriend?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  likeCount: number;
  likedByMe?: boolean;
  canDelete?: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    username: string;
    displayname?: string;
    avatarUrl?: string | null;
  };
}

export interface CommentsResponse {
  items: Comment[];
  meta: {
    total: number;
    order: string;
  };
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  imageUrl?: string | null;
  gameTag?: string | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
  likedByMe?: boolean;
  sharedByMe?: boolean;
  bookmarkedByMe?: boolean;
  author: Author;
  comments?: CommentsResponse;
}

export interface DropdownItem {
  id: number;
  text: string;
  icon: ReactNode;
}
