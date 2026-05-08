import { useState, useEffect } from 'react';
import { getStatus } from '../api/api';
import type { Esp32Status } from '../types';

export default function StatusBar() {
  const [status, setStatus] = useState<Esp32Status | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function poll() {
      try {
        const s = await getStatus();
        if (mounted) { setStatus(s); setError(false); }
      } catch {
        if (mounted) setError(true);
      }
    }

    void poll();
    const id = setInterval(() => void poll(), 3000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const connected = !error && status !== null;

  return (
    <div className="flex items-center gap-6 text-xs font-body tracking-wider text-green-600">
      <span className="flex items-center gap-2">
        <span
          className="status-dot"
          style={{
            backgroundColor: connected ? '#39ff14' : '#ff2d2d',
            boxShadow: connected
              ? '0 0 6px #39ff14, 0 0 12px #39ff1460'
              : '0 0 6px #ff2d2d, 0 0 12px #ff2d2d60',
          }}
        />
        <span style={{ color: connected ? '#39ff14' : '#ff2d2d' }}>
          {connected ? 'ESP32 ONLINE' : 'DISCONNECTED'}
        </span>
      </span>

      {status && (
        <>
          <span className="text-green-700">|</span>
          <span>IP: <span className="text-green-400">{status.ip}</span></span>
          <span className="text-green-700">|</span>
          <span>FREE: <span className="text-green-400">{status.freeHeap}</span>B</span>
          <span className="text-green-700">|</span>
          <span>RSSI: <span className="text-green-400">{status.rssi}dBm</span></span>
        </>
      )}
    </div>
  );
}