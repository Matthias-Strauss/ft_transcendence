export interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Post {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  image?: string;
  gameTag?: string;
}

export interface GameLobby {
  id: string;
  game: string;
  host: string;
  players: number;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Player {
  id: string;
  name: string;
  username: string;
  avatar: string;
  verified: boolean;
  level: number;
  wins: number;
  following: boolean;
}

export interface FriendRequest {
  id: string;
  name: string;
  username: string;
  avatar: string;
  mutualFriends: number;
}

export interface Friends {
  online: Player[];
  offline: Player[];
}

export const GAMES: Game[] = [
  { id: '1', name: 'Hangman', icon: '🪢', color: '#F59E0B' },
  { id: '2', name: 'Tic-Tac-Toe', icon: '❌', color: '#3B82F6' },
];

export const FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: '1',
    name: 'Alex Gamer',
    username: '@alexgamer',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&auto=format',
    mutualFriends: 5,
  },
  {
    id: '2',
    name: 'Sam Playz',
    username: '@samplayz',
    avatar:
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop&auto=format',
    mutualFriends: 2,
  },
];

export const FRIENDS: Friends = {
  online: [
    {
      id: '1',
      name: 'Gamer Gal',
      username: '@gamergal',
      avatar:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&auto=format',
      verified: true,
      level: 15,
      wins: 120,
      following: true,
    },
    {
      id: '2',
      name: 'PixelPro',
      username: '@pixelpro',
      avatar:
        'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop&auto=format',
      verified: false,
      level: 20,
      wins: 200,
      following: true,
    },
  ],
  offline: [
    {
      id: '3',
      name: 'ArcadeAce',
      username: '@arcadeace',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&auto=format',
      verified: true,
      level: 10,
      wins: 80,
      following: true,
    },
  ],
};

export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    author: {
      name: 'WordWizard',
      username: '@wordwizard',
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100',
      verified: true,
    },
    content: 'Clutched a HARD Hangman round with one life left 😮‍💨 Letters strategy matters!',
    timestamp: '1h',
    likes: 128,
    comments: 22,
    shares: 9,
    image:
      'https://images.unsplash.com/photo-1451195090173-2e0781d7c33e?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    gameTag: 'Hangman',
  },
  {
    id: '2',
    author: {
      name: 'GridMaster',
      username: '@gridmaster',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      verified: false,
    },
    content: 'Tic-Tac-Toe tip: always force the fork 😏 unbeatable if done right.',
    timestamp: '3h',
    likes: 94,
    comments: 31,
    shares: 6,
    image:
      'https://images.unsplash.com/photo-1668901382969-8c73e450a1f5?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    gameTag: 'Tic-Tac-Toe',
  },
  {
    id: '3',
    author: {
      name: 'Lena Plays',
      username: '@lenaplays',
      avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100',
      verified: true,
    },
    content: 'Gamescom was INSANE this year 🎮✨ Met so many devs and tried amazing indie games!',
    timestamp: '6h',
    likes: 542,
    comments: 88,
    shares: 41,
    image:
      'https://images.unsplash.com/photo-1535222636729-76586bf52493?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
];

export const MOCK_LOBBIES: GameLobby[] = [
  {
    id: '1',
    game: 'Hangman',
    host: 'WordWizard',
    players: 1,
    maxPlayers: 4,
    status: 'waiting',
    difficulty: 'hard',
  },
  {
    id: '2',
    game: 'Tic-Tac-Toe',
    host: 'GridMaster',
    players: 2,
    maxPlayers: 2,
    status: 'playing',
    difficulty: 'medium',
  },
  {
    id: '3',
    game: 'Hangman',
    host: 'LexiPlay',
    players: 2,
    maxPlayers: 4,
    status: 'finished',
    difficulty: 'easy',
  },
];
