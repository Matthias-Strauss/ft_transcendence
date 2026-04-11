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

import { LocalPongSim } from '../game/localPongSim';
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

type PongWelcome = { username: string; socketId: string };

export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState({ p1: 0, p2: 0 });

  useEffect(() => {
    const onConnect = () => {
      console.log('[pong] socket connected:', socket.id);
      socket.emit('pong:hello');
    };
    const onDisconnect = (reason: string) => {
      console.log('[pong] socket disconnected:', reason);
    };
    const onWelcome = (payload: PongWelcome) => {
      console.log('[pong] welcome:', payload);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('pong:welcome', onWelcome);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('pong:welcome', onWelcome);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);

    // Camera: angled view
    const camera = new FreeCamera('camera1', new Vector3(0, 30, 70), scene);
    camera.setTarget(new Vector3(0, 0, 0));

    const light = new HemisphericLight('light', new Vector3(3, 4, 6), scene);

    // --- Arena ---

    // Floor
    const floor = MeshBuilder.CreateGround(
      'floor',
      { width: ARENA_WIDTH, height: ARENA_DEPTH },
      scene,
    );
    const floorMat = new StandardMaterial('floorMat', scene);
    floorMat.diffuseColor = Color3.FromHexString('#0f172a');
    floor.material = floorMat;

    // Wall color

    const wallColor = Color4.FromHexString('#6a00ffff');
    const wallColors = [wallColor, wallColor, wallColor, wallColor, wallColor, wallColor];

    // Left wall
    const leftWall = MeshBuilder.CreateBox(
      'leftWall',
      { width: 0.5, height: 1, depth: ARENA_DEPTH, faceColors: wallColors },
      scene,
    );
    leftWall.position.x = -ARENA_WIDTH / 2;
    leftWall.position.y = 0.5;

    // Right wall
    const rightWall = MeshBuilder.CreateBox(
      'rightWall',
      { width: 0.5, height: 1, depth: ARENA_DEPTH, faceColors: wallColors },
      scene,
    );
    rightWall.position.x = ARENA_WIDTH / 2;
    rightWall.position.y = 0.5;

    // Center line
    const lineColor = Color4.FromHexString('#334155ff');
    const lineColors = [lineColor, lineColor, lineColor, lineColor, lineColor, lineColor];
    const centerLine = MeshBuilder.CreateBox(
      'centerLine',
      { width: ARENA_WIDTH, height: 0.05, depth: 0.1, faceColors: lineColors },
      scene,
    );
    centerLine.position.y = 0.1;

    // -- Paddles --

    // Paddle 1
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

    // Paddle 2
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

    // --- Ball ---
    const ball = MeshBuilder.CreateSphere('ball', { diameter: BALL_DIAMETER }, scene);
    ball.position.y = 0.75;

    const ballMat = new StandardMaterial('ballMat', scene);
    ballMat.diffuseColor = Color3.FromHexString('#f7f9f9');
    ballMat.emissiveColor = Color3.FromHexString('#f7f9f9').scale(0.4);
    ball.material = ballMat;

    // --- Simulation ---
    const sim = new LocalPongSim();
    let lastScoreP1 = 0;
    let lastScoreP2 = 0;

    // --- Keyboard input ---
    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    scene.registerBeforeRender(() => {
      sim.setInput('p1', { left: !!keys['arrowleft'], right: !!keys['arrowright'] });
      sim.setInput('p2', { left: !!keys['a'], right: !!keys['d'] });

      sim.step();

      const snap = sim.snapshot();
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
        }}
      >
        <span style={{ color: '#95ff00' }}>{score.p1}</span>
        {' - '}
        <span style={{ color: '#ff0095' }}>{score.p2}</span>
      </div>
    </div>
  );
}
