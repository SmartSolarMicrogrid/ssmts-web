import type {
  User,
  Prosumer,
  MicrogridNode,
  Reservation,
  AuthUser,
  UserRole,
  AuthResponseDto,
  RegisterRequestDto,
  CreateProsumerDto,
  ProsumerUpdateDto,
  CreateNodeDto,
  UpdateNodeDto,
  CreateReservationRequest,
  ModifyReservationRequest,
  SlotResponseDto,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * Generic HTTP client with JWT token management and error handling
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
      let message = `Request failed with status ${res.status}`;
      if (errorData?.detail) {
        message = errorData.detail;
      } else if (errorData?.message) {
        message = errorData.message;
      } else if (errorData?.errors && typeof errorData.errors === 'object') {
        const errList = Object.values(errorData.errors).flat().filter(Boolean);
        if (errList.length > 0) message = errList.join('; ');
      } else if (errorData?.title) {
        message = errorData.title;
      }
      const err = new Error(message);
      (err as unknown as Record<string, unknown>).status = res.status;
      (err as unknown as Record<string, unknown>).data = errorData;
      throw err;
    }
    if (res.status === 204) {
      return {} as T;
    }
    return await res.json();
  } catch (err: unknown) {
    console.error(`[SSMTS API] ${endpoint} request failed.`, err);
    throw err;
  }
}

// ── Auth Service ─────────────────────────────────────────────────────────────
export const authApi = {
  async login(email: string, password = 'Password123!'): Promise<{ token: string; user: AuthUser }> {
    const res = await request<AuthResponseDto>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const user: AuthUser = {
      id: res.userId,
      name: res.name,
      email: res.email,
      role: (res.role as UserRole) || 'Backoffice',
    };
    localStorage.setItem('ssmts_token', res.token);
    return { token: res.token, user };
  },

  async getMe(): Promise<AuthUser> {
    const res = await request<{ id: string; name: string; email: string; role: string }>('/auth/me');
    return {
      id: res.id,
      name: res.name,
      email: res.email,
      role: res.role as UserRole,
    };
  },

  logout(): void {
    localStorage.removeItem('ssmts_token');
  },
};

// ── Users Service (Module 1 — Backoffice Only) ────────────────────────────────
export const usersApi = {
  async getAll(): Promise<User[]> {
    interface BackendUser {
      id: string;
      name: string;
      email: string;
      role: string;
      isActive: boolean;
      createdAt: string;
    }
    const data = await request<BackendUser[]>('/users');
    return (data || []).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as UserRole,
      status: u.isActive ? 'Active' : 'Suspended',
      createdAt: u.createdAt ? u.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
    }));
  },

  async create(user: RegisterRequestDto): Promise<User> {
    interface BackendUser {
      id: string;
      name: string;
      email: string;
      role: string;
      isActive: boolean;
      createdAt: string;
    }
    const u = await request<BackendUser>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as UserRole,
      status: u.isActive ? 'Active' : 'Suspended',
      createdAt: u.createdAt ? u.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
    };
  },

  async update(id: string, updates: { name?: string; role?: string; isActive?: boolean }): Promise<void> {
    await request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async toggleStatus(id: string, currentStatus: string): Promise<{ id: string; status: string }> {
    const isNowActive = currentStatus !== 'Active';
    await request(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: isNowActive }),
    });
    return { id, status: isNowActive ? 'Active' : 'Suspended' };
  },

  async delete(id: string): Promise<void> {
    await request(`/users/${id}`, { method: 'DELETE' });
  },

  async changePassword(id: string, newPassword: string): Promise<void> {
    await request(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    });
  },
};

// ── Prosumers Service (Module 2 — Backoffice & Prosumer) ─────────────────────
export const prosumersApi = {
  async getAll(): Promise<Prosumer[]> {
    interface BackendProsumer {
      id: string;
      nic: string;
      fullName: string;
      email: string;
      phone: string;
      address: string;
      status: string;
      registeredAt: string;
    }
    const data = await request<BackendProsumer[]>('/prosumers');
    return (data || []).map(p => ({
      nic: p.nic,
      name: p.fullName,
      email: p.email,
      phone: p.phone,
      address: p.address,
      status: (p.status as Prosumer['status']) || 'Active',
      creditBalance: 0,
      registeredAt: p.registeredAt ? p.registeredAt.split('T')[0] : new Date().toISOString().split('T')[0],
    }));
  },

  async getByNic(nic: string): Promise<Prosumer | null> {
    interface BackendProsumer {
      id: string;
      nic: string;
      fullName: string;
      email: string;
      phone: string;
      address: string;
      status: string;
      registeredAt: string;
    }
    const p = await request<BackendProsumer>(`/prosumers/${nic}`);
    if (!p) return null;
    return {
      nic: p.nic,
      name: p.fullName,
      email: p.email,
      phone: p.phone,
      address: p.address,
      status: (p.status as Prosumer['status']) || 'Active',
      creditBalance: 0,
      registeredAt: p.registeredAt ? p.registeredAt.split('T')[0] : new Date().toISOString().split('T')[0],
    };
  },

  async create(data: CreateProsumerDto): Promise<Prosumer> {
    interface BackendProsumer {
      id: string;
      nic: string;
      fullName: string;
      email: string;
      phone: string;
      address: string;
      status: string;
      registeredAt: string;
    }
    const p = await request<BackendProsumer>('/prosumers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return {
      nic: p.nic,
      name: p.fullName,
      email: p.email,
      phone: p.phone,
      address: p.address,
      status: (p.status as Prosumer['status']) || 'Active',
      creditBalance: 0,
      registeredAt: p.registeredAt ? p.registeredAt.split('T')[0] : new Date().toISOString().split('T')[0],
    };
  },

  async update(nic: string, data: ProsumerUpdateDto): Promise<void> {
    await request(`/prosumers/${nic}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deactivate(nic: string): Promise<void> {
    await request(`/prosumers/${nic}/deactivate`, {
      method: 'PATCH',
    });
  },

  async reactivate(nic: string): Promise<void> {
    await request(`/prosumers/${nic}/reactivate`, {
      method: 'PATCH',
    });
  },

  async getPending(): Promise<Prosumer[]> {
    interface BackendProsumer {
      id: string;
      nic: string;
      fullName: string;
      email: string;
      phone: string;
      address: string;
      status: string;
      registeredAt: string;
    }
    const data = await request<BackendProsumer[]>('/prosumers/pending');
    return (data || []).map(p => ({
      nic: p.nic,
      name: p.fullName,
      email: p.email,
      phone: p.phone,
      address: p.address,
      status: 'PendingActivation',
      creditBalance: 0,
      registeredAt: p.registeredAt ? p.registeredAt.split('T')[0] : new Date().toISOString().split('T')[0],
    }));
  },

  async activate(id: string): Promise<void> {
    await request(`/prosumers/${id}/activate`, {
      method: 'PUT',
    });
  },

  async delete(nic: string): Promise<void> {
    await request(`/prosumers/${nic}`, {
      method: 'DELETE',
    });
  },
};

// ── Microgrid Nodes Service (Module 3 — Solar Grid Hubs) ──────────────────────
export const nodesApi = {
  async getAll(): Promise<MicrogridNode[]> {
    interface BackendNode {
      id: string;
      nodeCode: string;
      name: string;
      latitude: number;
      longitude: number;
      capacityKW?: number;
      maxKwhPerReservation?: number;
      capacityBays: number;
      openTime: string;
      closeTime: string;
      status: string;
      operatorIds?: string[];
    }
    const data = await request<BackendNode[]>('/nodes');
    return (data || []).map(n => ({
      id: n.id,
      nodeId: n.nodeCode || n.id,
      name: n.name,
      location: { lat: n.latitude, lng: n.longitude },
      capacityKW: n.capacityKW ?? 250,
      capacityKWh: (n.capacityKW ?? 250) * 4,
      batterySlots: n.capacityBays || 6,
      operatingHours: `${n.openTime || '06:00'} - ${n.closeTime || '20:00'}`,
      status: (n.status as MicrogridNode['status']) || 'Active',
      assignedOperator: n.operatorIds?.[0],
    }));
  },

  async create(data: CreateNodeDto): Promise<MicrogridNode> {
    interface BackendNode {
      id: string;
      nodeCode: string;
      name: string;
      latitude: number;
      longitude: number;
      capacityBays: number;
      openTime: string;
      closeTime: string;
      status: string;
    }
    const n = await request<BackendNode>('/nodes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return {
      id: n.id,
      nodeId: n.nodeCode || n.id,
      name: n.name,
      location: { lat: n.latitude, lng: n.longitude },
      capacityKW: 250,
      capacityKWh: 1000,
      batterySlots: n.capacityBays || 6,
      operatingHours: `${n.openTime} - ${n.closeTime}`,
      status: 'Active',
    };
  },

  async update(id: string, data: UpdateNodeDto): Promise<void> {
    await request(`/nodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deactivate(id: string): Promise<void> {
    await request(`/nodes/${id}/deactivate`, {
      method: 'PATCH',
    });
  },

  async activate(id: string): Promise<void> {
    await request(`/nodes/${id}/activate`, {
      method: 'PATCH',
    });
  },

  async getSlots(nodeId: string, date: string): Promise<SlotResponseDto[]> {
    return await request<SlotResponseDto[]>(`/nodes/${nodeId}/slots?date=${encodeURIComponent(date)}`);
  },

  async generateSlots(nodeId: string, fromDate: string, toDate: string): Promise<void> {
    await request(`/nodes/${nodeId}/slots/generate`, {
      method: 'POST',
      body: JSON.stringify({ fromDate, toDate }),
    });
  },
};

// ── Energy Slot Reservation Management (Module 4) ─────────────────────────────
export const reservationsApi = {
  async getAll(status?: string, nodeId?: string): Promise<Reservation[]> {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.set('status', status);
    if (nodeId) params.set('nodeId', nodeId);

    interface BackendRes {
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
      status: string;
    }
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const list = await request<BackendRes[]>(`/reservations${queryStr}`);
    return (list || []).map(r => {
      const startDate = r.slotStartUtc ? r.slotStartUtc.split('T')[0] : '';
      const startTime = r.slotStartUtc ? r.slotStartUtc.split('T')[1]?.slice(0, 5) : '09:00';
      const endTime = r.slotEndUtc ? r.slotEndUtc.split('T')[1]?.slice(0, 5) : '11:00';
      return {
        id: r.id || r.reservationNo,
        reservationNo: r.reservationNo || r.id,
        prosumerNic: r.prosumerNic,
        prosumerName: `Prosumer (${r.prosumerNic})`,
        nodeId: r.nodeId,
        nodeName: r.nodeName || 'Solar Node',
        bayNumber: 1,
        slotDate: startDate || new Date().toISOString().split('T')[0],
        startTime,
        endTime,
        type: (r.tradeType as Reservation['type']) || 'Export',
        status: (r.status as Reservation['status']) || 'Pending',
        slotId: r.slotId,
        requestedKwh: r.requestedKwh,
      };
    });
  },

  async create(data: CreateReservationRequest): Promise<Reservation> {
    interface BackendRes {
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
      status: string;
    }
    const r = await request<BackendRes>('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return {
      id: r.id || r.reservationNo,
      reservationNo: r.reservationNo || r.id,
      prosumerNic: r.prosumerNic,
      prosumerName: `Prosumer (${r.prosumerNic})`,
      nodeId: r.nodeId,
      nodeName: r.nodeName,
      bayNumber: 1,
      slotDate: r.slotStartUtc ? r.slotStartUtc.split('T')[0] : new Date().toISOString().split('T')[0],
      startTime: r.slotStartUtc ? r.slotStartUtc.split('T')[1]?.slice(0, 5) : '09:00',
      endTime: r.slotEndUtc ? r.slotEndUtc.split('T')[1]?.slice(0, 5) : '11:00',
      type: (r.tradeType as Reservation['type']) || 'Export',
      status: (r.status as Reservation['status']) || 'Pending',
      slotId: r.slotId,
      requestedKwh: r.requestedKwh,
    };
  },

  async modify(id: string, data: ModifyReservationRequest): Promise<void> {
    await request(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async cancel(id: string): Promise<void> {
    await request(`/reservations/${id}/cancel`, {
      method: 'PATCH',
    });
  },

  async approve(id: string): Promise<void> {
    await request(`/reservations/${id}/approve`, {
      method: 'PATCH',
    });
  },

  async reject(id: string, reason: string): Promise<void> {
    await request(`/reservations/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },
};
