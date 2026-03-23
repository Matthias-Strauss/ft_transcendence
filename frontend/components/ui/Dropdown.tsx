import { DropdownItem } from '../../mock_data/mock';

interface DropdownProps {
  items: DropdownItem[];
}

async function handleAction({
  action,
  postId,
  authorId,
}: {
  action: string;
  postId: string;
  authorId: string;
}) {
  console.log(`Action: ${action}, Post ID: ${postId}`);
  switch (action) {
    case 'Save':
      const token = localStorage.getItem('accessToken');
      if (!token) return new Error(`Access token is not valid`);
      const res = await fetch(`/api/posts/${postId}/bookmark`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId, authorId }),
      });
      console.log(res);
  }
}

export default function Dropdown({
  items,
  isOpen,
  setIsOpen,
  postId,
  authorId,
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
          <ul className="absolute top-full right-0 mt-2 w-40 bg-white border border-[#39444d] shadow-lg">
            {items.map((item) => (
              <li
                className="flex items-center px-3 py-2 hover:bg-gray-100"
                key={item.id}
                onClick={() => {
                  setIsOpen(false);
                  void handleAction({ action: item.text, postId, authorId });
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
