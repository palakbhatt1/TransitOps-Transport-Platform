import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Create Axios Instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('transitops_auth') || '{}');
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

export const client = {
  // Always returns false since mock mode has been removed.
  isMock: () => false,
  setMock: () => {},

  auth: {
    login: async (email, password) => {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('transitops_auth', JSON.stringify(response.data));
      return response.data;
    },
    logout: async () => {
      localStorage.removeItem('transitops_auth');
      return true;
    },
    getCurrentUser: () => {
      const auth = localStorage.getItem('transitops_auth');
      return auth ? JSON.parse(auth).user : null;
    },
    setCurrentRole: (role) => {
      const auth = JSON.parse(localStorage.getItem('transitops_auth') || '{}');
      if (auth.user) {
        auth.user.role = role;
        localStorage.setItem('transitops_auth', JSON.stringify(auth));
      }
    }
  },

  vehicles: {
    getAll: async () => {
      const res = await api.get('/vehicles/');
      return res.data;
    },
    getById: async (id) => {
      const res = await api.get(`/vehicles/${id}`);
      return res.data;
    },
    create: async (data) => {
      const res = await api.post('/vehicles/', data);
      return res.data;
    },
    updateStatus: async (id, status) => {
      const res = await api.put(`/vehicles/${id}/status`, null, {
        params: { status }
      });
      return res.data;
    }
  },

  drivers: {
    getAll: async () => {
      const res = await api.get('/drivers/');
      return res.data;
    },
    getById: async (id) => {
      const res = await api.get(`/drivers/${id}`);
      return res.data;
    },
    create: async (data) => {
      const res = await api.post('/drivers/', data);
      return res.data;
    },
    updateStatus: async (id, status) => {
      const res = await api.put(`/drivers/${id}/status`, null, {
        params: { status }
      });
      return res.data;
    }
  },

  trips: {
    getAll: async () => {
      const res = await api.get('/trips/');
      return res.data;
    },
    getById: async (id) => {
      const res = await api.get(`/trips/${id}`);
      return res.data;
    },
    create: async (data) => {
      const res = await api.post('/trips/', data);
      return res.data;
    },
    updateStatus: async (id, status) => {
      const res = await api.put(`/trips/${id}/status`, null, {
        params: { status }
      });
      return res.data;
    },
    addLog: async (tripId, data) => {
      const res = await api.post(`/trips/${tripId}/logs`, data);
      return res.data;
    },
    getLogs: async (tripId) => {
      const res = await api.get(`/trips/${tripId}/logs`);
      return res.data;
    }
  },

  maintenance: {
    getAll: async () => {
      const res = await api.get('/maintenance/');
      return res.data;
    },
    getById: async (id) => {
      const res = await api.get(`/maintenance/${id}`);
      return res.data;
    },
    create: async (data) => {
      const res = await api.post('/maintenance/', data);
      return res.data;
    },
    closeLog: async (id, cost) => {
      const res = await api.put(`/maintenance/${id}/close`, null, {
        params: { cost }
      });
      return res.data;
    }
  },

  dashboard: {
    getKpis: async () => {
      const res = await api.get('/dashboard/kpis');
      return res.data;
    },
    getKPIs: async () => {
      const res = await api.get('/dashboard/kpis');
      return res.data;
    },
    getDbStatus: async () => {
      const res = await api.get('/dashboard/db-status');
      return res.data;
    }
  },

  finance: {
    getLogs: async () => {
      const res = await api.get('/finance/logs');
      return res.data;
    },
    recordFuel: async (data) => {
      const res = await api.post('/finance/fuel', data);
      return res.data;
    },
    recordExpense: async (data) => {
      const res = await api.post('/finance/expense', data);
      return res.data;
    }
  },

  reports: {
    getEfficiency: async () => {
      const res = await api.get('/reports/efficiency');
      return res.data;
    },
    getRoi: async () => {
      const res = await api.get('/reports/roi');
      return res.data;
    },
    getExportCsvUrl: () => {
      return `${API_BASE_URL}/reports/export/csv`;
    }
  }
};
