import { MoreHorizontal, BookmarkX } from 'lucide-react';
import { useState } from 'react';
import type { DropdownItem, Post } from '../../types/posts';
import type { Bookmarked } from '../../types/saved';
import { AuthedImage } from './AuthedImage';
import Dropdown from './Dropdown';

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

  const [isOpen, setIsOpen] = useState(false);

  const handleDropdownActionSuccess = (action: string) => {
    if (action === 'Remove') {
      //should refresh state
    }
  };

  if (!bookmarked.bookmarkedByMe) {
    return null;
  }

  const items: DropdownItem[] = [{ id: 0, text: 'Remove', icon: <BookmarkX className="size-4" /> }];

  return (
    <article className="border-b border-[#39444d] p-4 hover:bg-[#1e293b]/30 transition-colors">
      <div className="mb-2 flex justify-end">
        <div className="relative">
          <button
            className="p-1 hover:bg-[var(--color-1)]/10 rounded-full transition-colors"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <MoreHorizontal className="size-5 text-[#8b98a5]" />
          </button>
          {isOpen && (
            <Dropdown
              items={items}
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              postId={post.id}
              authorId={post.authorId}
              onActionSuccess={handleDropdownActionSuccess}
            />
          )}
        </div>
      </div>
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
