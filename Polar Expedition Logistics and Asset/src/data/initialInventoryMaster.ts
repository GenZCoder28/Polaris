import { 
  InvItemMasterRecord, 
  InvTransactionRecord, 
  ResponsibleOfficerContact,
  ForecastResult 
} from '../types.ts';

// 1. Initial Station Inventory Items Master
export const INITIAL_INVENTORY_MASTER: InvItemMasterRecord[] = [
  // --- BHARATI STATION ---
  {
    id: 1,
    item_code: 'INV-BH-DSL',
    item_name: 'Polar High-Pour-Point Diesel',
    category: 'Fuel',
    description: 'Ultra-low-temperature winterized Arctic-grade diesel for station generators and snowcat fleet.',
    unit: 'L',
    station_id: 'bharati',
    expedition_id: 'EXP-2025-044',
    current_quantity: 7850,
    minimum_stock: 4000,
    safety_stock: 3000,
    maximum_capacity: 50000,
    reorder_level: 9000,
    expiry_date: '2028-12-31',
    status: 'LOW',
    created_at: '2025-11-15T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z',
  },
  {
    id: 2,
    item_code: 'INV-BH-FOOD',
    item_name: 'High-Calorie Polar Ration Packs',
    category: 'Food',
    description: 'Freeze-dried and vacuum-sealed rations, fortified vitamins (3800 kcal/person/day requirement).',
    unit: 'kg',
    station_id: 'bharati',
    expedition_id: 'EXP-2025-044',
    current_quantity: 2500,
    minimum_stock: 1200,
    safety_stock: 1000,
    maximum_capacity: 10000,
    reorder_level: 2000,
    expiry_date: '2027-06-30',
    status: 'NORMAL',
    created_at: '2025-11-15T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z',
  },
  {
    id: 3,
    item_code: 'INV-BH-WTR',
    item_name: 'Potable Water Reserve (Desal/Melted)',
    category: 'Water',
    description: 'Treated fresh drinking water buffer stored in heated utility reservoir tanks.',
    unit: 'L',
    station_id: 'bharati',
    expedition_id: 'EXP-2025-044',
    current_quantity: 12500,
    minimum_stock: 5000,
    safety_stock: 4000,
    maximum_capacity: 40000,
    reorder_level: 8000,
    expiry_date: null,
    status: 'NORMAL',
    created_at: '2025-11-15T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z',
  },
  {
    id: 4,
    item_code: 'INV-BH-MED',
    item_name: 'Trauma & Hypothermia Injectables Kits',
    category: 'Medical supplies',
    description: 'Emergency epinephrine, IV plasma volume expanders, oxygen cylinders, thermal shock wraps.',
    unit: 'kits',
    station_id: 'bharati',
    expedition_id: 'EXP-2025-044',
    current_quantity: 85,
    minimum_stock: 30,
    safety_stock: 25,
    maximum_capacity: 250,
    reorder_level: 40,
    expiry_date: '2026-10-15', // Near expiry warning
    status: 'LOW',
    created_at: '2025-11-15T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z',
  },
  {
    id: 5,
    item_code: 'INV-BH-BAT',
    item_name: 'Deep-Cycle Lithium Iron Phosphate Cells',
    category: 'Batteries',
    description: 'Solar microgrid buffer battery storage cells rated for -50°C thermal stability.',
    unit: 'cells',
    station_id: 'bharati',
    expedition_id: 'EXP-2025-044',
    current_quantity: 48,
    minimum_stock: 20,
    safety_stock: 16,
    maximum_capacity: 120,
    reorder_level: 30,
    expiry_date: '2030-01-01',
    status: 'NORMAL',
    created_at: '2025-11-15T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z',
  },
  {
    id: 6,
    item_code: 'INV-BH-SCI',
    item_name: 'Ice Core Cryo-Preservation Gas (LN2)',
    category: 'Scientific consumables',
    description: 'Liquid nitrogen vacuum dewars for storing deep ice core paleoclimate drill samples.',
    unit: 'cylinders',
    station_id: 'bharati',
    expedition_id: 'EXP-2025-044',
    current_quantity: 14,
    minimum_stock: 10,
    safety_stock: 8,
    maximum_capacity: 40,
    reorder_level: 15,
    expiry_date: '2027-12-31',
    status: 'LOW',
    created_at: '2025-11-15T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z',
  },

  // --- MAITRI STATION ---
  {
    id: 7,
    item_code: 'INV-MT-DSL',
    item_name: 'Polar High-Pour-Point Diesel',
    category: 'Fuel',
    description: 'Generator fuel for Main Station Powerhouse & Snowcat operations in Schirmacher Oasis.',
    unit: 'L',
    station_id: 'maitri',
    expedition_id: 'EXP-2025-044',
    current_quantity: 5200,
    minimum_stock: 3500,
    safety_stock: 2500,
    maximum_capacity: 45000,
    reorder_level: 7000,
    expiry_date: '2028-12-31',
    status: 'LOW',
    created_at: '2025-11-15T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z',
  },
  {
    id: 8,
    item_code: 'INV-MT-FOOD',
    item_name: 'Dry Rations & Freeze-Dried Provisions',
    category: 'Food',
    description: 'Rice, wheat grains, dehydrated lentils, protein blocks for Maitri winter crew.',
    unit: 'kg',
    station_id: 'maitri',
    expedition_id: 'EXP-2025-044',
    current_quantity: 3400,
    minimum_stock: 1000,
    safety_stock: 800,
    maximum_capacity: 8000,
    reorder_level: 1800,
    expiry_date: '2027-08-30',
    status: 'NORMAL',
    created_at: '2025-11-15T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z',
  },
  {
    id: 9,
    item_code: 'INV-MT-WTR',
    item_name: 'Priyadarshini Lake Pumped Freshwater',
    category: 'Water',
    description: 'Piped freshwater from glacial melt lake with trace heating insulation line.',
    unit: 'L',
    station_id: 'maitri',
    expedition_id: 'EXP-2025-044',
    current_quantity: 900,
    minimum_stock: 1200,
    safety_stock: 1000,
    maximum_capacity: 15000,
    reorder_level: 2500,
    expiry_date: null,
    status: 'CRITICAL',
    created_at: '2025-11-15T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z',
  },
  {
    id: 10,
    item_code: 'INV-MT-CLN',
    item_name: 'Eco-Degradable Biocide Cleaning Sanitizers',
    category: 'Cleaning supplies',
    description: 'Antarctic Protocol Annex III compliant zero-phosphate sanitizing agents.',
    unit: 'litres',
    station_id: 'maitri',
    expedition_id: 'EXP-2025-044',
    current_quantity: 320,
    minimum_stock: 100,
    safety_stock: 80,
    maximum_capacity: 800,
    reorder_level: 180,
    expiry_date: '2027-04-01',
    status: 'NORMAL',
    created_at: '2025-11-15T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z',
  },

  // --- HIMADRI ARCTIC STATION ---
  {
    id: 11,
    item_code: 'INV-HM-FUEL',
    item_name: 'Arctic Synthetic Jet-A1/Kerosene',
    category: 'Fuel',
    description: 'High-purity Arctic fuel for heating boilers and Ny-Ålesund snowmobile fleet.',
    unit: 'L',
    station_id: 'himadri',
    expedition_id: 'EXP-2026-002',
    current_quantity: 4100,
    minimum_stock: 1500,
    safety_stock: 1200,
    maximum_capacity: 12000,
    reorder_level: 2800,
    expiry_date: '2028-09-15',
    status: 'NORMAL',
    created_at: '2026-02-10T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z',
  },
  {
    id: 12,
    item_code: 'INV-HM-MED',
    item_name: 'Svalbard Arctic Hypothermia First Aid Packs',
    category: 'Medical supplies',
    description: 'Emergency med-packs compliant with Kings Bay polar safety codes.',
    unit: 'packs',
    station_id: 'himadri',
    expedition_id: 'EXP-2026-002',
    current_quantity: 42,
    minimum_stock: 20,
    safety_stock: 15,
    maximum_capacity: 100,
    reorder_level: 25,
    expiry_date: '2027-01-20',
    status: 'NORMAL',
    created_at: '2026-02-10T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z',
  }
];

// 2. India-Based Responsible Logistics Officers Roster
export const RESPONSIBLE_LOGISTICS_OFFICERS: ResponsibleOfficerContact[] = [
  {
    stationId: 'bharati',
    stationName: 'Bharati Antarctic Station (Larsemann Hills)',
    responsibleOrganization: 'NCPOR Central Polar Logistics Division, Ministry of Earth Sciences',
    role: 'Chief Logistics & Inventory Controller (Antarctica)',
    officerName: 'Dr. Rajesh Sharma, Sc-G',
    email: 'logistics.bharati@ncpor.gov.in',
    phone: '+91-832-2525600',
    location: 'Headland Sada, Vasco-da-Gama, Goa 403804, India',
  },
  {
    stationId: 'maitri',
    stationName: 'Maitri Antarctic Station (Schirmacher Oasis)',
    responsibleOrganization: 'NCPOR Central Polar Logistics Division, Ministry of Earth Sciences',
    role: 'Senior Polar Supply Officer (Maitri Operations)',
    officerName: 'Shri Arvind Verma, Sc-E',
    email: 'logistics.maitri@ncpor.gov.in',
    phone: '+91-832-2525605',
    location: 'Headland Sada, Vasco-da-Gama, Goa 403804, India',
  },
  {
    stationId: 'himadri',
    stationName: 'Himadri Arctic Station (Ny-Ålesund, Svalbard)',
    responsibleOrganization: 'NCPOR Arctic Research Operations Cell',
    role: 'Arctic Logistics Coordinator',
    officerName: 'Dr. K. S. Murthy, Sc-F',
    email: 'arctic.logistics@ncpor.res.in',
    phone: '+91-832-2525612',
    location: 'Headland Sada, Vasco-da-Gama, Goa 403804, India',
  }
];

// Helper to seed 30 days of realistic historical transactions for Bharati Diesel and others
export function generateSeedTransactions(): InvTransactionRecord[] {
  const transactions: InvTransactionRecord[] = [];
  let txId = 1;

  // Bharati Opening stock
  transactions.push({
    id: txId++,
    inventory_item_id: 1,
    transaction_type: 'OPENING_STOCK',
    quantity: 45000,
    timestamp: '2026-08-10T08:00:00.000Z',
    reason: 'Opening seasonal audit balance prior to winter-over operations.',
    reference_type: 'AUDIT',
    reference_id: 'AUD-BH-2026-01',
    performed_by: 'Dr. Rajesh Sharma (Goa HQ)',
    notes: 'Verified against ultrasonic tank dip sticks.',
    created_at: '2026-08-10T08:00:00.000Z',
  });

  // 30 days of diesel daily consumption at Bharati (1,200 to 1,500 L/day, personnel 50)
  const baseDieselConsumptions = [
    1240, 1310, 1280, 1420, 1390, 1450, 1330,
    1410, 1480, 1360, 1440, 1500, 1420, 1380,
    1390, 1470, 1430, 1510, 1490, 1420, 1350,
    1460, 1490, 1430, 1520, 1470, 1480, 1450, 1470, 1465
  ];

  let currentStockTracker = 45000;
  // Step back 30 days
  const now = new Date('2026-09-11T12:00:00.000Z');

  baseDieselConsumptions.forEach((consumed, idx) => {
    const daysAgo = 30 - idx;
    const txDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    currentStockTracker -= consumed;

    transactions.push({
      id: txId++,
      inventory_item_id: 1,
      transaction_type: 'CONSUMPTION',
      quantity: -consumed,
      timestamp: txDate,
      reason: `Daily station power generator run & auxiliary HVAC (Personnel: 50, Temp: -28°C)`,
      reference_type: 'DAILY_LOG',
      reference_id: `LOG-BH-GEN-${idx + 1}`,
      performed_by: 'Station Engineer (Bharati)',
      notes: `Generators G1 and G2 parallel load. Consumption: ${consumed} L.`,
      created_at: txDate,
    });
  });

  // Food Opening Stock & Consumption for Bharati
  transactions.push({
    id: txId++,
    inventory_item_id: 2,
    transaction_type: 'OPENING_STOCK',
    quantity: 6500,
    timestamp: '2026-08-10T08:00:00.000Z',
    reason: 'Initial storage chamber stock verification.',
    reference_type: 'AUDIT',
    reference_id: 'AUD-BH-FOOD-01',
    performed_by: 'Galley Officer (Bharati)',
    notes: 'Packs intact in deep-freeze shelter.',
    created_at: '2026-08-10T08:00:00.000Z',
  });

  // 30 days of food (avg ~100-140 kg/day for 50 personnel, ~2.0 - 2.8 kg/person/day)
  for (let i = 0; i < 30; i++) {
    const daysAgo = 30 - i;
    const txDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const foodConsumed = 135 + (i % 5) * 3; // around 135 - 147 kg/day
    transactions.push({
      id: txId++,
      inventory_item_id: 2,
      transaction_type: 'CONSUMPTION',
      quantity: -foodConsumed,
      timestamp: txDate,
      reason: `Station galley rations distribution (50 personnel active)`,
      reference_type: 'EXPEDITION_PERSONNEL',
      reference_id: `PERS-BH-GALLEY-${i + 1}`,
      performed_by: 'Chef & Mess Coordinator',
      notes: `Breakfast, field traverse packs, and hot dinner.`,
      created_at: txDate,
    });
  }

  // Maitri Water Opening & Consumption
  transactions.push({
    id: txId++,
    inventory_item_id: 9,
    transaction_type: 'OPENING_STOCK',
    quantity: 3500,
    timestamp: '2026-08-20T08:00:00.000Z',
    reason: 'Priyadarshini lake pump buffer tank level.',
    reference_type: 'AUDIT',
    reference_id: 'AUD-MT-WTR-01',
    performed_by: 'Water Tech (Maitri)',
    notes: 'Lake line iced up, reserve depleting.',
    created_at: '2026-08-20T08:00:00.000Z',
  });

  for (let i = 0; i < 22; i++) {
    const daysAgo = 22 - i;
    const txDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const waterConsumed = 110 + (i % 3) * 5;
    transactions.push({
      id: txId++,
      inventory_item_id: 9,
      transaction_type: 'CONSUMPTION',
      quantity: -waterConsumed,
      timestamp: txDate,
      reason: `Station domestic sanitation & galley consumption`,
      reference_type: 'DAILY_LOG',
      reference_id: `LOG-MT-WTR-${i + 1}`,
      performed_by: 'Station Plumber',
      notes: `Consumption rate: ${waterConsumed} L/day`,
      created_at: txDate,
    });
  }

  return transactions;
}
