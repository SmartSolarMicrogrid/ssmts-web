import type { User, Prosumer, MicrogridNode, Reservation, AuthUser, UserRole } from '../types';
import { mockUsers, mockProsumers, mockNodes, mockReservations } from '../data/mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Generic HTTP client with graceful fallback and error handling
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('ssmts_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err: unknown) {
    // Graceful error logging
    console.warn(`[SSMTS API] ${endpoint} unavailable, using client state.`, err);
    throw err;
  }
}

// ── Auth Service ─────────────────────────────────────────────────────────────
export const authApi = {
  async login(email: string, role?: UserRole): Promise<{ token: string; user: AuthUser }> {
    try {
      return await request<{ token: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    } catch {
      // Fallback for standalone demo / offline mode
      const found = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      const user: AuthUser = found
        ? { id: found.id, name: found.name, email: found.email, role: role || found.role }
        : { id: 'USR-DEMO', name: email.split('@')[0], email, role: role || 'Backoffice' };
      const token = 'mock-jwt-token-' + Date.now();
      localStorage.setItem('ssmts_token', token);
      return { token, user };
    }
  },
};

// ── Users Service (Module 1 — Backoffice Only) ────────────────────────────────
export const usersApi = {
  async getAll(): Promise<User[]> {
    try {
      return await request<User[]>('/users');
    } catch {
      return mockUsers;
    }
  },
  async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    try {
      return await request<User>('/users', {
        method: 'POST',
        body: JSON.stringify(user),
      });
    } catch {
      return {
        id: `USR${String(Math.floor(Math.random() * 900) + 100)}`,
        ...user,
        createdAt: new Date().toISOString().split('T')[0],
      };
    }
  },
  async update(id: string, updates: Partial<User>): Promise<User> {
    try {
      return await request<User>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch {
      return { id, name: updates.name || '', email: updates.email || '', role: updates.role || 'Backoffice', status: updates.status || 'Active', createdAt: '2025-01-01' };
    }
  },
  async toggleStatus(id: string, currentStatus: string): Promise<{ id: string; status: string }> {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      return await request<{ id: string; status: string }>(`/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      return { id, status: newStatus };
    }
  },
};

// ── Prosumers Service (Module 2 — Backoffice Only) ────────────────────────────
export const prosumersApi = {
  async getAll(): Promise<Prosumer[]> {
    try {
      return await request<Prosumer[]>('/prosumers');
    } catch {
      return mockProsumers;
    }
  },
  async create(prosumer: Omit<Prosumer, 'registeredAt'>): Promise<Prosumer> {
    try {
      return await request<Prosumer>('/prosumers', {
        method: 'POST',
        body: JSON.stringify(prosumer),
      });
    } catch {
      return {
        ...prosumer,
        registeredAt: new Date().toISOString().split('T')[0],
      };
    }
  },
  async update(nic: string, updates: Partial<Prosumer>): Promise<Prosumer> {
    try {
      return await request<Prosumer>(`/prosumers/${nic}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch {
      return { nic, name: updates.name || '', email: updates.email || '', phone: updates.phone || '', address: updates.address || '', status: updates.status || 'Active', creditBalance: updates.creditBalance ?? 0, registeredAt: '2025-01-01' };
    }
  },
  async approve(nic: string): Promise<{ nic: string; status: string }> {
    try {
      return await request<{ nic: string; status: string }>(`/prosumers/${nic}/approve`, {
        method: 'PATCH',
      });
    } catch {
      return { nic, status: 'Active' };
    }
  },
  async toggleStatus(nic: string, currentStatus: string): Promise<{ nic: string; status: string }> {
    const newStatus = currentStatus === 'Active' ? 'Deactivated' : 'Active';
    try {
      return await request<{ nic: string; status: string }>(`/prosumers/${nic}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      return { nic, status: newStatus };
    }
  },
};

// ── Microgrid Nodes Service (Module 3) ────────────────────────────────────────
export const nodesApi = {
  async getAll(): Promise<MicrogridNode[]> {
    try {
      return await request<MicrogridNode[]>('/nodes');
    } catch {
      return mockNodes;
    }
  },
  async create(node: Omit<MicrogridNode, 'nodeId'>): Promise<MicrogridNode> {
    try {
      return await request<MicrogridNode>('/nodes', {
        method: 'POST',
        body: JSON.stringify(node),
      });
    } catch {
      return {
        nodeId: `NODE-HUB-${String(Math.floor(Math.random() * 900) + 100)}`,
        ...node,
      };
    }
  },
  async update(nodeId: string, updates: Partial<MicrogridNode>): Promise<MicrogridNode> {
    try {
      return await request<MicrogridNode>(`/nodes/${nodeId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch {
      return { nodeId, name: updates.name || '', location: updates.location || { lat: 6.9, lng: 79.8 }, capacityKW: updates.capacityKW || 100, batterySlots: updates.batterySlots || 4, operatingHours: updates.operatingHours || '24 Hours', status: updates.status || 'Active' };
    }
  },
  async delete(nodeId: string): Promise<{ success: boolean; nodeId: string }> {
    try {
      return await request<{ success: boolean; nodeId: string }>(`/nodes/${nodeId}`, {
        method: 'DELETE',
      });
    } catch {
      return { success: true, nodeId };
    }
  },
  async toggleStatus(nodeId: string, currentStatus: string): Promise<{ nodeId: string; status: string }> {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      return await request<{ nodeId: string; status: string }>(`/nodes/${nodeId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      return { nodeId, status: newStatus };
    }
  },
};

// ── Reservations Service (Module 4) ──────────────────────────────────────────
export const reservationsApi = {
  async getAll(): Promise<Reservation[]> {
    try {
      return await request<Reservation[]>('/reservations');
    } catch {
      return mockReservations;
    }
  },
  async create(resData: Omit<Reservation, 'id'>): Promise<Reservation> {
    try {
      return await request<Reservation>('/reservations', {
        method: 'POST',
        body: JSON.stringify(resData),
      });
    } catch {
      return {
        id: `RES-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
        ...resData,
      };
    }
  },
  async update(id: string, updates: Partial<Reservation>): Promise<Reservation> {
    try {
      return await request<Reservation>(`/reservations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch {
      return { id, prosumerNic: '', prosumerName: '', nodeId: '', nodeName: '', bayNumber: 1, slotDate: '', startTime: '', endTime: '', type: 'Export', status: 'Pending', ...updates };
    }
  },
  async cancel(id: string): Promise<{ id: string; status: string }> {
    try {
      return await request<{ id: string; status: string }>(`/reservations/${id}/cancel`, {
        method: 'PATCH',
      });
    } catch {
      return { id, status: 'Cancelled' };
    }
  },
  async approve(id: string): Promise<{ id: string; status: string }> {
    try {
      return await request<{ id: string; status: string }>(`/reservations/${id}/approve`, {
        method: 'PATCH',
      });
    } catch {
      return { id, status: 'Approved' };
    }
  },
};
