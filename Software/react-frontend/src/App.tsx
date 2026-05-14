import { useState } from 'react';
import MatrixPreview from './components/MatrixPreview';
import StatusBar from './components/StatusBar';
import { ToastContainer, useToast } from './components/Toast';
import {
  sendMatrixText,
  clearMatrix,
  setMatrixBrightness,
  triggerGraduation,
  resetMotors,
  setServoAngle,
  moveStepperDeg,
} from './api/api';
import type { LedColor } from './types';

// ---------CONSTANTS----------- //

const LED_COLORS: LedColor[] = [
  { name: 'Green',  hex: '#39ff14' },
  { name: 'Red',    hex: '#ff2d2d' },
  { name: 'Orange', hex: '#ff8c00' },
  { name: 'Yellow', hex: '#ffd700' },
  { name: 'Cyan',   hex: '#00ffff' },
  { name: 'Blue',   hex: '#0080ff' },
  { name: 'Purple', hex: '#bf5fff' },
  { name: 'White',  hex: '#ffffff' },
];

const QUICK_MESSAGES: string[] = [
  'CLASS OF 2025',
  'CONGRATS GRADS!',
  'WE DID IT!',
  '🎓 CS DEGREE',
  'HIRED OR FIRED',
  'THANKS MOM & DAD',
  'YEET',
];

const STEPPER_PRESETS = [-90, -45, 0, 45, 90] as const;
type MotorStatus = 'IDLE' | 'RUNNING SEQUENCE…' | 'SEQUENCE COMPLETE' | 'RESETTING…' | 'HOME POSITION' | 'ERROR — CHECK CONNECTION' | 'ERROR';

//  -------------------Sub Components------------------------

interface DividerProps { label: string }
function Divider({ label }: DividerProps) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-green-900/60" />
      <span className="text-green-700 text-xs tracking-widest font-display">{label}</span>
      <div className="flex-1 h-px bg-green-900/60" />
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}
function Section({ title, children, className = '' }: SectionProps) {
  return (
    <div className={`crt-panel rounded-sm p-4 ${className}`}>
      <div className="text-green-500 text-xs tracking-[0.3em] font-display mb-3 flex items-center gap-2">
        <span className="text-green-700">▶</span> {title}
      </div>
      {children}
    </div>
  );
}

//  ---------------------------App--------------------------------------- 

export default function App() {
  const { toasts, push } = useToast();

  // Matrix state
  const [text,          setText]          = useState('CLASS OF 2025');
  const [color,         setColor]         = useState('#39ff14');
  const [speed,         setSpeed]         = useState(5);
  const [scrolling,     setScrolling]     = useState(true);
  const [brightness,    setBrightness]    = useState(128);
  const [previewActive, setPreviewActive] = useState(false);
  const [sending,       setSending]       = useState(false);

  // Motor state
  const [motorBusy,   setMotorBusy]   = useState(false);
  const [servoAngle,  setServoAngleV] = useState(90);
  const [stepperDeg,  setStepperDeg]  = useState(45);
  const [motorStatus, setMotorStatus] = useState<MotorStatus>('IDLE');

  //  Handlers

  async function handleSendText() {
    if (!text.trim()) { push('Enter some text first!', 'err'); return; }
    setSending(true);
    try {
      await sendMatrixText({ text: text.trim(), color, speed, scroll: scrolling });
      setPreviewActive(true);
      push('Text sent to matrix!');
    } catch {
      push('Failed to reach ESP32', 'err');
      setPreviewActive(true); // still show local preview
    } finally {
      setSending(false);
    }
  }

  async function handleClear() {
    try {
      await clearMatrix();
      setPreviewActive(false);
      push('Matrix cleared');
    } catch {
      setPreviewActive(false);
      push('Failed to reach ESP32 (cleared locally)', 'err');
    }
  }

  async function handleBrightness(val: number) {
    setBrightness(val);
    try { await setMatrixBrightness(val); } catch { /* fire-and-forget */ }
  }

  async function handleGraduation() {
    setMotorBusy(true);
    setMotorStatus('RUNNING SEQUENCE…');
    try {
      await triggerGraduation();
      setMotorStatus('SEQUENCE COMPLETE');
      push('🎓 Graduation sequence fired!');
    } catch {
      setMotorStatus('ERROR — CHECK CONNECTION');
      push('Motor command failed', 'err');
    } finally {
      setTimeout(() => { setMotorBusy(false); setMotorStatus('IDLE'); }, 2000);
    }
  }

  async function handleReset() {
    setMotorBusy(true);
    setMotorStatus('RESETTING…');
    try {
      await resetMotors();
      setMotorStatus('HOME POSITION');
      push('Motors reset to home');
    } catch {
      setMotorStatus('ERROR');
      push('Reset failed', 'err');
    } finally {
      setTimeout(() => { setMotorBusy(false); setMotorStatus('IDLE'); }, 1500);
    }
  }

  async function handleServo() {
    try {
      await setServoAngle(servoAngle);
      push(`Servo → ${servoAngle}°`);
    } catch { push('Servo command failed', 'err'); }
  }

  async function handleStepper() {
    try {
      await moveStepperDeg(stepperDeg);
      push(`Stepper → ${stepperDeg >= 0 ? '+' : ''}${stepperDeg}°`);
    } catch { push('Stepper command failed', 'err'); }
  }

  // ---------------------------- CAPOS ------------------------------

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'Share Tech Mono', monospace" }}>

      {/* ----- Header ------ */}
      <header
        className="border-b border-green-900/60 px-6 py-3 flex items-center justify-between"
        style={{ background: 'rgba(0,0,0,0.8)' }}
      >
        <div className="animate-boot-in">
          <h1
            className="font-display text-3xl tracking-[0.15em] glow-text"
            style={{ color: '#39ff14', textShadow: '0 0 10px #39ff14, 0 0 30px #39ff1440' }}
          >
            Cap{' '}
            <span style={{ color: '#ffd700', textShadow: '0 0 10px #ffd700' }}>OS</span>
          </h1>
          <div className="text-green-700 text-xs tracking-widest mt-0.5">
            ESP32-WROOM-32D // HUB75 64×32 // STEPPER + SERVO
          </div>
        </div>
        <StatusBar />
      </header>

      {/* --------- Main ----------- */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 max-w-6xl mx-auto w-full">

        {/*--LEFT COLUMN */}
        <div className="flex flex-col gap-4">

          {/* Matrix Preview */}
          <Section title="MATRIX PREVIEW // HUB75 64×32">
            <div className="flex justify-center overflow-x-auto pb-2">
              <MatrixPreview
                text={previewActive ? text : ''}
                color={color}
                scrolling={scrolling && previewActive}
              />
            </div>
            <div className="mt-2 text-center text-green-800 text-xs tracking-widest">
              {previewActive ? (scrolling ? '▶ SCROLLING' : '■ STATIC') : '— STANDBY —'}
            </div>
          </Section>

          {/* Text Input */}
          <Section title="DISPLAY TEXT">
            <div className="flex flex-col gap-3">
              <input
                className="crt-input px-3 py-2 text-lg font-display tracking-widest rounded-sm"
                value={text}
                onChange={(e) => { setText(e.target.value); setPreviewActive(true); }}
                placeholder="ENTER MESSAGE…"
                maxLength={64}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleSendText(); }}
              />
              <div className="text-right text-green-800 text-xs">{text.length}/64</div>

              {/* Quick messages */}
              <div className="flex flex-wrap gap-2">
                {QUICK_MESSAGES.map((m) => (
                  <button
                    key={m}
                    className="crt-button text-xs px-2 py-1 rounded-sm font-display tracking-wider"
                    onClick={() => { setText(m); setPreviewActive(true); }}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <Divider label="COLOR" />

              {/* Color swatches */}
              <div className="flex flex-wrap gap-2 items-center">
                {LED_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    className={`color-swatch rounded ${color === c.hex ? 'selected' : ''}`}
                    style={{
                      backgroundColor: c.hex,
                      boxShadow: color === c.hex ? `0 0 10px ${c.hex}` : 'none',
                    }}
                    title={c.name}
                    onClick={() => setColor(c.hex)}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-green-700/50 bg-black"
                  title="Custom color"
                />
              </div>

              <Divider label="OPTIONS" />

              {/* Scroll toggle + speed */}
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    className="w-10 h-5 rounded-full relative transition-colors duration-200"
                    style={{ background: scrolling ? '#39ff14' : '#1a2a1a' }}
                    onClick={() => setScrolling((s) => !s)}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all duration-200"
                      style={{ left: scrolling ? 'calc(100% - 18px)' : '2px' }}
                    />
                  </div>
                  <span className="text-xs tracking-widest text-green-500">
                    {scrolling ? 'SCROLL' : 'STATIC'}
                  </span>
                </label>

                {scrolling && (
                  <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                    <span className="text-xs text-green-700 tracking-wider whitespace-nowrap">SPEED</span>
                    <input
                      type="range" min={1} max={10} value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value))}
                      className="flex-1 accent-green-400"
                    />
                    <span className="text-xs text-green-400 w-4 text-right">{speed}</span>
                  </div>
                )}
              </div>

              {/* Brightness */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-700 tracking-wider whitespace-nowrap">BRIGHTNESS</span>
                <input
                  type="range" min={10} max={255} value={brightness}
                  onChange={(e) => void handleBrightness(Number(e.target.value))}
                  className="flex-1 accent-yellow-400"
                />
                <span className="text-xs text-green-400 w-8 text-right">{brightness}</span>
              </div>

              {/* Send / Clear */}
              <div className="flex gap-3 mt-1">
                <button
                  className="crt-button primary flex-1 py-3 rounded-sm text-lg font-display tracking-widest"
                  onClick={() => void handleSendText()}
                  disabled={sending}
                  style={{ opacity: sending ? 0.6 : 1 }}
                >
                  {sending ? 'SENDING…' : '▶ SEND TO MATRIX'}
                </button>
                <button
                  className="crt-button danger px-4 py-3 rounded-sm font-display tracking-widest"
                  onClick={() => void handleClear()}
                >
                  CLR
                </button>
              </div>
            </div>
          </Section>
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div className="flex flex-col gap-4">

          {/* Graduation Sequence */}
          <Section title="GRADUATION SEQUENCE">
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="text-green-600 text-xs tracking-wider text-center leading-relaxed">
                SERVO +90° ↑ &nbsp;│&nbsp; STEPPER +45° →<br />
                <span className="text-green-800">SIMULTANEOUS EXECUTION</span>
              </div>

              <button
                className="relative w-48 h-48 rounded-full font-display text-2xl tracking-widest transition-all duration-200 select-none"
                style={{
                  background: motorBusy
                    ? 'radial-gradient(circle, #1a3a1a 0%, #050a05 70%)'
                    : 'radial-gradient(circle, #0a2a0a 0%, #050a05 70%)',
                  border: `3px solid ${motorBusy ? '#39ff14' : '#2a5a2a'}`,
                  boxShadow: motorBusy
                    ? '0 0 40px #39ff1460, 0 0 80px #39ff1430, inset 0 0 30px rgba(57,255,20,0.1)'
                    : '0 0 20px rgba(57,255,20,0.1), inset 0 0 10px rgba(0,0,0,0.5)',
                  color:      motorBusy ? '#39ff14' : '#2a8a2a',
                  cursor:     motorBusy ? 'not-allowed' : 'pointer',
                  textShadow: motorBusy ? '0 0 20px #39ff14' : 'none',
                  animation:  motorBusy ? 'glowPulse 1s ease-in-out infinite' : 'none',
                }}
                onClick={() => { if (!motorBusy) void handleGraduation(); }}
                disabled={motorBusy}
              >
                <div className="flex flex-col items-center">
                  <span
                    className="text-4xl mb-1"
                    style={{ filter: motorBusy ? 'drop-shadow(0 0 8px #39ff14)' : 'none' }}
                  >
                    🎓
                  </span>
                  <span>{motorBusy ? 'FIRING' : 'LAUNCH'}</span>
                  <span className="text-sm mt-1 opacity-70">SEQUENCE</span>
                </div>
              </button>

              <div
                className="text-xs tracking-[0.3em] font-display"
                style={{ color: motorStatus.includes('ERROR') ? '#ff2d2d' : '#39ff14' }}
              >
                STATUS: {motorStatus}
              </div>

              <button
                className="crt-button px-6 py-2 rounded-sm font-display tracking-widest text-sm"
                onClick={() => void handleReset()}
                disabled={motorBusy}
              >
                ↺ RESET TO HOME
              </button>
            </div>
          </Section>

          {/* Fine Motor Control (FOR TESTING) */}
          <Section title="FINE MOTOR CONTROL">
            <div className="flex flex-col gap-4">

              {/* Servo */}
              <div>
                <div className="text-green-600 text-xs tracking-wider mb-2 flex items-center gap-2">
                  <span className="text-green-400">◈</span> SERVO ANGLE
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={0} max={180} value={servoAngle}
                    onChange={(e) => setServoAngleV(Number(e.target.value))}
                    className="flex-1 accent-cyan-400"
                  />
                  <span className="text-cyan-400 font-display text-lg w-14 text-right">
                    {servoAngle}°
                  </span>
                  <button
                    className="crt-button px-3 py-1 rounded-sm font-display text-sm tracking-wider"
                    style={{ borderColor: '#00ffff80', color: '#00ffff' }}
                    onClick={() => void handleServo()}
                  >
                    SET
                  </button>
                </div>

                {/* SVG servo arc */}
                <div className="flex justify-center mt-2">
                  <svg width="120" height="65" viewBox="0 0 120 65">
                    <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="#1a3a3a" strokeWidth="4" />
                    <path
                      d={`M60 60 L${60 + 48 * Math.cos((180 - servoAngle) * Math.PI / 180)} ${60 - 48 * Math.sin((180 - servoAngle) * Math.PI / 180)}`}
                      stroke="#00ffff" strokeWidth="2.5" strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 4px #00ffff)' }}
                    />
                    <circle cx="60" cy="60" r="4" fill="#00ffff" style={{ filter: 'drop-shadow(0 0 6px #00ffff)' }} />
                    <text x="10" y="62" fill="#2a5a5a" fontSize="8" fontFamily="monospace">0°</text>
                    <text x="100" y="62" fill="#2a5a5a" fontSize="8" fontFamily="monospace">180°</text>
                  </svg>
                </div>
              </div>

              <Divider label="STEPPER" />

              {/* Stepper */}
              <div>
                <div className="text-green-600 text-xs tracking-wider mb-2 flex items-center gap-2">
                  <span className="text-purple-400">◈</span> STEPPER MOVE (°)
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="crt-button px-3 py-1 rounded-sm font-display text-lg"
                    onClick={() => setStepperDeg((d) => Math.max(-360, d - 45))}
                  >−</button>
                  <div className="flex-1 text-center">
                    <span
                      className="font-display text-xl"
                      style={{ color: '#bf5fff', textShadow: '0 0 8px #bf5fff' }}
                    >
                      {stepperDeg >= 0 ? '+' : ''}{stepperDeg}°
                    </span>
                  </div>
                  <button
                    className="crt-button px-3 py-1 rounded-sm font-display text-lg"
                    onClick={() => setStepperDeg((d) => Math.min(360, d + 45))}
                  >+</button>
                  <button
                    className="crt-button px-3 py-1 rounded-sm font-display text-sm tracking-wider"
                    style={{ borderColor: '#bf5fff80', color: '#bf5fff' }}
                    onClick={() => void handleStepper()}
                  >
                    MOVE
                  </button>
                </div>

                <div className="flex justify-center gap-2 mt-2 flex-wrap">
                  {STEPPER_PRESETS.map((v) => (
                    <button
                      key={v}
                      className="crt-button px-2 py-0.5 rounded-sm font-display text-xs"
                      style={stepperDeg === v ? { borderColor: '#bf5fff', color: '#bf5fff' } : {}}
                      onClick={() => setStepperDeg(v)}
                    >
                      {v >= 0 ? '+' : ''}{v}°
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* System log */}
          <Section title="SYSTEM" className="flex-1">
            <div className="text-green-800 text-xs space-y-1 font-body leading-relaxed">
              <div><span className="text-green-600">SYS</span> CapOS v1.0.0</div>
              <div><span className="text-green-600">SYS</span> Target: ESP32-WROOM-32D</div>
              <div><span className="text-green-600">SYS</span> LED Matrix: HUB75 64×32px</div>
              <div><span className="text-green-600">SYS</span> Motors: Servo + Stepper</div>
              <div><span className="text-green-600">SYS</span> Protocol: HTTP/JSON</div>
              <div className="text-green-900 pt-1">────────────────────────</div>
              <div><span className="text-yellow-700">Made By</span> Mo Akinbayo</div>
            </div>
          </Section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-green-900/40 px-6 py-2 text-green-900 text-xs tracking-widest flex justify-between">
        <span>CapOS // ESP32 WROOM-32D</span>
        <span>HUB75 64×32 // I2S-DMA</span>
      </footer>

      <ToastContainer toasts={toasts} />
    </div>
  );
}