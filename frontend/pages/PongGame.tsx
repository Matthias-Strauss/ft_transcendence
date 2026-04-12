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
import { useEffect, useRef, useState } from 'react';

import type { PongInput, PongSnapshot } from '../game/localPongSim';
import {
  ARENA_DEPTH,
  ARENA_WIDTH,
  BALL_DIAMETER,
  PADDLE_DEPTH,
  PADDLE_P1_Z,
  PADDLE_P2_Z,
  PADDLE_WIDTH,
} from '../game/pongConstants';
import { socket } from '../socket';

type Mode = 'connecting' | 'waiting' | 'playing' | 'ended';
type Slot = 'p1' | 'p2';

type PongMatched = { matchId: string; youAre: Slot; opponent: string };
type PongEnded = { reason: 'left' | 'disconnect'; finalScore: { p1: number; p2: number } };

export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapshotRef = useRef<PongSnapshot | null>(null);
  const [mode, setMode] = useState<Mode>('connecting');
  const [opponent, setOpponent] = useState<string>('');
  const [youAre, setYouAre] = useState<Slot | null>(null);
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [endedReason, setEndedReason] = useState<PongEnded['reason'] | null>(null);

  useEffect(() => {
    const joinIfConnected = () => {
      if (socket.connected) {
        socket.emit('pong:join');
      }
    };

    const onConnect = () => {
      socket.emit('pong:join');
    };
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
      setMode('ended');
    };

    socket.on('connect', onConnect);
    socket.on('pong:waiting', onWaiting);
    socket.on('pong:matched', onMatched);
    socket.on('pong:state', onState);
    socket.on('pong:ended', onEnded);

    joinIfConnected();

    return () => {
      socket.off('connect', onConnect);
      socket.off('pong:waiting', onWaiting);
      socket.off('pong:matched', onMatched);
      socket.off('pong:state', onState);
      socket.off('pong:ended', onEnded);
      if (socket.connected) {
        socket.emit('pong:leave');
      }
    };
  }, []);

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

  const overlayText = (() => {
    if (mode === 'connecting') return 'Connecting…';
    if (mode === 'waiting') return 'Waiting for opponent…';
    if (mode === 'ended') {
      const reason = endedReason === 'disconnect' ? 'Opponent disconnected' : 'Opponent left';
      return `${reason} — final ${score.p1} : ${score.p2}`;
    }
    return null;
  })();

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
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
        {mode === 'playing' && youAre && opponent && (
          <div style={{ fontSize: 14, marginTop: 6, opacity: 0.8 }}>
            you are {youAre} · vs {opponent}
          </div>
        )}
      </div>
      {overlayText && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#f7f9f9',
            fontSize: 24,
            fontFamily: 'monospace',
            background: 'rgba(0,0,0,0.6)',
            padding: '16px 28px',
            borderRadius: 8,
            pointerEvents: 'none',
          }}
        >
          {overlayText}
        </div>
      )}
    </div>
  );
}
