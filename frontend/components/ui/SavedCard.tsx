import { apiFetch } from "../../utils/api";
import { Post } from "../../types/posts";
import { Bookmarked } from "../../types/saved";

interface SavedCardProps {
  post: Post;
  onSaved?: (id: string) => void;
}

export function SavedCard({post, onSaved}: SavedCardProps)
{
    
}