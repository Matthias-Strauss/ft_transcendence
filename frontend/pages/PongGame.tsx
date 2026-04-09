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
import { useEffect, useRef } from 'react';

export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);

    // Camera: angled view
    const camera = new FreeCamera('camera1', new Vector3(0, 30, 40), scene);
    camera.setTarget(Vector3.Zero());

    const light = new HemisphericLight('light', new Vector3(3, 4, 6), scene);

    // --- Arena ---

    // Floor
    const floor = MeshBuilder.CreateGround('floor', { width: 40, height: 80 }, scene);
    const floorMat = new StandardMaterial('floorMat', scene);
    floorMat.diffuseColor = Color3.FromHexString('#0f172a');
    floor.material = floorMat;

    // Wall color
    // #6a00ff = primary purple
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
    // #334155 = muted gray
    const lineColor = Color4.FromHexString('#334155ff');
    const lineColors = [lineColor, lineColor, lineColor, lineColor, lineColor, lineColor];
    const centerLine = MeshBuilder.CreateBox(
      'centerLine',
      { width: 40, height: 0.05, depth: 0.1, faceColors: lineColors },
      scene,
    );
    centerLine.position.y = 0.1;

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
