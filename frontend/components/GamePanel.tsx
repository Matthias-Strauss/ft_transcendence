import { useState } from 'react';
import { Play, Users, Zap, Trophy } from 'lucide-react';

interface GameSession {
  id: string;
  name: string;
  image: string;
  players: number;
  maxPlayers: number;
  difficulty: string;
}

export const ACTIVE_GAMES: GameSession[] = [
  {
    id: '1',
    name: 'Hangman',
    image: 'https://cdn.pixabay.com/photo/2019/12/21/13/20/game-4710444_960_720.jpg',
    players: 3,
    maxPlayers: 4,
    difficulty: 'Hard',
  },
  {
    id: '2',
    name: 'Tic tac toe',
    image: 'https://cdn.pixabay.com/photo/2017/01/03/16/54/klee-1949981_960_720.jpg',
    players: 1,
    maxPlayers: 2,
    difficulty: 'Medium',
  },
];

export function GamePanel() {
  const [selectedGame, setSelectedGame] = useState<GameSession | null>(ACTIVE_GAMES[0]);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-[#1e293b] rounded-2xl border border-[#39444d] p-4">
        <h3 className="font-bold text-[17px] text-[#f7f9f9] mb-3">Quick Play</h3>
        <div className="space-y-2">
          {ACTIVE_GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                selectedGame?.id === game.id
                  ? 'bg-[var(--color-1)]/20 border-2 border-[var(--color-1)]'
                  : 'bg-[#334155] hover:bg-[#475569] border-2 border-transparent'
              }`}
            >
              <div className="size-12 rounded-lg overflow-hidden shrink-0">
                <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-[14px] text-[#f7f9f9]">{game.name}</p>
                <div className="flex items-center gap-2 text-[12px] text-[#8b98a5]">
                  <Users className="size-3" />
                  <span>
                    {game.players}/{game.maxPlayers}
                  </span>
                  <span>·</span>
                  <span>{game.difficulty}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedGame && (
        <div className="flex-1 bg-[#1e293b] rounded-2xl border border-[#39444d] overflow-y-auto flex flex-col">
          {isPlaying ? (
            <>
              <div className="relative flex-1 bg-gradient-to-br from-[var(--color-1)]/20 via-[var(--color-2)]/20 to-[var(--color-3)]/20">
                <img
                  src={selectedGame.image}
                  alt={selectedGame.name}
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="size-24 mx-auto mb-4 rounded-full bg-[var(--color-1)]/80 flex items-center justify-center backdrop-blur-sm">
                      <Zap className="size-12 text-[#f7f9f9]" />
                    </div>
                    <h3 className="font-bold text-[24px] text-[#f7f9f9] mb-2">Game In Progress</h3>
                    <p className="text-[15px] text-[#8b98a5]">Playing {selectedGame.name}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-[#39444d]">
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <Trophy className="size-5 mx-auto mb-1" style={{ color: 'var(--color-3)' }} />
                    <p className="text-[20px] font-bold text-[#f7f9f9]">245</p>
                    <p className="text-[11px] text-[#8b98a5]">Score</p>
                  </div>
                  <div className="text-center">
                    <Zap className="size-5 mx-auto mb-1" style={{ color: 'var(--color-2)' }} />
                    <p className="text-[20px] font-bold text-[#f7f9f9]">12</p>
                    <p className="text-[11px] text-[#8b98a5]">Combo</p>
                  </div>
                  <div className="text-center">
                    <Users className="size-5 mx-auto mb-1" style={{ color: 'var(--color-4)' }} />
                    <p className="text-[20px] font-bold text-[#f7f9f9]">
                      {selectedGame.players}/{selectedGame.maxPlayers}
                    </p>
                    <p className="text-[11px] text-[#8b98a5]">Players</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPlaying(false)}
                  className="w-full py-3 rounded-full font-bold text-[15px] bg-[var(--color-2)] hover:bg-[var(--color-2)]/80 text-[#f7f9f9] transition-colors"
                >
                  Leave Game
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="relative h-64 bg-gradient-to-br from-[var(--color-1)]/30 to-[var(--color-2)]/30">
                <img
                  src={selectedGame.image}
                  alt={selectedGame.name}
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="font-bold text-[28px] text-[#f7f9f9] mb-2">
                      {selectedGame.name}
                    </h3>
                    <p className="text-[15px] text-[#f7f9f9]/80">
                      {selectedGame.difficulty} Difficulty
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-[13px] text-[#8b98a5] mb-2">Players in Lobby</p>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: selectedGame.players }).map((_, i) => (
                        <div
                          key={i}
                          className="size-10 rounded-full bg-gradient-to-br from-[var(--color-1)] to-[var(--color-2)] flex items-center justify-center"
                        >
                          <span className="text-[14px] font-bold text-[#f7f9f9]">P{i + 1}</span>
                        </div>
                      ))}
                      {Array.from({ length: selectedGame.maxPlayers - selectedGame.players }).map(
                        (_, i) => (
                          <div
                            key={`empty-${i}`}
                            className="size-10 rounded-full border-2 border-dashed border-[#39444d] flex items-center justify-center"
                          >
                            <Users className="size-5 text-[#8b98a5]" />
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#8b98a5]">Difficulty</span>
                      <span className="text-[#f7f9f9] font-medium">{selectedGame.difficulty}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#8b98a5]">Mode</span>
                      <span className="text-[#f7f9f9] font-medium">Team Match</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#8b98a5]">Duration</span>
                      <span className="text-[#f7f9f9] font-medium">15 minutes</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-[#39444d]">
                <button
                  onClick={() => setIsPlaying(true)}
                  className="w-full py-3 rounded-full font-bold text-[17px] transition-all flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-1), var(--color-2))',
                    color: '#f7f9f9',
                  }}
                >
                  <Play className="size-5 fill-current" />
                  Start Game
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
