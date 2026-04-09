import type { DropdownItem } from '../../types/posts';
import { apiFetch } from '../../utils/api';

interface DropdownProps {
  items: DropdownItem[];
  onActionSuccess?: (action: string) => void;
}

async function handleAction({
  action,
  postId,
  authorId,
}: {
  action: string;
  postId: string;
  authorId: string;
}): Promise<boolean> {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return false;
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

      return response.ok;
    }
    case 'Share': {
      const response = await apiFetch(`/api/posts/${postId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, authorId }),
      });

      return response.ok;
    }
    default:
      return false;
  }
}

export default function Dropdown({
  items,
  isOpen,
  setIsOpen,
  postId,
  authorId,
  onActionSuccess,
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
                  const success = await handleAction({ action: item.text, postId, authorId });

                  if (success) {
                    onActionSuccess?.(item.text);
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
