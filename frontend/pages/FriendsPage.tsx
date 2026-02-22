import { FriendsCard } from '@/components/ui/FriendsCard';
import { FRIENDS } from '@/mock_data/mock';
import { Sparkles } from 'lucide-react';

export function FriendsPage() {
  return (
    <div className="border-b border-[#39444d]">
      <div className="sticky top-0 backdrop-blur-xl bg-[#0f172a]/80 border-b border-[#39444d] z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="font-bold text-[20px] text-[#f7f9f9]">Home</h1>
          <button className="p-2 hover:bg-[#1e293b] rounded-full transition-colors">
            <Sparkles className="size-5" style={{ color: 'var(--color-1)' }} />
          </button>
        </div>
        <div className="flex border-b border-[#39444d]">
          <button
            className="flex-1 py-4 font-medium text-[15px] text-[#f7f9f9] border-b-4 transition-colors hover:bg-[#1e293b]"
            style={{ borderColor: 'var(--color-1)' }}
          >
            Your Friends
          </button>
          <button className="flex-1 py-4 font-medium text-[15px] text-[#8b98a5] hover:bg-[#1e293b] transition-colors">
            Following Requests
          </button>
        </div>
      </div>
      <div className="p-4 space-y-6">
        {[
          {
            title: 'Online',
            status: 'online' as const,
            items: FRIENDS.online,
          },
          {
            title: 'Offline',
            status: 'offline' as const,
            items: FRIENDS.offline,
          },
        ].map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-[#39444d] bg-[#0f172a]/40 p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`size-2 rounded-full ${
                    section.status === 'online' ? 'bg-emerald-400' : 'bg-[#8b98a5]'
                  }`}
                />
                <h2 className="text-[15px] font-semibold text-[#f7f9f9]">{section.title}</h2>
              </div>
              <span className="text-[13px] text-[#8b98a5]">{section.items.length}</span>
            </div>
            <div className="space-y-3">
              {section.items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#39444d] px-4 py-6 text-center text-[13px] text-[#8b98a5]">
                  No {section.title.toLowerCase()} friends right now.
                </div>
              ) : (
                section.items.map((friend) => (
                  <FriendsCard
                    key={friend.id}
                    friends={{
                      online: section.status === 'online' ? [friend] : [],
                      offline: section.status === 'offline' ? [friend] : [],
                    }}
                  />
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
