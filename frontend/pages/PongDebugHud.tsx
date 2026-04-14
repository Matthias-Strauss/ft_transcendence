import type { Engine } from '@babylonjs/core';
import { type ReactNode, type RefObject, useEffect, useRef, useState } from 'react';

export function usePongDebugHud(engineRef: RefObject<Engine | null>) {
  const snapshotIntervalRef = useRef<number>(0);
  const lastSnapshotTRef = useRef<number>(0);
  const [visible, setVisible] = useState(false);
  const [hud, setHud] = useState({ fps: 0, snapMs: 0 });

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      const eng = engineRef.current;
      setHud({
        fps: eng ? Math.round(eng.getFps()) : 0,
        snapMs: Math.round(snapshotIntervalRef.current),
      });
    }, 250);
    return () => clearInterval(id);
  }, [visible, engineRef]);

  const notifySnapshot = (now: number) => {
    if (lastSnapshotTRef.current > 0) {
      const dt = now - lastSnapshotTRef.current;
      snapshotIntervalRef.current =
        snapshotIntervalRef.current === 0 ? dt : snapshotIntervalRef.current * 0.8 + dt * 0.2;
    }
    lastSnapshotTRef.current = now;
  };

  const reset = () => {
    lastSnapshotTRef.current = 0;
    snapshotIntervalRef.current = 0;
  };

  const toggle = () => setVisible((v) => !v);

  const element: ReactNode = visible ? (
    <div
      style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: '#f7f9f9',
        fontFamily: 'monospace',
        fontSize: 13,
        background: 'rgba(0,0,0,0.7)',
        padding: '8px 12px',
        borderRadius: 6,
        pointerEvents: 'none',
        lineHeight: 1.5,
      }}
    >
      <div>FPS: {hud.fps}</div>
      <div>Snap: {hud.snapMs} ms</div>
    </div>
  ) : null;

  return { element, notifySnapshot, reset, toggle };
}
