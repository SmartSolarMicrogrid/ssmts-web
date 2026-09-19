export type UserRole = 'Backoffice' | 'GridOperator' | 'Prosumer';
export type ActiveStatus = 'Active' | 'Suspended';
export type NodeStatus = 'Active' | 'Inactive' | 'Maintenance';
export type ProsumerStatus = 'Active' | 'Deactivated' | 'PendingActivation';
export type ReservationType = 'Export' | 'Import';
export type ReservationStatus = 'Pending' | 'Approved' | 'Completed' | 'Cancelled' | 'Rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: ActiveStatus;
  createdAt: string;
}

export interface Prosumer {
  nic: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: ProsumerStatus;
  creditBalance: number;
  registeredAt: string;
}

export interface MicrogridNode {
  id?: string;
  nodeId: string;
  name: string;
  location: { lat: number; lng: number };
  capacityKW: number;
  capacityKWh?: number;
  batterySlots: number;
  operatingHours: string;
  status: NodeStatus;
  assignedOperator?: string;
}

export interface Reservation {
  id: string;
  reservationNo?: string;
  prosumerNic: string;
  prosumerName: string;
  nodeId: string;
  nodeName: string;
  bayNumber: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  type: ReservationType;
  status: ReservationStatus;
  createdAt?: string;
  slotId?: string;
  requestedKwh?: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// ── Backend API DTOs ──────────────────────────────────────────────────────────

export interface AuthResponseDto {
  token: string;
  expiresAt: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  redirectPath: string;
}

export interface RegisterRequestDto {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserDto {
  name?: string;
  role?: string;
  isActive?: boolean;
}

export interface CreateProsumerDto {
  nic: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  status?: string;
}

export interface ProsumerUpdateDto {
  fullName: string;
  phone: string;
  address: string;
}

export interface CreateNodeDto {
  nodeCode: string;
  name: string;
  latitude: number;
  longitude: number;
  buyPricePerKwh?: number;
  sellPricePerKwh?: number;
  openTime?: string;
  closeTime?: string;
  slotDurationMinutes?: number;
  maxKwhPerReservation?: number;
  capacityBays?: number;
  operatorIds?: string[];
}

export interface UpdateNodeDto {
  name?: string;
  latitude?: number;
  longitude?: number;
  buyPricePerKwh?: number;
  sellPricePerKwh?: number;
  openTime?: string;
  closeTime?: string;
  slotDurationMinutes?: number;
  maxKwhPerReservation?: number;
  capacityBays?: number;
  operatorIds?: string[];
}

export interface NodeResponseDto {
  id: string;
  nodeCode: string;
  name: string;
  latitude: number;
  longitude: number;
  buyPricePerKwh: number;
  sellPricePerKwh: number;
  openTime: string;
  closeTime: string;
  slotDurationMinutes: number;
  status: string;
  maxKwhPerReservation: number;
  capacityBays: number;
  operatorIds: string[];
  createdAt: string;
}

export interface SlotResponseDto {
  id: string;
  nodeId: string;
  localDate: string;
  startUtc: string;
  endUtc: string;
  capacity: number;
  bookedCount: number;
  availableCount?: number;
  status: string;
  version?: number;
}

export interface CreateReservationRequest {
  nodeId: string;
  slotId?: string;
  tradeType: string;
  requestedKwh: number;
  prosumerNic?: string;
}

export interface ModifyReservationRequest {
  newSlotId?: string;
  newRequestedKwh?: number;
  newTradeType?: string;
}

export interface RejectReservationRequest {
  reason: string;
}

export interface ReservationResponse {
  id: string;
  reservationNo: string;
  prosumerNic: string;
  nodeId: string;
  slotId: string;
  nodeName: string;
  slotStartUtc: string;
  slotEndUtc: string;
  tradeType: string;
  requestedKwh: number;
  unitPrice: number;
  estimatedValue: number;
  status: string;
  isActive: boolean;
  version: number;
  changeDeadlineUtc: string;
  canModify: boolean;
  canCancel: boolean;
}
