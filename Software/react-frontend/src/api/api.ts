import type {
  ApiResponse,
  Esp32Status,
  MatrixTextPayload,
  MatrixBrightnessPayload,
  ServoPayload,
  StepperPayload,
} from '../types';

// For local dev, set to ESP32's IP: "http://192.168.1.xxx"
const BASE = '';

async function request(path: string, body: object): Promise<ApiResponse> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<ApiResponse>;
}

//  -------------- LED Matrix ---------------------

/** Send text to the HUB75 LED matrix. */
export function sendMatrixText({
  text,
  color = '#39ff14',
  speed = 5,
  scroll = true,
}: MatrixTextPayload): Promise<ApiResponse> {
  return request('/api/matrix/text', { text, color, speed, scroll });
}

/** Clear the LED matrix. */
export function clearMatrix(): Promise<ApiResponse> {
  return request('/api/matrix/clear', {});
}

/** Set matrix brightness (10–255). */
export function setMatrixBrightness(
  brightness: MatrixBrightnessPayload['brightness'],
): Promise<ApiResponse> {
  return request('/api/matrix/brightness', { brightness });
}

//  -------------- Motors ---------------------

/** Fire the graduation sequence: servo +90°, stepper +45°. */
export function triggerGraduation(): Promise<ApiResponse> {
  return request('/api/motors/graduation', {});
}

/** Return all motors to their home positions. */
export function resetMotors(): Promise<ApiResponse> {
  return request('/api/motors/reset', {});
}

/** Move servo to a specific angle (0–180°). */
export function setServoAngle(angle: ServoPayload['angle']): Promise<ApiResponse> {
  return request('/api/motors/servo', { angle });
}

/**
 * Move stepper a relative number of degrees.
 * Positive = right, negative = left.
 */
export function moveStepperDeg(degrees: StepperPayload['degrees']): Promise<ApiResponse> {
  return request('/api/motors/stepper', { degrees });
}

//  -------------- Status ---------------------

export async function getStatus(): Promise<Esp32Status> {
  const res = await fetch(`${BASE}/api/status`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<Esp32Status>;
}