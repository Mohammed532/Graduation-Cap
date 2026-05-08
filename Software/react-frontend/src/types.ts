// API Types
 
export interface ApiOkResponse {
  status: 'ok';
  msg: string;
}
 
export interface ApiErrorResponse {
  status: 'error';
  msg: string;
}
 
export type ApiResponse = ApiOkResponse | ApiErrorResponse;
 
export interface Esp32Status {
  status: string;
  ip: string;
  rssi: number;
  freeHeap: number;
  uptime: number;
}
 
// Matrix payload types
 
export interface MatrixTextPayload {
  text: string;
  color?: string;     // hex e.g. "#39ff14"
  speed?: number;     // 1–10
  scroll?: boolean;
}
 
export interface MatrixBrightnessPayload {
  brightness: number; // 10–255
}
 
//  Motor payload types 
 
export interface ServoPayload {
  angle: number;      // 0–180
}
 
export interface StepperPayload {
  degrees: number;    // positive = right, negative = left
}
 
//  UI state types
 
export type ToastType = 'ok' | 'err';
 
export interface Toast {
  id: number;
  msg: string;
  type: ToastType;
}
 
export interface LedColor {
  name: string;
  hex: string;
}
 