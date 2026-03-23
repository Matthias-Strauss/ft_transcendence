import { DropdownItem } from '../../mock_data/mock';

interface DropdownProps {
  items: DropdownItem[];
}

export default function Dropdown({
  items,
  isOpen,
  setIsOpen,
}: DropdownProps & { isOpen: boolean; setIsOpen: (v: boolean) => void }) {
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
