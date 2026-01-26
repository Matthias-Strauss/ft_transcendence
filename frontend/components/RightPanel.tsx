import { ChatPanel } from './ChatPanel';
import { GamePanel } from './GamePanel';

export function RightPanel() {
  return (
    <div className="h-screen fixed right-0 top-0 w-[520px] bg-[#0f172a] border-l border-[#39444d] overflow-hidden">
      <div className="flex flex-col h-full p-4 gap-4">
        <div className="flex-none h-[35%] min-h-[280px] overflow-auto">
          <ChatPanel />
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          <GamePanel />
        </div>
      </div>
    </div>
  );
}
