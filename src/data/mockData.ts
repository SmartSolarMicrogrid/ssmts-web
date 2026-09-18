import type { User, Prosumer, MicrogridNode, Reservation } from '../types';

export const mockUsers: User[] = [
  { id: 'USR001', name: 'Amara Silva',        email: 'amara.silva@ssmts.lk',  role: 'Backoffice',    status: 'Active',    createdAt: '2025-01-10' },
  { id: 'USR002', name: 'Kavinda Perera',     email: 'kavinda.p@ssmts.lk',    role: 'GridOperator',  status: 'Active',    createdAt: '2025-02-14' },
  { id: 'USR003', name: 'Nadeesha Fernando',  email: 'nadeesha.f@ssmts.lk',   role: 'Backoffice',    status: 'Active',    createdAt: '2025-03-05' },
  { id: 'USR004', name: 'Isuru Bandara',      email: 'isuru.b@ssmts.lk',      role: 'GridOperator',  status: 'Suspended', createdAt: '2025-01-22' },
  { id: 'USR005', name: 'Malini Jayawardena', email: 'malini.j@ssmts.lk',     role: 'GridOperator',  status: 'Active',    createdAt: '2025-04-18' },
  { id: 'USR006', name: 'Tharindu Wickrama',  email: 'tharindu.w@ssmts.lk',   role: 'Backoffice',    status: 'Active',    createdAt: '2025-05-01' },
  { id: 'USR007', name: 'Sachini Rathnayake', email: 'sachini.r@ssmts.lk',    role: 'GridOperator',  status: 'Suspended', createdAt: '2025-06-12' },
];

export const mockProsumers: Prosumer[] = [
  { nic: '199512345678', name: 'Lahiru Dissanayake', email: 'lahiru.d@gmail.com',  phone: '0771234567', address: '12, Galle Rd, Colombo 3',   status: 'Active',      creditBalance: 4250.50, registeredAt: '2025-01-15' },
  { nic: '198834567890', name: 'Priya Gunasekara',   email: 'priya.g@gmail.com',   phone: '0712345678', address: '45, Kandy Rd, Kurunegala',  status: 'Active',      creditBalance: 1800.00, registeredAt: '2025-02-20' },
  { nic: '200112345V',   name: 'Chathura Seneviratne', email: 'chathura.s@yahoo.com', phone: '0756789012', address: '78, Beach Rd, Negombo', status: 'Deactivated', creditBalance: 0.00,    registeredAt: '2025-03-10' },
  { nic: '197823456789', name: 'Nirosha Kumari',     email: 'nirosha.k@gmail.com',  phone: '0763456789', address: '23, Maharagama',          status: 'Active',      creditBalance: 9500.75, registeredAt: '2025-01-08' },
  { nic: '199245678901', name: 'Ruwan Mendis',       email: 'ruwan.m@hotmail.com',  phone: '0789012345', address: '101, Kiribathgoda',        status: 'Active',      creditBalance: 2150.25, registeredAt: '2025-04-25' },
  { nic: '198956789012', name: 'Dilini Wijesuriya',  email: 'dilini.w@gmail.com',   phone: '0745678901', address: '56, Matara Rd, Galle',     status: 'Deactivated', creditBalance: 350.00,  registeredAt: '2025-05-30' },
];

export const mockNodes: MicrogridNode[] = [
  { nodeId: 'NODE-COL-001', name: 'Colombo Central Hub',   location: { lat: 6.9271, lng: 79.8612 }, capacityKW: 500, batterySlots: 12, operatingHours: '06:00 - 22:00', status: 'Active',      assignedOperator: 'USR002' },
  { nodeId: 'NODE-KDY-001', name: 'Kandy Highland Node',   location: { lat: 7.2906, lng: 80.6337 }, capacityKW: 250, batterySlots: 8,  operatingHours: '07:00 - 20:00', status: 'Active',      assignedOperator: 'USR005' },
  { nodeId: 'NODE-GAL-001', name: 'Galle Southern Node',   location: { lat: 6.0329, lng: 80.2168 }, capacityKW: 175, batterySlots: 6,  operatingHours: '08:00 - 18:00', status: 'Maintenance', assignedOperator: 'USR002' },
  { nodeId: 'NODE-JFN-001', name: 'Jaffna Northern Hub',   location: { lat: 9.6615, lng: 80.0255 }, capacityKW: 300, batterySlots: 10, operatingHours: '06:00 - 21:00', status: 'Active',      assignedOperator: 'USR005' },
  { nodeId: 'NODE-NUW-001', name: 'Nuwara Eliya Node',     location: { lat: 6.9497, lng: 80.7891 }, capacityKW: 120, batterySlots: 4,  operatingHours: '07:00 - 19:00', status: 'Inactive' },
];

export const mockReservations: Reservation[] = [
  { id: 'RES-2026-001', prosumerNic: '199512345678', prosumerName: 'Lahiru Dissanayake', nodeId: 'NODE-COL-001', nodeName: 'Colombo Central Hub',  bayNumber: 3, slotDate: '2026-09-22', startTime: '09:00', endTime: '11:00', type: 'Export', status: 'Scheduled' },
  { id: 'RES-2026-002', prosumerNic: '198834567890', prosumerName: 'Priya Gunasekara',   nodeId: 'NODE-KDY-001', nodeName: 'Kandy Highland Node',   bayNumber: 1, slotDate: '2026-09-21', startTime: '14:00', endTime: '16:00', type: 'Import', status: 'Scheduled' },
  { id: 'RES-2026-003', prosumerNic: '199245678901', prosumerName: 'Ruwan Mendis',       nodeId: 'NODE-COL-001', nodeName: 'Colombo Central Hub',  bayNumber: 7, slotDate: '2026-09-15', startTime: '10:00', endTime: '12:00', type: 'Export', status: 'Completed' },
  { id: 'RES-2026-004', prosumerNic: '197823456789', prosumerName: 'Nirosha Kumari',     nodeId: 'NODE-JFN-001', nodeName: 'Jaffna Northern Hub',   bayNumber: 5, slotDate: '2026-09-14', startTime: '08:00', endTime: '10:00', type: 'Import', status: 'Completed' },
  { id: 'RES-2026-005', prosumerNic: '199512345678', prosumerName: 'Lahiru Dissanayake', nodeId: 'NODE-KDY-001', nodeName: 'Kandy Highland Node',   bayNumber: 2, slotDate: '2026-09-23', startTime: '13:00', endTime: '15:00', type: 'Import', status: 'Scheduled' },
  { id: 'RES-2026-006', prosumerNic: '199245678901', prosumerName: 'Ruwan Mendis',       nodeId: 'NODE-GAL-001', nodeName: 'Galle Southern Node',   bayNumber: 4, slotDate: '2026-09-20', startTime: '11:00', endTime: '13:00', type: 'Export', status: 'Cancelled' },
  { id: 'RES-2026-007', prosumerNic: '197823456789', prosumerName: 'Nirosha Kumari',     nodeId: 'NODE-COL-001', nodeName: 'Colombo Central Hub',  bayNumber: 9, slotDate: '2026-09-24', startTime: '07:00', endTime: '09:00', type: 'Export', status: 'Scheduled' },
];
