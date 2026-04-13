import {
  Color3,
  Color4,
  Engine,
  FreeCamera,
  HemisphericLight,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { type CSSProperties, useEffect, useRef, useState } from 'react';

import type { PongInput, PongSnapshot } from '../game/localPongSim';
import {
  ARENA_DEPTH,
  ARENA_WIDTH,
  BALL_DIAMETER,
  PADDLE_DEPTH,
  PADDLE_P1_Z,
  PADDLE_P2_Z,
  PADDLE_WIDTH,
  WIN_SCORE,
} from '../game/pongConstants';
import { socket } from '../socket';

type Mode = 'idle' | 'waiting' | 'playing' | 'ended';
type Slot = 'p1' | 'p2';

type PongMatched = { matchId: string; youAre: Slot; opponent: string };
type PongEnded = {
  reason: 'left' | 'disconnect' | 'score';
  finalScore: { p1: number; p2: number };
};
type PongResumed = {
  matchId: string;
  youAre: Slot;
  opponent: string;
  score: { p1: number; p2: number };
};
type PongOpponentDisconnected = { graceMs: number };

export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapshotRef = useRef<PongSnapshot | null>(null);
  const [mode, setMode] = useState<Mode>('idle');
  const [connected, setConnected] = useState(socket.connected);
  const [opponent, setOpponent] = useState<string>('');
  const [youAre, setYouAre] = useState<Slot | null>(null);
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [endedReason, setEndedReason] = useState<PongEnded['reason'] | null>(null);
  const [opponentGoneUntil, setOpponentGoneUntil] = useState<number | null>(null);
  const [, forceTick] = useState(0);
  const modeRef = useRef<Mode>('idle');

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onWaiting = () => {
      setMode('waiting');
    };
    const onMatched = (payload: PongMatched) => {
      snapshotRef.current = null;
      setOpponent(payload.opponent);
      setYouAre(payload.youAre);
      setScore({ p1: 0, p2: 0 });
      setEndedReason(null);
      setMode('playing');
    };
    const onState = (snap: PongSnapshot) => {
      snapshotRef.current = snap;
    };
    const onEnded = (payload: PongEnded) => {
      setEndedReason(payload.reason);
      setScore(payload.finalScore);
      setOpponentGoneUntil(null);
      setMode('ended');
    };
    const onOpponentDisconnected = (payload: PongOpponentDisconnected) => {
      setOpponentGoneUntil(Date.now() + payload.graceMs);
    };
    const onOpponentReturned = () => {
      setOpponentGoneUntil(null);
    };
    const onResumed = (payload: PongResumed) => {
      setOpponent(payload.opponent);
      setYouAre(payload.youAre);
      setScore(payload.score);
      setEndedReason(null);
      setMode('playing');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('pong:waiting', onWaiting);
    socket.on('pong:matched', onMatched);
    socket.on('pong:state', onState);
    socket.on('pong:ended', onEnded);
    socket.on('pong:opponent_disconnected', onOpponentDisconnected);
    socket.on('pong:opponent_returned', onOpponentReturned);
    socket.on('pong:resumed', onResumed);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('pong:waiting', onWaiting);
      socket.off('pong:matched', onMatched);
      socket.off('pong:state', onState);
      socket.off('pong:ended', onEnded);
      socket.off('pong:opponent_disconnected', onOpponentDisconnected);
      socket.off('pong:opponent_returned', onOpponentReturned);
      socket.off('pong:resumed', onResumed);
      if (socket.connected) {
        socket.emit('pong:leave');
      }
    };
  }, []);

  useEffect(() => {
    if (opponentGoneUntil === null) return;
    const interval = setInterval(() => {
      if (Date.now() >= opponentGoneUntil) {
        setOpponentGoneUntil(null);
      } else {
        forceTick((n) => n + 1);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [opponentGoneUntil]);

  const findMatch = () => {
    if (!socket.connected) return;
    snapshotRef.current = null;
    setScore({ p1: 0, p2: 0 });
    setEndedReason(null);
    setMode('waiting');
    socket.emit('pong:join');
  };

  const leaveQueue = () => {
    socket.emit('pong:leave');
    setMode('idle');
  };

  const backToLobby = () => {
    setEndedReason(null);
    setMode('idle');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);

    const camera = new FreeCamera('camera1', new Vector3(0, 30, 70), scene);
    camera.setTarget(new Vector3(0, 0, 0));

    new HemisphericLight('light', new Vector3(3, 4, 6), scene);

    const floor = MeshBuilder.CreateGround(
      'floor',
      { width: ARENA_WIDTH, height: ARENA_DEPTH },
      scene,
    );
    const floorMat = new StandardMaterial('floorMat', scene);
    floorMat.diffuseColor = Color3.FromHexString('#0f172a');
    floor.material = floorMat;

    const wallColor = Color4.FromHexString('#6a00ffff');
    const wallColors = [wallColor, wallColor, wallColor, wallColor, wallColor, wallColor];

    const leftWall = MeshBuilder.CreateBox(
      'leftWall',
      { width: 0.5, height: 1, depth: ARENA_DEPTH, faceColors: wallColors },
      scene,
    );
    leftWall.position.x = -ARENA_WIDTH / 2;
    leftWall.position.y = 0.5;

    const rightWall = MeshBuilder.CreateBox(
      'rightWall',
      { width: 0.5, height: 1, depth: ARENA_DEPTH, faceColors: wallColors },
      scene,
    );
    rightWall.position.x = ARENA_WIDTH / 2;
    rightWall.position.y = 0.5;

    const lineColor = Color4.FromHexString('#334155ff');
    const lineColors = [lineColor, lineColor, lineColor, lineColor, lineColor, lineColor];
    const centerLine = MeshBuilder.CreateBox(
      'centerLine',
      { width: ARENA_WIDTH, height: 0.05, depth: 0.1, faceColors: lineColors },
      scene,
    );
    centerLine.position.y = 0.1;

    const paddle1 = MeshBuilder.CreateBox(
      'paddle1',
      { width: PADDLE_WIDTH, height: 0.5, depth: PADDLE_DEPTH },
      scene,
    );
    const p1Mat = new StandardMaterial('p1Mat', scene);
    p1Mat.diffuseColor = Color3.FromHexString('#95ff00');
    p1Mat.emissiveColor = Color3.FromHexString('#95ff00').scale(0.4);
    paddle1.material = p1Mat;
    paddle1.position.z = PADDLE_P1_Z;
    paddle1.position.y = 0.25;

    const paddle2 = MeshBuilder.CreateBox(
      'paddle2',
      { width: PADDLE_WIDTH, height: 0.5, depth: PADDLE_DEPTH },
      scene,
    );
    const p2Mat = new StandardMaterial('p2Mat', scene);
    p2Mat.diffuseColor = Color3.FromHexString('#ff0095');
    p2Mat.emissiveColor = Color3.FromHexString('#ff0095').scale(0.4);
    paddle2.material = p2Mat;
    paddle2.position.z = PADDLE_P2_Z;
    paddle2.position.y = 0.25;

    const ball = MeshBuilder.CreateSphere('ball', { diameter: BALL_DIAMETER }, scene);
    ball.position.y = 0.75;

    const ballMat = new StandardMaterial('ballMat', scene);
    ballMat.diffuseColor = Color3.FromHexString('#f7f9f9');
    ballMat.emissiveColor = Color3.FromHexString('#f7f9f9').scale(0.4);
    ball.material = ballMat;

    // --- Input: send pong:input on change only ---
    let lastInput: PongInput = { left: false, right: false };
    const keys = { left: false, right: false };
    const maybeSendInput = () => {
      if (modeRef.current !== 'playing') return;
      if (keys.left === lastInput.left && keys.right === lastInput.right) return;
      lastInput = { left: keys.left, right: keys.right };
      socket.emit('pong:input', lastInput);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft') keys.left = true;
      else if (k === 'arrowright') keys.right = true;
      else return;
      maybeSendInput();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft') keys.left = false;
      else if (k === 'arrowright') keys.right = false;
      else return;
      maybeSendInput();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let lastScoreP1 = 0;
    let lastScoreP2 = 0;

    scene.registerBeforeRender(() => {
      const snap = snapshotRef.current;
      if (!snap) return;

      paddle1.position.x = snap.p1.x;
      paddle2.position.x = snap.p2.x;
      ball.position.x = snap.ball.x;
      ball.position.z = snap.ball.z;

      if (snap.score.p1 !== lastScoreP1 || snap.score.p2 !== lastScoreP2) {
        lastScoreP1 = snap.score.p1;
        lastScoreP2 = snap.score.p2;
        setScore({ p1: snap.score.p1, p2: snap.score.p2 });
      }
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, []);

  const endedTitle = (() => {
    if (mode !== 'ended') return null;
    if (endedReason === 'disconnect') return 'Opponent disconnected';
    if (endedReason === 'left') return 'Opponent left';
    if (endedReason === 'score' && youAre) {
      const winner: Slot = score.p1 > score.p2 ? 'p1' : 'p2';
      return youAre === winner ? 'You won!' : 'You lost';
    }
    return 'Game over';
  })();

  const buttonStyle: CSSProperties = {
    fontFamily: 'monospace',
    fontSize: 16,
    padding: '10px 20px',
    borderRadius: 6,
    border: '1px solid #f7f9f9',
    background: 'transparent',
    color: '#f7f9f9',
    cursor: 'pointer',
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      {mode === 'playing' && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#f7f9f9',
            fontSize: 32,
            fontFamily: 'monospace',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          <div>
            <span style={{ color: '#95ff00' }}>{score.p1}</span>
            {' - '}
            <span style={{ color: '#ff0095' }}>{score.p2}</span>
          </div>
          {youAre && opponent && (
            <div style={{ fontSize: 14, marginTop: 6, opacity: 0.8 }}>
              you are {youAre} · vs {opponent}
            </div>
          )}
        </div>
      )}
      {mode === 'playing' && (!connected || opponentGoneUntil !== null) && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#f7f9f9',
            fontSize: 22,
            fontFamily: 'monospace',
            background: 'rgba(0,0,0,0.75)',
            padding: '20px 32px',
            borderRadius: 10,
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          {!connected ? (
            'Reconnecting…'
          ) : (
            <>
              <div>Opponent disconnected</div>
              <div style={{ fontSize: 16, marginTop: 8, opacity: 0.8 }}>
                Waiting {Math.max(0, Math.ceil(((opponentGoneUntil ?? 0) - Date.now()) / 1000))}s
              </div>
            </>
          )}
        </div>
      )}
      {mode !== 'playing' && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#f7f9f9',
            fontFamily: 'monospace',
            background: 'rgba(0,0,0,0.75)',
            padding: '28px 40px',
            borderRadius: 10,
            textAlign: 'center',
            minWidth: 280,
          }}
        >
          {mode === 'idle' && (
            <>
              <div style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 8 }}>PONG</div>
              <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 24 }}>
                First to {WIN_SCORE}
              </div>
              <button style={buttonStyle} onClick={findMatch} disabled={!connected}>
                {connected ? 'Find Match' : 'Connecting…'}
              </button>
            </>
          )}
          {mode === 'waiting' && (
            <>
              <div style={{ fontSize: 22, marginBottom: 24 }}>Waiting for opponent…</div>
              <button style={buttonStyle} onClick={leaveQueue}>
                Leave Queue
              </button>
            </>
          )}
          {mode === 'ended' && (
            <>
              <div style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 12 }}>
                {endedTitle}
              </div>
              <div style={{ fontSize: 20, marginBottom: 24 }}>
                Final:{' '}
                <span style={{ color: '#95ff00' }}>{score.p1}</span>
                {' : '}
                <span style={{ color: '#ff0095' }}>{score.p2}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button style={buttonStyle} onClick={findMatch} disabled={!connected}>
                  Play Again
                </button>
                <button style={buttonStyle} onClick={backToLobby}>
                  Back to Lobby
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
