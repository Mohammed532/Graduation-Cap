import { useState, useCallback, useRef } from 'preact/hooks';
import type { Toast, ToastType } from '../types';

type PushFn = (msg: string, type?: ToastType) => void;

let _push: PushFn | null = null;

interface UseToastReturn {
  toasts: Toast[];
  push: PushFn;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const push = useCallback<PushFn>((msg, type = 'ok') => {
    const id = ++counter.current;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  _push = push;
  return { toasts, push };
}

/** Imperative helper, call from outside React components. */
export function toast(msg: string, type: ToastType = 'ok'): void {
  _push?.(msg, type);
}

interface ToastContainerProps {
  toasts: Toast[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="px-4 py-2 font-body text-sm tracking-wide border animate-slide-up"
          style={{
            background:         t.type === 'err' ? 'rgba(255,45,45,0.1)' : 'rgba(57,255,20,0.08)',
            borderColor:        t.type === 'err' ? 'rgba(255,45,45,0.5)' : 'rgba(57,255,20,0.4)',
            color:              t.type === 'err' ? '#ff6b6b' : '#39ff14',
            textShadow:         `0 0 8px ${t.type === 'err' ? '#ff2d2d' : '#39ff14'}80`,
            boxShadow:          `0 0 20px ${t.type === 'err' ? '#ff2d2d' : '#39ff14'}20`,
          }}
        >
          {t.type === 'err' ? '✗ ' : '✓ '}
          {t.msg}
        </div>
      ))}
    </div>
  );
}