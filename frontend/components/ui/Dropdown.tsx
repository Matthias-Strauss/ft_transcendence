import type { DropdownItem } from '../../types/posts';
import { apiFetch } from '../../utils/api';
import showToast from '../../utils/toast';

interface DropdownProps {
  items: DropdownItem[];
  onActionSuccess?: (
    action: string,
    data?: {
      shareCount?: number;
      incremented?: boolean;
      bookmarkCount?: number;
      bookmarkedByMe?: boolean;
    },
  ) => void;
  onRequestAction?: (action: string) => void;
}

async function handleAction({
  action,
  postId,
  authorId,
}: {
  action: string;
  postId: string;
  authorId: string;
}): Promise<{
  ok: boolean;
  data?: {
    shareCount?: number;
    incremented?: boolean;
    bookmarkCount?: number;
    bookmarkedByMe?: boolean;
  };
}> {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return { ok: false };
  }

  switch (action) {
    case 'Save': {
      const response = await apiFetch(`/api/posts/${postId}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, authorId }),
      });
      if (!response.ok) {
        return { ok: false };
      }

      const data = (await response.json()) as {
        bookmarkCount?: number;
        bookmarkedByMe?: boolean;
      };

      showToast('Post saved.', 'success');
      return { ok: true, data };
    }
    case 'Remove': {
      const response = await apiFetch(`/api/posts/${postId}/bookmark`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        return { ok: false };
      }

      const data = (await response.json()) as {
        bookmarkCount?: number;
        bookmarkedByMe?: boolean;
      };

      showToast('Post removed from saved.', 'success');

      return { ok: true, data };
    }
    case 'Share': {
      const response = await apiFetch(`/api/posts/${postId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, authorId }),
      });

      if (!response.ok) {
        return { ok: false };
      }

      const data = (await response.json()) as {
        shareCount?: number;
        incremented?: boolean;
      };

      return { ok: true, data };
    }
    case 'Block User': {
      const response = await apiFetch(`/api/chat/block/${authorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: authorId }),
      });

      if (response.ok) {
        showToast('User blocked', 'success');
      }

      return { ok: response.ok };
    }
    case 'Unblock User': {
      const response = await apiFetch(`/api/chat/block/${authorId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('User unblocked', 'success');
      }

      return { ok: response.ok };
    }
    default:
      return { ok: false };
  }
}

export default function Dropdown({
  items,
  isOpen,
  setIsOpen,
  postId,
  authorId,
  onActionSuccess,
  onRequestAction,
}: DropdownProps & {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  postId: string;
  authorId: string;
}) {
  return (
    <div className="relative border-[#39444d] p-1 cursor-pointer">
      <div className="flex">
        {isOpen && (
          <ul className="absolute top-full right-0 z-50 mt-2 w-40 rounded-md border border-[#39444d] bg-[#1b1f23] opacity-100 shadow-xl">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between px-3 py-2 bg-[#1b1f23] hover:bg-[#272d33]"
                onClick={async () => {
                  setIsOpen(false);

                  if (item.text === 'Delete') {
                    onRequestAction?.(item.text);
                    return;
                  }

                  const result = await handleAction({ action: item.text, postId, authorId });

                  if (result.ok) {
                    onActionSuccess?.(item.text, result.data);
                  }
                }}
              >
                {item.text}
                {item.icon}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
