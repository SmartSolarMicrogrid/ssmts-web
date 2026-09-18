export type UserRole = 'Backoffice' | 'GridOperator';
export type ActiveStatus = 'Active' | 'Suspended';
export type NodeStatus = 'Active' | 'Inactive' | 'Maintenance';
export type ProsumerStatus = 'Active' | 'Deactivated';
export type ReservationType = 'Export' | 'Import';
export type ReservationStatus = 'Scheduled' | 'Completed' | 'Cancelled';

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
  nodeId: string;
  name: string;
  location: { lat: number; lng: number };
  capacityKW: number;
  batterySlots: number;
  operatingHours: string;
  status: NodeStatus;
  assignedOperator?: string;
}

export interface Reservation {
  id: string;
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
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
