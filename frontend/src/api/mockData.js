import { VehicleStatus, DriverStatus, TripStatus } from './contracts';

export const initialVehicles = [
  {
    id: 'veh_1',
    registration_number: 'TX-987-AB',
    model: 'Volvo FH16 Semi',
    type: 'Heavy Truck',
    max_load_kg: 25000,
    odometer: 145200,
    acquisition_cost: 125000.00,
    region: 'Southwest',
    status: VehicleStatus.AVAILABLE
  },
  {
    id: 'veh_2',
    registration_number: 'CA-456-XY',
    model: 'Freightliner M2 Box',
    type: 'Box Truck',
    max_load_kg: 10000,
    odometer: 89000,
    acquisition_cost: 75000.00,
    region: 'West Coast',
    status: VehicleStatus.AVAILABLE
  },
  {
    id: 'veh_3',
    registration_number: 'NY-123-CD',
    model: 'Ford Transit Cargo',
    type: 'Cargo Van',
    max_load_kg: 3500,
    odometer: 42100,
    acquisition_cost: 45000.00,
    region: 'Northeast',
    status: VehicleStatus.ON_TRIP
  },
  {
    id: 'veh_4',
    registration_number: 'FL-789-EF',
    model: 'Peterbilt 389 Flatbed',
    type: 'Flatbed',
    max_load_kg: 20000,
    odometer: 210000,
    acquisition_cost: 135000.00,
    region: 'Southeast',
    status: VehicleStatus.IN_SHOP
  },
  {
    id: 'veh_5',
    registration_number: 'IL-321-GH',
    model: 'Rivian EDV 700',
    type: 'Electric Van',
    max_load_kg: 2500,
    odometer: 15400,
    acquisition_cost: 83000.00,
    region: 'Midwest',
    status: VehicleStatus.AVAILABLE
  },
  {
    id: 'veh_6',
    registration_number: 'WA-555-ZZ',
    model: 'Chevrolet Express 3500',
    type: 'Cargo Van',
    max_load_kg: 4000,
    odometer: 320000,
    acquisition_cost: 38000.00,
    region: 'Northwest',
    status: VehicleStatus.RETIRED
  }
];

export const initialDrivers = [
  {
    id: 'drv_1',
    name: 'John Doe',
    license_number: 'DL-TX882910',
    category: 'Class A CDL',
    license_expiry: '2028-11-15',
    contact: '+1-555-0199',
    safety_score: 4.8,
    status: DriverStatus.AVAILABLE
  },
  {
    id: 'drv_2',
    name: 'Jane Smith',
    license_number: 'DL-CA112930',
    category: 'Class A CDL',
    license_expiry: '2027-04-20',
    contact: '+1-555-0144',
    safety_score: 4.9,
    status: DriverStatus.ON_TRIP
  },
  {
    id: 'drv_3',
    name: 'Bob Johnson',
    license_number: 'DL-NY773829',
    category: 'Class B CDL',
    license_expiry: '2026-05-10', // Expired! Current date is 2026-07-12
    contact: '+1-555-0122',
    safety_score: 3.2,
    status: DriverStatus.AVAILABLE
  },
  {
    id: 'drv_4',
    name: 'Alice Williams',
    license_number: 'DL-FL339922',
    category: 'Class A CDL',
    license_expiry: '2029-08-30',
    contact: '+1-555-0177',
    safety_score: 4.5,
    status: DriverStatus.OFF_DUTY
  },
  {
    id: 'drv_5',
    name: 'Charlie Brown',
    license_number: 'DL-IL992211',
    category: 'Class C',
    license_expiry: '2027-10-12',
    contact: '+1-555-0188',
    safety_score: 2.1,
    status: DriverStatus.SUSPENDED
  }
];

export const initialTrips = [
  {
    id: 'trip_1',
    vehicle_id: 'veh_3',
    driver_id: 'drv_2',
    origin: 'New York, NY',
    destination: 'Boston, MA',
    cargo_weight_kg: 1200.0,
    status: TripStatus.DISPATCHED,
    dispatched_at: '2026-07-12T08:00:00.000Z',
    completed_at: null
  },
  {
    id: 'trip_2',
    vehicle_id: 'veh_1',
    driver_id: 'drv_1',
    origin: 'Chicago, IL',
    destination: 'Detroit, MI',
    cargo_weight_kg: 18500.0,
    status: TripStatus.COMPLETED,
    dispatched_at: '2026-07-11T09:00:00.000Z',
    completed_at: '2026-07-11T14:30:00.000Z'
  },
  {
    id: 'trip_3',
    vehicle_id: 'veh_2',
    driver_id: 'drv_4',
    origin: 'Los Angeles, CA',
    destination: 'San Francisco, CA',
    cargo_weight_kg: 5000.0,
    status: TripStatus.DRAFT,
    dispatched_at: null,
    completed_at: null
  }
];

export const initialMaintenance = [
  {
    id: 'maint_1',
    vehicle_id: 'veh_4',
    service_type: 'Engine Overhaul & Oil Change',
    cost: 1200.00,
    opened_at: '2026-07-10T08:00:00.000Z',
    closed_at: null
  },
  {
    id: 'maint_2',
    vehicle_id: 'veh_2',
    service_type: 'Brake Pad Replacement & Tire Rotation',
    cost: 450.00,
    opened_at: '2026-07-05T10:00:00.000Z',
    closed_at: '2026-07-05T15:00:00.000Z'
  }
];
