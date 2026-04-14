import {
  Color3,
  Color4,
  Engine,
  FreeCamera,
  GlowLayer,
  HemisphericLight,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

import {
  ARENA_DEPTH,
  ARENA_WIDTH,
  BALL_DIAMETER,
  PADDLE_DEPTH,
  PADDLE_P1_Z,
  PADDLE_P2_Z,
  PADDLE_WIDTH,
  WIN_SCORE,
  type PongInput,
  type PongSnapshot,
} from '../game/pongConstants';
import { socket } from '../socket';
import { usePongDebugHud } from './PongDebugHud';

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

const RENDER_DELAY_MS = 33;
const SNAPSHOT_BUFFER_MAX = 8;

type TimedSnapshot = { t: number; snap: PongSnapshot };

export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapshotBufferRef = useRef<TimedSnapshot[]>([]);
  const cameraRef = useRef<FreeCamera | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const debugHud = usePongDebugHud(engineRef);
  const {
    element: debugHudElement,
    notifySnapshot,
    reset: resetDebugHud,
    toggle: toggleDebugHud,
  } = debugHud;
  const [mode, setMode] = useState<Mode>('idle');
  const [connected, setConnected] = useState(socket.connected);
  const [opponent, setOpponent] = useState<string>('');
  const [youAre, setYouAre] = useState<Slot | null>(null);
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [endedReason, setEndedReason] = useState<PongEnded['reason'] | null>(null);
  const [opponentGoneUntil, setOpponentGoneUntil] = useState<number | null>(null);
  const [opponentCountdownMs, setOpponentCountdownMs] = useState(0);
  const modeRef = useRef<Mode>('idle');
  const youAreRef = useRef<Slot | null>(null);
  const ignoreNextEndedRef = useRef(false);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    youAreRef.current = youAre;
  }, [youAre]);

  useEffect(() => {
    const emitLeaveIfActive = () => {
      if (!socket.connected) return;
      if (modeRef.current !== 'waiting' && modeRef.current !== 'playing') return;
      socket.emit('pong:leave');
    };

    const onConnect = () => {
      setConnected(true);
      socket.emit('pong:rejoin');
    };
    const onDisconnect = () => setConnected(false);
    const onWaiting = () => {
      ignoreNextEndedRef.current = false;
      setMode('waiting');
    };
    let lastSeenScoreP1 = 0;
    let lastSeenScoreP2 = 0;
    const onMatched = (payload: PongMatched) => {
      ignoreNextEndedRef.current = false;
      snapshotBufferRef.current = [];
      resetDebugHud();
      lastSeenScoreP1 = 0;
      lastSeenScoreP2 = 0;
      setOpponent(payload.opponent);
      setYouAre(payload.youAre);
      setScore({ p1: 0, p2: 0 });
      setEndedReason(null);
      setMode('playing');
    };
    const onState = (snap: PongSnapshot) => {
      const now = Date.now();
      const buf = snapshotBufferRef.current;
      buf.push({ t: now, snap });
      if (buf.length > SNAPSHOT_BUFFER_MAX) buf.shift();
      notifySnapshot(now);
      if (snap.score.p1 !== lastSeenScoreP1 || snap.score.p2 !== lastSeenScoreP2) {
        lastSeenScoreP1 = snap.score.p1;
        lastSeenScoreP2 = snap.score.p2;
        setScore({ p1: snap.score.p1, p2: snap.score.p2 });
      }
    };
    const onEnded = (payload: PongEnded) => {
      if (ignoreNextEndedRef.current) {
        ignoreNextEndedRef.current = false;
        return;
      }
      setEndedReason(payload.reason);
      setScore(payload.finalScore);
      setOpponentGoneUntil(null);
      setOpponentCountdownMs(0);
      setMode('ended');
    };
    const onOpponentDisconnected = (payload: PongOpponentDisconnected) => {
      setOpponentGoneUntil(Date.now() + payload.graceMs);
      setOpponentCountdownMs(payload.graceMs);
    };
    const onOpponentReturned = () => {
      setOpponentGoneUntil(null);
      setOpponentCountdownMs(0);
    };
    const onResumed = (payload: PongResumed) => {
      ignoreNextEndedRef.current = false;
      snapshotBufferRef.current = [];
      resetDebugHud();
      lastSeenScoreP1 = payload.score.p1;
      lastSeenScoreP2 = payload.score.p2;
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
    window.addEventListener('pagehide', emitLeaveIfActive);

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
      window.removeEventListener('pagehide', emitLeaveIfActive);
      emitLeaveIfActive();
    };
  }, [notifySnapshot, resetDebugHud]);

  useEffect(() => {
    if (opponentGoneUntil === null) return;
    const interval = setInterval(() => {
      const remainingMs = Math.max(0, opponentGoneUntil - Date.now());
      if (remainingMs === 0) {
        setOpponentGoneUntil(null);
        setOpponentCountdownMs(0);
      } else {
        setOpponentCountdownMs(remainingMs);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [opponentGoneUntil]);

  const findMatch = () => {
    if (!socket.connected) return;
    ignoreNextEndedRef.current = false;
    snapshotBufferRef.current = [];
    setScore({ p1: 0, p2: 0 });
    setEndedReason(null);
    setMode('waiting');
    socket.emit('pong:join');
  };

  const leaveGame = (suppressEndEvent: boolean) => {
    ignoreNextEndedRef.current = suppressEndEvent;
    socket.emit('pong:leave');
    snapshotBufferRef.current = [];
    setOpponent('');
    setYouAre(null);
    setScore({ p1: 0, p2: 0 });
    setEndedReason(null);
    setOpponentGoneUntil(null);
    setOpponentCountdownMs(0);
    setMode('idle');
  };

  const backToLobby = () => {
    setEndedReason(null);
    setMode('idle');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, false);
    engine.setHardwareScalingLevel(Math.max(1, window.devicePixelRatio));
    engineRef.current = engine;
    const scene = new Scene(engine);
    scene.skipPointerMovePicking = true;
    scene.blockMaterialDirtyMechanism = true;

    const camera = new FreeCamera('camera1', new Vector3(0, 30, 70), scene);
    camera.setTarget(new Vector3(0, 0, 0));
    cameraRef.current = camera;

    new HemisphericLight('light', new Vector3(3, 4, 6), scene);

    const gl = new GlowLayer('glow', scene);
    gl.intensity = 1.0;
    const floor = MeshBuilder.CreateGround(
      'floor',
      { width: ARENA_WIDTH, height: ARENA_DEPTH },
      scene,
    );
    const floorMat = new StandardMaterial('floorMat', scene);
    floorMat.diffuseColor = Color3.FromHexString('#0f172a');
    floor.material = floorMat;
    floor.freezeWorldMatrix();

    const wallColor = Color4.FromHexString('#6a00ffff');
    const wallColors = [wallColor, wallColor, wallColor, wallColor, wallColor, wallColor];

    const leftWall = MeshBuilder.CreateBox(
      'leftWall',
      { width: 0.5, height: 1, depth: ARENA_DEPTH, faceColors: wallColors },
      scene,
    );
    const wallMat = new StandardMaterial('wallMat', scene);
    wallMat.diffuseColor = Color3.FromHexString('#6a00ff');
    wallMat.emissiveColor = Color3.FromHexString('#6a00ff').scale(1.0);
    leftWall.material = wallMat;
    leftWall.position.x = -ARENA_WIDTH / 2;
    leftWall.position.y = 0.5;
    leftWall.freezeWorldMatrix();

    const rightWall = MeshBuilder.CreateBox(
      'rightWall',
      { width: 0.5, height: 1, depth: ARENA_DEPTH, faceColors: wallColors },
      scene,
    );
    rightWall.material = wallMat;
    rightWall.position.x = ARENA_WIDTH / 2;
    rightWall.position.y = 0.5;
    rightWall.freezeWorldMatrix();

    const lineColor = Color4.FromHexString('#334155ff');
    const lineColors = [lineColor, lineColor, lineColor, lineColor, lineColor, lineColor];
    const centerLine = MeshBuilder.CreateBox(
      'centerLine',
      { width: ARENA_WIDTH, height: 0.05, depth: 0.1, faceColors: lineColors },
      scene,
    );
    centerLine.position.y = 0.1;
    centerLine.freezeWorldMatrix();

    const paddle1 = MeshBuilder.CreateBox(
      'paddle1',
      { width: PADDLE_WIDTH, height: 0.5, depth: PADDLE_DEPTH },
      scene,
    );
    const p1Mat = new StandardMaterial('p1Mat', scene);
    p1Mat.diffuseColor = Color3.FromHexString('#95ff00');
    p1Mat.emissiveColor = Color3.FromHexString('#95ff00').scale(1.0);
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
    p2Mat.emissiveColor = Color3.FromHexString('#ff0095').scale(1.0);
    paddle2.material = p2Mat;
    paddle2.position.z = PADDLE_P2_Z;
    paddle2.position.y = 0.25;

    const ball = MeshBuilder.CreateSphere('ball', { diameter: BALL_DIAMETER }, scene);
    ball.position.y = 0.75;

    const ballMat = new StandardMaterial('ballMat', scene);
    ballMat.diffuseColor = Color3.FromHexString('#f7f9f9');
    ballMat.emissiveColor = Color3.FromHexString('#f7f9f9').scale(1.0);
    ball.material = ballMat;

    // --- Input: send pong:input on change only ---
    let lastInput: PongInput = { left: false, right: false };
    const keys = { left: false, right: false };
    const maybeSendInput = () => {
      if (modeRef.current !== 'playing') return;
      const invert = youAreRef.current === 'p2';
      const left = invert ? keys.right : keys.left;
      const right = invert ? keys.left : keys.right;
      if (left === lastInput.left && right === lastInput.right) return;
      lastInput = { left, right };
      socket.emit('pong:input', lastInput);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'h') {
        toggleDebugHud();
        return;
      }
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

    scene.freezeActiveMeshes();

    scene.registerBeforeRender(() => {
      const buf = snapshotBufferRef.current;
      if (buf.length === 0) return;

      const renderAt = Date.now() - RENDER_DELAY_MS;
      let prev = buf[0];
      let next = buf[buf.length - 1];
      for (let i = 0; i < buf.length - 1; i++) {
        if (buf[i].t <= renderAt && buf[i + 1].t >= renderAt) {
          prev = buf[i];
          next = buf[i + 1];
          break;
        }
      }

      let p1x: number;
      let p2x: number;
      let bx: number;
      let bz: number;
      if (prev === next || next.t <= prev.t) {
        p1x = next.snap.p1.x;
        p2x = next.snap.p2.x;
        bx = next.snap.ball.x;
        bz = next.snap.ball.z;
      } else {
        const alpha = Math.min(1, Math.max(0, (renderAt - prev.t) / (next.t - prev.t)));
        p1x = prev.snap.p1.x + (next.snap.p1.x - prev.snap.p1.x) * alpha;
        p2x = prev.snap.p2.x + (next.snap.p2.x - prev.snap.p2.x) * alpha;
        bx = prev.snap.ball.x + (next.snap.ball.x - prev.snap.ball.x) * alpha;
        bz = prev.snap.ball.z + (next.snap.ball.z - prev.snap.ball.z) * alpha;
      }

      paddle1.position.x = p1x;
      paddle2.position.x = p2x;
      ball.position.x = bx;
      ball.position.z = bz;
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
      cameraRef.current = null;
      engineRef.current = null;
      engine.dispose();
    };
  }, [toggleDebugHud]);

  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    const z = youAre === 'p2' ? -70 : 70;
    camera.position.set(0, 30, z);
    camera.setTarget(new Vector3(0, 0, 0));
  }, [youAre]);

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
    <div style={{ width: '100%', height: 'calc(100vh - 2rem)', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      {debugHudElement}
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
      {mode === 'playing' && (
        <button
          style={{
            ...buttonStyle,
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(0,0,0,0.55)',
            pointerEvents: 'auto',
          }}
          onClick={() => leaveGame(true)}
        >
          Leave Game
        </button>
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
                Waiting {Math.ceil(opponentCountdownMs / 1000)}s
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
              <button style={buttonStyle} onClick={() => leaveGame(false)}>
                Leave Queue
              </button>
            </>
          )}
          {mode === 'ended' && (
            <>
              <div style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 12 }}>{endedTitle}</div>
              <div style={{ fontSize: 20, marginBottom: 24 }}>
                Final: <span style={{ color: '#95ff00' }}>{score.p1}</span>
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
