import axios from 'axios';
import {
  initialVehicles,
  initialDrivers,
  initialTrips,
  initialMaintenance
} from './mockData';
import { VehicleStatus, DriverStatus, TripStatus } from './contracts';

const API_BASE_URL = 'http://localhost:8000/api';

// Check if we should use mock or live API
let useMocks = localStorage.getItem('transitops_use_mocks') !== 'false';

// Helper to initialize localStorage for mock data
const initLocalStorage = () => {
  if (!localStorage.getItem('transitops_vehicles')) {
    localStorage.setItem('transitops_vehicles', JSON.stringify(initialVehicles));
  }
  if (!localStorage.getItem('transitops_drivers')) {
    localStorage.setItem('transitops_drivers', JSON.stringify(initialDrivers));
  }
  if (!localStorage.getItem('transitops_trips')) {
    localStorage.setItem('transitops_trips', JSON.stringify(initialTrips));
  }
  if (!localStorage.getItem('transitops_maintenance')) {
    localStorage.setItem('transitops_maintenance', JSON.stringify(initialMaintenance));
  }
  if (!localStorage.getItem('transitops_auth')) {
    localStorage.setItem('transitops_auth', JSON.stringify({
      token: 'mock-jwt-token-xyz',
      user: {
        email: 'manager@transitops.com',
        name: 'Palak Bhatt',
        role: 'fleet_manager'
      }
    }));
  }
};

initLocalStorage();

// Getters and setters for mock storage
const getMockData = (key) => JSON.parse(localStorage.getItem(key));
const setMockData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

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
  isMock: () => useMocks,
  setMock: (val) => {
    useMocks = val;
    localStorage.setItem('transitops_use_mocks', val ? 'true' : 'false');
  },

  auth: {
    login: async (email, password) => {
      if (useMocks) {
        // Mock authentication based on email
        const role = email.includes('driver') ? 'driver' : 
                     email.includes('safety') ? 'safety_officer' :
                     email.includes('finance') ? 'financial_analyst' : 'fleet_manager';
        const name = role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const authData = {
          token: 'mock-jwt-token-xyz',
          user: { email, name, role }
        };
        localStorage.setItem('transitops_auth', JSON.stringify(authData));
        return authData;
      }
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
      if (useMocks) {
        return getMockData('transitops_vehicles');
      }
      const res = await api.get('/vehicles');
      return res.data;
    },
    create: async (data) => {
      if (useMocks) {
        const vehicles = getMockData('transitops_vehicles');
        // Validate uniqueness of registration number
        const exists = vehicles.some(v => v.registration_number.toLowerCase() === data.registration_number.toLowerCase());
        if (exists) {
          throw new Error('VEHICLE_REG_DUPLICATE: Registration number already exists.');
        }
        const newVehicle = { ...data, id: `veh_${Date.now()}` };
        vehicles.push(newVehicle);
        setMockData('transitops_vehicles', vehicles);
        return newVehicle;
      }
      const res = await api.post('/vehicles', data);
      return res.data;
    },
    update: async (id, data) => {
      if (useMocks) {
        const vehicles = getMockData('transitops_vehicles');
        const index = vehicles.findIndex(v => v.id === id);
        if (index === -1) throw new Error('Vehicle not found');
        // Check uniqueness for registration number if changed
        const exists = vehicles.some(v => v.id !== id && v.registration_number.toLowerCase() === data.registration_number.toLowerCase());
        if (exists) {
          throw new Error('VEHICLE_REG_DUPLICATE: Registration number already exists.');
        }
        vehicles[index] = { ...vehicles[index], ...data };
        setMockData('transitops_vehicles', vehicles);
        return vehicles[index];
      }
      const res = await api.put(`/vehicles/${id}`, data);
      return res.data;
    },
    delete: async (id) => {
      if (useMocks) {
        const vehicles = getMockData('transitops_vehicles');
        const updated = vehicles.filter(v => v.id !== id);
        setMockData('transitops_vehicles', updated);
        return true;
      }
      await api.delete(`/vehicles/${id}`);
      return true;
    }
  },

  drivers: {
    getAll: async () => {
      if (useMocks) {
        return getMockData('transitops_drivers');
      }
      const res = await api.get('/drivers');
      return res.data;
    },
    create: async (data) => {
      if (useMocks) {
        const drivers = getMockData('transitops_drivers');
        const newDriver = { ...data, id: `drv_${Date.now()}` };
        drivers.push(newDriver);
        setMockData('transitops_drivers', drivers);
        return newDriver;
      }
      const res = await api.post('/drivers', data);
      return res.data;
    },
    update: async (id, data) => {
      if (useMocks) {
        const drivers = getMockData('transitops_drivers');
        const index = drivers.findIndex(d => d.id === id);
        if (index === -1) throw new Error('Driver not found');
        drivers[index] = { ...drivers[index], ...data };
        setMockData('transitops_drivers', drivers);
        return drivers[index];
      }
      const res = await api.put(`/drivers/${id}`, data);
      return res.data;
    },
    delete: async (id) => {
      if (useMocks) {
        const drivers = getMockData('transitops_drivers');
        const updated = drivers.filter(d => d.id !== id);
        setMockData('transitops_drivers', updated);
        return true;
      }
      await api.delete(`/drivers/${id}`);
      return true;
    }
  },

  trips: {
    getAll: async () => {
      if (useMocks) {
        return getMockData('transitops_trips');
      }
      const res = await api.get('/trips');
      return res.data;
    },
    create: async (data) => {
      if (useMocks) {
        // Business validation in mocks
        const vehicles = getMockData('transitops_vehicles');
        const vehicle = vehicles.find(v => v.id === data.vehicle_id);
        if (vehicle && data.cargo_weight_kg > vehicle.max_load_kg) {
          throw new Error(`TRIP_VALIDATION_ERROR: Cargo weight (${data.cargo_weight_kg}kg) exceeds vehicle maximum capacity (${vehicle.max_load_kg}kg).`);
        }

        const drivers = getMockData('transitops_drivers');
        const driver = drivers.find(d => d.id === data.driver_id);
        if (driver) {
          const isExpired = new Date(driver.license_expiry) < new Date('2026-07-12');
          if (isExpired) {
            throw new Error(`TRIP_VALIDATION_ERROR: Selected driver (${driver.name}) has an expired license.`);
          }
          if (driver.status === DriverStatus.SUSPENDED) {
            throw new Error(`TRIP_VALIDATION_ERROR: Selected driver (${driver.name}) is currently Suspended.`);
          }
        }

        const newTrip = {
          ...data,
          id: `trip_${Date.now()}`,
          status: TripStatus.DRAFT,
          dispatched_at: null,
          completed_at: null
        };
        const trips = getMockData('transitops_trips');
        trips.push(newTrip);
        setMockData('transitops_trips', trips);
        return newTrip;
      }
      const res = await api.post('/trips', {
        ...data,
        status: data.status || TripStatus.DRAFT
      });
      return res.data;
    },
    dispatch: async (id) => {
      if (useMocks) {
        const trips = getMockData('transitops_trips');
        const index = trips.findIndex(t => t.id === id);
        if (index === -1) throw new Error('Trip not found');

        const vehicles = getMockData('transitops_vehicles');
        const vehicle = vehicles.find(v => v.id === trips[index].vehicle_id);
        if (vehicle && vehicle.status === VehicleStatus.IN_SHOP) {
          throw new Error('TRIP_VALIDATION_ERROR: Cannot dispatch. Selected vehicle is currently in maintenance.');
        }

        trips[index].status = TripStatus.DISPATCHED;
        trips[index].dispatched_at = new Date().toISOString();
        setMockData('transitops_trips', trips);

        // Update vehicle and driver status to ON_TRIP
        if (vehicle) {
          vehicle.status = VehicleStatus.ON_TRIP;
          setMockData('transitops_vehicles', vehicles);
        }
        const drivers = getMockData('transitops_drivers');
        const driver = drivers.find(d => d.id === trips[index].driver_id);
        if (driver) {
          driver.status = DriverStatus.ON_TRIP;
          setMockData('transitops_drivers', drivers);
        }

        return trips[index];
      }
      const res = await api.post(`/trips/${id}/dispatch`);
      return res.data;
    },
    complete: async (id) => {
      if (useMocks) {
        const trips = getMockData('transitops_trips');
        const index = trips.findIndex(t => t.id === id);
        if (index === -1) throw new Error('Trip not found');
        trips[index].status = TripStatus.COMPLETED;
        trips[index].completed_at = new Date().toISOString();
        setMockData('transitops_trips', trips);

        // Update vehicle and driver status to AVAILABLE
        const vehicles = getMockData('transitops_vehicles');
        const vehicle = vehicles.find(v => v.id === trips[index].vehicle_id);
        if (vehicle) {
          vehicle.status = VehicleStatus.AVAILABLE;
          setMockData('transitops_vehicles', vehicles);
        }
        const drivers = getMockData('transitops_drivers');
        const driver = drivers.find(d => d.id === trips[index].driver_id);
        if (driver) {
          driver.status = DriverStatus.AVAILABLE;
          setMockData('transitops_drivers', drivers);
        }

        return trips[index];
      }
      const res = await api.post(`/trips/${id}/complete`);
      return res.data;
    },
    cancel: async (id) => {
      if (useMocks) {
        const trips = getMockData('transitops_trips');
        const index = trips.findIndex(t => t.id === id);
        if (index === -1) throw new Error('Trip not found');
        trips[index].status = TripStatus.CANCELLED;
        setMockData('transitops_trips', trips);

        // Update vehicle and driver status to AVAILABLE
        const vehicles = getMockData('transitops_vehicles');
        const vehicle = vehicles.find(v => v.id === trips[index].vehicle_id);
        if (vehicle) {
          vehicle.status = VehicleStatus.AVAILABLE;
          setMockData('transitops_vehicles', vehicles);
        }
        const drivers = getMockData('transitops_drivers');
        const driver = drivers.find(d => d.id === trips[index].driver_id);
        if (driver) {
          driver.status = DriverStatus.AVAILABLE;
          setMockData('transitops_drivers', drivers);
        }

        return trips[index];
      }
      const res = await api.post(`/trips/${id}/cancel`);
      return res.data;
    }
  },

  maintenance: {
    getAll: async () => {
      if (useMocks) {
        return getMockData('transitops_maintenance');
      }
      const res = await api.get('/maintenance');
      return res.data;
    },
    create: async (data) => {
      if (useMocks) {
        const newLog = {
          ...data,
          id: `maint_${Date.now()}`,
          opened_at: new Date().toISOString(),
          closed_at: null
        };
        const logs = getMockData('transitops_maintenance');
        logs.push(newLog);
        setMockData('transitops_maintenance', logs);

        // Put vehicle in maintenance (in_shop)
        const vehicles = getMockData('transitops_vehicles');
        const vehicleIndex = vehicles.findIndex(v => v.id === data.vehicle_id);
        if (vehicleIndex !== -1) {
          vehicles[vehicleIndex].status = VehicleStatus.IN_SHOP;
          setMockData('transitops_vehicles', vehicles);
        }

        return newLog;
      }
      const res = await api.post('/maintenance', {
        ...data,
        opened_at: data.opened_at || new Date().toISOString()
      });
      return res.data;
    },
    closeLog: async (id, cost) => {
      if (useMocks) {
        const logs = getMockData('transitops_maintenance');
        const index = logs.findIndex(l => l.id === id);
        if (index === -1) throw new Error('Maintenance log not found');
        logs[index].closed_at = new Date().toISOString();
        logs[index].cost = parseFloat(cost) || logs[index].cost;
        setMockData('transitops_maintenance', logs);

        // Put vehicle back to available
        const vehicles = getMockData('transitops_vehicles');
        const vehicleIndex = vehicles.findIndex(v => v.id === logs[index].vehicle_id);
        if (vehicleIndex !== -1) {
          vehicles[vehicleIndex].status = VehicleStatus.AVAILABLE;
          setMockData('transitops_vehicles', vehicles);
        }

        return logs[index];
      }
      const res = await api.post(`/maintenance/${id}/close`, { cost });
      return res.data;
    }
  },

  dashboard: {
    getKPIs: async () => {
      if (useMocks) {
        const vehicles = getMockData('transitops_vehicles');
        const drivers = getMockData('transitops_drivers');
        const trips = getMockData('transitops_trips');

        const active_vehicles = vehicles.filter(v => v.status === VehicleStatus.ON_TRIP).length;
        const available_vehicles = vehicles.filter(v => v.status === VehicleStatus.AVAILABLE).length;
        const vehicles_in_maintenance = vehicles.filter(v => v.status === VehicleStatus.IN_SHOP).length;
        const active_trips = trips.filter(t => t.status === TripStatus.DISPATCHED).length;
        const pending_trips = trips.filter(t => t.status === TripStatus.DRAFT).length;
        const drivers_on_duty = drivers.filter(d => d.status === DriverStatus.AVAILABLE || d.status === DriverStatus.ON_TRIP).length;

        const totalVehiclesCount = vehicles.filter(v => v.status !== VehicleStatus.RETIRED).length;
        const fleet_utilization_pct = totalVehiclesCount > 0 ? Math.round((active_vehicles / totalVehiclesCount) * 100) : 0;

        return {
          active_vehicles,
          available_vehicles,
          vehicles_in_maintenance,
          active_trips,
          pending_trips,
          drivers_on_duty,
          fleet_utilization_pct
        };
      }
      const res = await api.get('/dashboard/kpis');
      return res.data;
    }
  }
};
