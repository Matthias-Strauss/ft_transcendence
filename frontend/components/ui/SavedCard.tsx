import type { Post } from '../../types/posts';
import type { Bookmarked } from '../../types/saved';
import { AuthedImage } from './AuthedImage';

interface SavedCardProps {
  post: Post;
}

export function SavedCard({ post }: SavedCardProps) {
  const bookmarked: Bookmarked = {
    id: post.id,
    bookmarkedByMe: post.bookmarkedByMe ?? true,
    content: post.content,
    imageUrl: post.imageUrl ?? null,
  };

  if (!bookmarked.bookmarkedByMe) {
    return null;
  }

  return (
    <article className="border-b border-[#39444d] p-4 hover:bg-[#1e293b]/30 transition-colors">
      <p className="text-[15px] text-[#f7f9f9] leading-5 whitespace-pre-wrap mb-3">
        {bookmarked.content}
      </p>

      {bookmarked.imageUrl && (
        <div className="rounded-2xl overflow-hidden border border-[#39444d]">
          <AuthedImage src={bookmarked.imageUrl} alt="Saved post image" className="w-full h-auto" />
        </div>
      )}
    </article>
  );
}
