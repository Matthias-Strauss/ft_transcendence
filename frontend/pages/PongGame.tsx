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

export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState({ p1: 0, p2: 0 });

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
    const floor = MeshBuilder.CreateGround('floor', { width: 40, height: 80 }, scene);
    const floorMat = new StandardMaterial('floorMat', scene);
    floorMat.diffuseColor = Color3.FromHexString('#0f172a');
    floor.material = floorMat;

    // Wall color

    const wallColor = Color4.FromHexString('#6a00ffff');
    const wallColors = [wallColor, wallColor, wallColor, wallColor, wallColor, wallColor];

    // Left wall
    const leftWall = MeshBuilder.CreateBox(
      'leftWall',
      { width: 0.5, height: 1, depth: 80, faceColors: wallColors },
      scene,
    );
    leftWall.position.x = -20;
    leftWall.position.y = 0.5;

    // Right wall
    const rightWall = MeshBuilder.CreateBox(
      'rightWall',
      { width: 0.5, height: 1, depth: 80, faceColors: wallColors },
      scene,
    );
    rightWall.position.x = 20;
    rightWall.position.y = 0.5;

    // Center line
    const lineColor = Color4.FromHexString('#334155ff');
    const lineColors = [lineColor, lineColor, lineColor, lineColor, lineColor, lineColor];
    const centerLine = MeshBuilder.CreateBox(
      'centerLine',
      { width: 40, height: 0.05, depth: 0.1, faceColors: lineColors },
      scene,
    );
    centerLine.position.y = 0.1;

    // -- Paddles --

    // Paddle 1
    const p1Color = Color4.FromHexString('#95ff00ff');
    const p1Colors = [p1Color, p1Color, p1Color, p1Color, p1Color, p1Color];
    const paddle1 = MeshBuilder.CreateBox(
      'paddle1',
      { width: 6, height: 0.5, depth: 0.5, faceColors: p1Colors },
      scene,
    );
    paddle1.position.z = 36;
    paddle1.position.y = 0.25;

    // Paddle 2
    const p2Color = Color4.FromHexString('#ff0095ff');
    const p2Colors = [p2Color, p2Color, p2Color, p2Color, p2Color, p2Color];
    const paddle2 = MeshBuilder.CreateBox(
      'paddle2',
      { width: 6, height: 0.5, depth: 0.5, faceColors: p2Colors },
      scene,
    );
    paddle2.position.z = -36;
    paddle2.position.y = 0.25;

    // --- Ball ---
    const ball = MeshBuilder.CreateSphere('ball', { diameter: 1.5 }, scene);
    ball.position.y = 0.75;

    const ballMat = new StandardMaterial('ballMat', scene);
    ballMat.diffuseColor = Color3.FromHexString('#f7f9f9');
    ball.material = ballMat;

    const ballVelocity = new Vector3(0.2, 0, 0.3);

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

    const paddleSpeed = 0.6;
    const paddleLimit = 16;

    scene.registerBeforeRender(() => {
      // P1: Arrow keys
      if (keys['arrowleft'] && paddle1.position.x > -paddleLimit) {
        paddle1.position.x -= paddleSpeed;
      }
      if (keys['arrowright'] && paddle1.position.x < paddleLimit) {
        paddle1.position.x += paddleSpeed;
      }

      // P2: A/D keys
      if (keys['a'] && paddle2.position.x > -paddleLimit) {
        paddle2.position.x -= paddleSpeed;
      }
      if (keys['d'] && paddle2.position.x < paddleLimit) {
        paddle2.position.x += paddleSpeed;
      }

      // Ball movement
      ball.position.addInPlace(ballVelocity);

      // Bounce off side walls
      if (ball.position.x <= -19.2 || ball.position.x >= 19.2) {
        ballVelocity.x *= -1;
      }

      // P1 collision
      if (ball.intersectsMesh(paddle1, false) && ballVelocity.z > 0) {
        ballVelocity.z *= -1.1;
        const offset = ball.position.x - paddle1.position.x;
        ballVelocity.x = offset * 0.1;
      }

      // P2 collision (far end, -z)
      if (ball.intersectsMesh(paddle2, false) && ballVelocity.z < 0) {
        ballVelocity.z *= -1.1;
        const offset = ball.position.x - paddle2.position.x;
        ballVelocity.x = offset * 0.1;
      }

      // P2 scores a point
      if (ball.position.z > 40) {
        setScore((s) => ({ ...s, p2: s.p2 + 1 }));
        ball.position = new Vector3(0, 0.75, 0);
        ballVelocity.x = 0.2 * (Math.random() > 0.5 ? 1 : -1);
        ballVelocity.z = -0.3;
      }

      // P1 scores a point
      if (ball.position.z < -40) {
        setScore((s) => ({ ...s, p1: s.p1 + 1 }));
        ball.position = new Vector3(0, 0.75, 0);
        ballVelocity.x = 0.2 * (Math.random() > 0.5 ? 1 : -1);
        ballVelocity.z = 0.3;
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
