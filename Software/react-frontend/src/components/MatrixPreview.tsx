import { useEffect, useRef } from 'preact/hooks';

const COLS = 64;
const ROWS = 32;
const PIXEL = 6;  // px per LED dot
const GAP   = 1;

// Simple 5×7 bitmap font — uppercase ASCII + common punctuation.
// Each char: 5 columns of 7-bit masks (bit 6 = top row).
// TODO: there's gotta be a better way....
const FONT5X7: Record<string, readonly number[]> = {
  ' ': [0,0,0,0,0],
  'A': [0x7e,0x09,0x09,0x09,0x7e],
  'B': [0x7f,0x49,0x49,0x49,0x36],
  'C': [0x3e,0x41,0x41,0x41,0x22],
  'D': [0x7f,0x41,0x41,0x22,0x1c],
  'E': [0x7f,0x49,0x49,0x49,0x41],
  'F': [0x7f,0x09,0x09,0x09,0x01],
  'G': [0x3e,0x41,0x49,0x49,0x7a],
  'H': [0x7f,0x08,0x08,0x08,0x7f],
  'I': [0x00,0x41,0x7f,0x41,0x00],
  'J': [0x20,0x40,0x41,0x3f,0x01],
  'K': [0x7f,0x08,0x14,0x22,0x41],
  'L': [0x7f,0x40,0x40,0x40,0x40],
  'M': [0x7f,0x02,0x0c,0x02,0x7f],
  'N': [0x7f,0x04,0x08,0x10,0x7f],
  'O': [0x3e,0x41,0x41,0x41,0x3e],
  'P': [0x7f,0x09,0x09,0x09,0x06],
  'Q': [0x3e,0x41,0x51,0x21,0x5e],
  'R': [0x7f,0x09,0x19,0x29,0x46],
  'S': [0x46,0x49,0x49,0x49,0x31],
  'T': [0x01,0x01,0x7f,0x01,0x01],
  'U': [0x3f,0x40,0x40,0x40,0x3f],
  'V': [0x1f,0x20,0x40,0x20,0x1f],
  'W': [0x7f,0x20,0x18,0x20,0x7f],
  'X': [0x63,0x14,0x08,0x14,0x63],
  'Y': [0x03,0x04,0x78,0x04,0x03],
  'Z': [0x61,0x51,0x49,0x45,0x43],
  '0': [0x3e,0x51,0x49,0x45,0x3e],
  '1': [0x00,0x42,0x7f,0x40,0x00],
  '2': [0x42,0x61,0x51,0x49,0x46],
  '3': [0x21,0x41,0x45,0x4b,0x31],
  '4': [0x18,0x14,0x12,0x7f,0x10],
  '5': [0x27,0x45,0x45,0x45,0x39],
  '6': [0x3c,0x4a,0x49,0x49,0x30],
  '7': [0x01,0x71,0x09,0x05,0x03],
  '8': [0x36,0x49,0x49,0x49,0x36],
  '9': [0x06,0x49,0x49,0x29,0x1e],
  '!': [0x00,0x00,0x5f,0x00,0x00],
  '?': [0x02,0x01,0x51,0x09,0x06],
  '.': [0x00,0x40,0x60,0x40,0x00],
  ',': [0x00,0x50,0x30,0x00,0x00],
  '-': [0x08,0x08,0x08,0x08,0x08],
  ':': [0x00,0x36,0x36,0x00,0x00],
  '/': [0x20,0x10,0x08,0x04,0x02],
  '&': [0x36,0x49,0x55,0x22,0x50],
};

interface Rgb { r: number; g: number; b: number }

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function getCharCols(char: string): readonly number[] {
  return FONT5X7[char] ?? FONT5X7[' ']!;
}

interface MatrixPreviewProps {
  text: string;
  color: string;
  scrolling: boolean;
}

export default function MatrixPreview({ text, color, scrolling }: MatrixPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    if (ctx === null) {return;} 

    const { r, g, b } = hexToRgb(color || '#39ff14');
    const litColor  = `rgb(${r},${g},${b})`;
    const glowColor = `rgba(${r},${g},${b},0.6)`;
    const dimColor  = `rgba(${Math.floor(r * 0.06)},${Math.floor(g * 0.06)},${Math.floor(b * 0.06)},1)`;

    const upper = (text || '').toUpperCase();
    const chars = upper.split('').map(getCharCols);
    const CHAR_W = 6; // 5px + 1px gap

    function buildGrid(offset: number): boolean[][] {
      const grid: boolean[][] = Array.from({ length: ROWS }, () => new Array<boolean>(COLS).fill(false));
      const startY = Math.floor((ROWS - 7) / 2);

      chars.forEach((colData, ci) => {
        colData.forEach((mask, col) => {
          for (let row = 0; row < 7; row++) {
            const bit = (mask >> row) & 1;
            const px = scrolling ? ci * CHAR_W + col - offset + COLS : Math.floor((COLS - chars.length * CHAR_W) / 2) + ci * CHAR_W + col;
            const py = startY + row;
            if (bit && px >= 0 && px < COLS && py >= 0 && py < ROWS) {
              grid[py][px] = true;
            }
          }
        });
      });
      return grid;
    }

    function drawGrid(grid: boolean[][]): void {
      const W = COLS * (PIXEL + GAP);
      const H = ROWS * (PIXEL + GAP);
      ctx.fillStyle = '#030803';
      ctx.fillRect(0, 0, W, H);

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const x   = col * (PIXEL + GAP);
          const y   = row * (PIXEL + GAP);
          const lit = grid[row][col];

          ctx.fillStyle = lit ? litColor : dimColor;
          ctx.beginPath();
          ctx.arc(x + PIXEL / 2, y + PIXEL / 2, (PIXEL / 2) * 0.85, 0, Math.PI * 2);
          ctx.fill();

          if (lit) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur  = 6;
            ctx.fillStyle   = litColor;
            ctx.beginPath();
            ctx.arc(x + PIXEL / 2, y + PIXEL / 2, (PIXEL / 2) * 0.85, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }
    }

    if (scrolling && text) {
      const pixelsPerSec = 30;
      let last = performance.now();
      const totalW = chars.length * CHAR_W + COLS;

      function animate(now: number): void {
        const dt = (now - last) / 1000;
        last = now;
        offsetRef.current = (offsetRef.current + pixelsPerSec * dt) % totalW;
        drawGrid(buildGrid(Math.floor(offsetRef.current)));
        animRef.current = requestAnimationFrame(animate);
      }
      animRef.current = requestAnimationFrame(animate);
    } else {
      offsetRef.current = 0;
      drawGrid(buildGrid(0));
    }

    return () => { cancelAnimationFrame(animRef.current); };
  }, [text, color, scrolling]);

  const W = COLS * (PIXEL + GAP);
  const H = ROWS * (PIXEL + GAP);

  return (
    <div className="relative inline-block">
      <div
        className="rounded overflow-hidden"
        style={{
          boxShadow: '0 0 0 2px #1a2a1a, 0 0 0 4px #0f1f0f, 0 0 40px rgba(57,255,20,0.15)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ display: 'block', imageRendering: 'pixelated' }}
        />
      </div>
      <div
        className="absolute -top-1 -left-1 -right-1 -bottom-1 rounded pointer-events-none"
        style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)' }}
      />
    </div>
  );
}