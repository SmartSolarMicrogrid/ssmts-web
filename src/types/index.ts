export type UserRole = 'Backoffice' | 'GridOperator';
export type ActiveStatus = 'Active' | 'Suspended';
export type NodeStatus = 'Active' | 'Inactive' | 'Maintenance';
export type ProsumerStatus = 'Active' | 'Deactivated' | 'PendingActivation';
export type ReservationType = 'Export' | 'Import';
export type ReservationStatus = 'Pending' | 'Approved' | 'Completed' | 'Cancelled';

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
  capacityKWh?: number;
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
  createdAt?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
