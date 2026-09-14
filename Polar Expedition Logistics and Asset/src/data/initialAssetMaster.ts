import { 
  AssetMasterRecord, 
  AssetAssignmentRecord, 
  AssetTransferRecord, 
  AssetMaintenanceRecord, 
  AssetIncidentRecord, 
  AssetPredictionRecord, 
  AssetSupplyRequestRecord, 
  AssetNotificationRecord, 
  ResponsibleAssetOfficerConfig 
} from '../types.ts';

// -------------------------------------------------------------
// RESPONSIBLE LOGISTICS OFFICERS CONFIGURATION (INDIA HQ)
// -------------------------------------------------------------
export const RESPONSIBLE_ASSET_OFFICER_CONFIG: ResponsibleAssetOfficerConfig = {
  department: 'Polar Heavy Engineering & Scientific Assets Directorate, NCPOR Goa',
  officer_name: 'Shri Alok Mukherjee, Chief Logistics & Asset Controller',
  email: 'alok.mukherjee@ncpor.gov.in',
  phone: '+91-832-2525600',
  notification_preferences: {
    email: true,
    sms: true,
    inApp: true
  }
};

export const RESPONSIBLE_FOOD_OFFICER_CONFIG = {
  department: 'Polar Provisioning & Victualing Division, NCPOR Goa',
  officer_name: 'Dr. Savita Ranganathan, Joint Director Provisions',
  email: 'savita.ranganathan@ncpor.gov.in',
  phone: '+91-832-2525612'
};

// -------------------------------------------------------------
// INITIAL REUSABLE EXPEDITION ASSETS
// (Strictly reusable equipment: NOT food, fuel, or water)
// -------------------------------------------------------------
export const INITIAL_ASSETS_MASTER: AssetMasterRecord[] = [
  // 1. Portable & Power Generation Assets
  {
    id: 1,
    asset_id: 'AST-001',
    asset_name: 'Cummins 250kVA Polar Diesel Generator #1',
    asset_category: 'Generators',
    asset_type: '250kVA Heavy Arctic Genset',
    serial_number: 'CUM-2023-POL-9921',
    manufacturer: 'Cummins Power Systems',
    model: 'QSB7-G5 Arctic Spec',
    description: 'Primary baseline station powerhouse generator with block pre-heaters and automated katabatic fuel scrubbers.',
    expedition_id: 'EXP-2025-044',
    assigned_station: 'bharati',
    assigned_team: 'Power & Utilities Team',
    assigned_personnel: 'Vikram Malhotra',
    current_location: 'Bharati Station - Generator Hall',
    acquisition_date: '2023-11-10',
    commission_date: '2023-12-05',
    expected_lifetime: '12,000 hrs',
    condition: 'GOOD',
    status: 'IN_USE',
    last_maintenance_date: '2026-08-15',
    next_maintenance_date: '2026-09-18', // approaching!
    operating_hours: 4850,
    maintenance_threshold_hours: 5000,
    vibration_index: 3.2,
    health_score: 94,
    notes: 'Base power unit for Bharati Station. Serviced every 500 running hours.',
    created_at: '2023-11-10T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z'
  },
  {
    id: 2,
    asset_id: 'AST-002',
    asset_name: 'Kirloskar 45kVA Mobile Camp Generator',
    asset_category: 'Generators',
    asset_type: 'Mobile Arctic Field Genset',
    serial_number: 'KIR-2024-POL-4412',
    manufacturer: 'Kirloskar Oil Engines',
    model: 'KG938WS Polar Special',
    description: 'Sled-mounted diesel generator equipped with insulated canopy for temporary scientific drill traverses.',
    expedition_id: 'EXP-2025-044',
    assigned_station: 'bharati',
    assigned_team: 'Field Operations Team',
    assigned_personnel: 'Rajesh Nair',
    current_location: 'Field Camp A (Larsemann Hills)',
    acquisition_date: '2024-01-14',
    commission_date: '2024-02-01',
    expected_lifetime: '8,000 hrs',
    condition: 'FAIR',
    status: 'IN_USE',
    last_maintenance_date: '2026-07-20',
    next_maintenance_date: '2026-09-15', // due in 3 days! (Section 11 example)
    operating_hours: 2190,
    maintenance_threshold_hours: 2250,
    vibration_index: 6.8,
    health_score: 78,
    notes: 'Minor exhaust heat-shield rattle observed during last field run.',
    created_at: '2024-01-14T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z'
  },
  {
    id: 3,
    asset_id: 'AST-003',
    asset_name: 'Honda 5kVA Ultra-Quiet Emergency Inverter Genset',
    asset_category: 'Generators',
    asset_type: 'Portable Inverter Generator',
    serial_number: 'HON-EU7000IS-301',
    manufacturer: 'Honda Motor Co.',
    model: 'EU7000is Polar Modified',
    description: 'Emergency backup electrical source for medical ward and comms room cold starts.',
    expedition_id: 'EXP-2025-044',
    assigned_station: 'bharati',
    assigned_team: 'Power & Utilities Team',
    assigned_personnel: 'Vikram Malhotra',
    current_location: 'Bharati Station - Emergency Depot',
    acquisition_date: '2024-10-05',
    commission_date: '2024-11-01',
    expected_lifetime: '5,000 hrs',
    condition: 'EXCELLENT',
    status: 'AVAILABLE',
    last_maintenance_date: '2026-08-30',
    next_maintenance_date: '2026-11-30',
    operating_hours: 320,
    maintenance_threshold_hours: 1000,
    vibration_index: 1.1,
    health_score: 99,
    notes: 'Tested monthly under simulated blackout test protocols.',
    created_at: '2024-10-05T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z'
  },
  // 2. Snow Vehicles & Transport Fleet
  {
    id: 4,
    asset_id: 'AST-004',
    asset_name: 'PistenBully 300 Polar Tracked Snowcat #1',
    asset_category: 'Snow vehicles',
    asset_type: 'Heavy Tracked Snow Groomer/Tractor',
    serial_number: 'PB300-POL-8812',
    manufacturer: 'Kässbohrer Geländefahrzeug AG',
    model: 'PistenBully 300 Polar Winch',
    description: 'Heavy tracked transport snow vehicle for freight sled towing, crevasse safety, and airstrip compaction.',
    expedition_id: 'EXP-2025-044',
    assigned_station: 'bharati',
    assigned_team: 'Logistics & Field Ops',
    assigned_personnel: 'Arun Joshi',
    current_location: 'Bharati Station - Main Hangar',
    acquisition_date: '2022-09-20',
    commission_date: '2022-12-10',
    expected_lifetime: '10,000 hrs',
    condition: 'GOOD',
    status: 'IN_USE',
    last_maintenance_date: '2026-08-10',
    next_maintenance_date: '2026-10-10',
    operating_hours: 3410,
    maintenance_threshold_hours: 3600,
    vibration_index: 4.1,
    health_score: 89,
    notes: 'Tracks tensioned and hydraulic fluid sampled for winter protocol.',
    created_at: '2022-09-20T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z'
  },
  {
    id: 5,
    asset_id: 'AST-005',
    asset_name: 'Lynx 69 Ranger 900 ACE Polar Skidoo #A',
    asset_category: 'Snow vehicles',
    asset_type: 'Light Utility Snowmobile',
    serial_number: 'BRP-LYNX-2024-912',
    manufacturer: 'BRP Finland',
    model: '69 Ranger Snowmobile',
    description: 'High-flotation utility snowmobile for fast scientist transport and crevasse rescue patrols.',
    expedition_id: 'EXP-2025-044',
    assigned_station: 'bharati',
    assigned_team: 'Scientific Core',
    assigned_personnel: 'Dr. Priya Sharma',
    current_location: 'Field Camp A (Larsemann)',
    acquisition_date: '2024-09-15',
    commission_date: '2024-11-20',
    expected_lifetime: '4,000 hrs',
    condition: 'FAIR',
    status: 'ASSIGNED',
    last_maintenance_date: '2026-07-15',
    next_maintenance_date: '2026-09-25',
    operating_hours: 890,
    maintenance_threshold_hours: 1000,
    vibration_index: 5.2,
    health_score: 82,
    notes: 'Right ski runner replaced after crossing sastrugi ridge.',
    created_at: '2024-09-15T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z'
  },
  {
    id: 6,
    asset_id: 'AST-006',
    asset_name: 'PistenBully 100 All-Terrain Snowcat #2',
    asset_category: 'Snow vehicles',
    asset_type: 'Medium Utility Snowcat',
    serial_number: 'PB100-POL-4419',
    manufacturer: 'Kässbohrer Geländefahrzeug AG',
    model: 'PB 100 4F',
    description: 'Medium personnel carrier cab snowcat for Schirmacher Oasis research traverses.',
    expedition_id: 'EXP-2025-044',
    assigned_station: 'maitri',
    assigned_team: 'Logistics & Fleet',
    assigned_personnel: 'Sunil Verma',
    current_location: 'Maitri Station - Vehicle Workshop',
    acquisition_date: '2021-08-10',
    commission_date: '2021-11-15',
    expected_lifetime: '9,000 hrs',
    condition: 'POOR',
    status: 'UNDER_MAINTENANCE',
    last_maintenance_date: '2026-09-02',
    next_maintenance_date: '2026-09-16',
    operating_hours: 5890,
    maintenance_threshold_hours: 6000,
    vibration_index: 7.9,
    health_score: 52,
    notes: 'Track drive sprocket teeth worn. In workshop awaiting replacement drive pins from India.',
    created_at: '2021-08-10T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z'
  },
  // 3. Scientific Instruments & Research Equipment
  {
    id: 7,
    asset_id: 'AST-007',
    asset_name: 'Cryo-Drill Hans Tausen Ice Core Drill System',
    asset_category: 'Scientific instruments',
    asset_type: 'Electromechanical Ice Core Drill',
    serial_number: 'HT-DRILL-DK-092',
    manufacturer: 'University of Copenhagen / Polar Spares',
    model: 'HT-4 Deep Corer',
    description: 'Deep electromechanical ice core sampling drill with glycol chip filtration and vacuum core barrels.',
    expedition_id: 'EXP-2025-044',
    assigned_station: 'bharati',
    assigned_team: 'Scientific Core - Paleoclimate',
    assigned_personnel: 'Dr. Ananya Sen',
    current_location: 'Larsemann Hills Glaciology Site C',
    acquisition_date: '2023-08-01',
    commission_date: '2023-12-01',
    expected_lifetime: '8 years',
    condition: 'EXCELLENT',
    status: 'IN_USE',
    last_maintenance_date: '2026-08-25',
    next_maintenance_date: '2026-10-25',
    operating_hours: 740,
    maintenance_threshold_hours: 1200,
    vibration_index: 2.1,
    health_score: 96,
    notes: 'Successfully collected 120m paleoclimate ice core samples.',
    created_at: '2023-08-01T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z'
  },
  {
    id: 8,
    asset_id: 'AST-008',
    asset_name: 'Fourier Transform Infrared Spectrometer (FTIR)',
    asset_category: 'Scientific instruments',
    asset_type: 'Atmospheric Trace Gas Spectrometer',
    serial_number: 'BRK-VERTEX-80V-11',
    manufacturer: 'Bruker Optics',
    model: 'VERTEX 80v Vacuum FTIR',
    description: 'High-resolution atmospheric greenhouse gas interferometer analyzing ozone depletion & stratospheric vortex dynamics.',
    expedition_id: 'EXP-2025-044',
    assigned_station: 'bharati',
    assigned_team: 'Atmospheric Physics Lab',
    assigned_personnel: 'Dr. Priya Sharma',
    current_location: 'Bharati Station - Atmospheric Observatory',
    acquisition_date: '2022-04-12',
    commission_date: '2022-11-28',
    expected_lifetime: '10 years',
    condition: 'GOOD',
    status: 'IN_USE',
    last_maintenance_date: '2026-06-10',
    next_maintenance_date: '2026-12-10',
    operating_hours: 8400,
    maintenance_threshold_hours: 15000,
    vibration_index: 1.4,
    health_score: 91,
    notes: 'Laser alignment stable; detector liquid nitrogen dewar holding nominal pressure.',
    created_at: '2022-04-12T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z'
  },
  // 4. Communication & Radios
  {
    id: 9,
    asset_id: 'AST-009',
    asset_name: 'Cobham Sailor 900 VSAT Maritime/Polar Antenna',
    asset_category: 'Communication equipment',
    asset_type: 'Ku-Band Polar Satellite Terminal',
    serial_number: 'COB-S900-KU-4481',
    manufacturer: 'Cobham SATCOM',
    model: 'Sailor 900 VSAT Ku',
    description: 'De-iced radome stabilized satellite communication link connecting Bharati to NCPOR Goa and INCOIS.',
    expedition_id: 'EXP-2025-044',
    assigned_station: 'bharati',
    assigned_team: 'Comms & IT Corps',
    assigned_personnel: 'Rohan Deshmukh',
    current_location: 'Bharati Station - Roof Radome Tower',
    acquisition_date: '2022-01-18',
    commission_date: '2022-03-02',
    expected_lifetime: '8 years',
    condition: 'GOOD',
    status: 'IN_USE',
    last_maintenance_date: '2026-08-01',
    next_maintenance_date: '2026-11-01',
    operating_hours: 31200,
    maintenance_threshold_hours: 40000,
    vibration_index: 1.8,
    health_score: 93,
    notes: 'Signal-to-noise ratio normal; internal heating coils operating within specs.',
    created_at: '2022-01-18T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z'
  },
  {
    id: 10,
    asset_id: 'AST-010',
    asset_name: 'Motorola MOTOTRBO DP4801e Polar VHF/UHF Base',
    asset_category: 'Radios',
    asset_type: 'Field Tactical DMR Radio Base',
    serial_number: 'MOT-DP4801-9021',
    manufacturer: 'Motorola Solutions',
    model: 'MOTOTRBO DP4801e VHF',
    description: 'High-power encrypted expedition radio transceiver for station-to-traverse convoy safety comms.',
    expedition_id: 'EXP-2025-044',
    assigned_station: 'bharati',
    assigned_team: 'Safety & Emergency',
    assigned_personnel: 'Capt. Rakesh Mehta',
    current_location: 'Field Camp B (Glacier Rim)',
    acquisition_date: '2024-03-10',
    commission_date: '2024-04-01',
    expected_lifetime: '6 years',
    condition: 'CRITICAL',
    status: 'DAMAGED', // Section 12 incident example!
    last_maintenance_date: '2026-07-01',
    next_maintenance_date: '2026-09-14',
    operating_hours: 1450,
    maintenance_threshold_hours: 2000,
    vibration_index: 8.5,
    health_score: 41,
    notes: 'Mast antenna snapped during blizzard katabatic gust (78 knots). Transceiver circuit intact but antenna feeds severed.',
    created_at: '2024-03-10T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z'
  },
  // 5. GPS & Precision Navigation Devices
  {
    id: 11,
    asset_id: 'AST-011',
    asset_name: 'Trimble NetR9 Geodetic GNSS Reference Receiver',
    asset_category: 'GPS devices',
    asset_type: 'Multi-Constellation Geodetic Receiver',
    serial_number: 'TRM-NETR9-98210',
    manufacturer: 'Trimble Navigation',
    model: 'NetR9 Polar GNSS',
    description: 'Continuously operating Antarctic tectonic plate motion reference station with choke ring antenna.',
    expedition_id: 'EXP-2025-044',
    assigned_station: 'bharati',
    assigned_team: 'Geodesy & Survey',
    assigned_personnel: 'Dr. Ananya Sen',
    current_location: 'Bharati Station - GNSS Benchmark Bedrock',
    acquisition_date: '2023-01-20',
    commission_date: '2023-02-15',
    expected_lifetime: '10 years',
    condition: 'EXCELLENT',
    status: 'IN_USE',
    last_maintenance_date: '2026-05-15',
    next_maintenance_date: '2026-11-15',
    operating_hours: 26800,
    maintenance_threshold_hours: 50000,
    vibration_index: 0.8,
    health_score: 98,
    notes: 'Zero cycle slips; solar power buffer stable.',
    created_at: '2023-01-20T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z'
  },
  // 6. Safety & Field Equipment
  {
    id: 12,
    asset_id: 'AST-012',
    asset_name: 'Zodiac Milpro Mark IV Heavy Inflatable Rescue Boat',
    asset_category: 'Safety equipment',
    asset_type: 'Reinforced Polar Inflatable Boat',
    serial_number: 'ZOD-MK4-ICE-3301',
    manufacturer: 'Zodiac Milpro',
    model: 'Mark IV HD Polar Polyurethane',
    description: 'Armored multi-chamber inflatable workboat for sea-ice surveying and marine sampling in Prydz Bay.',
    expedition_id: 'EXP-2025-044',
    assigned_station: 'bharati',
    assigned_team: 'Marine Biology Team',
    assigned_personnel: 'Dr. Suresh Pillai',
    current_location: 'Bharati Station - Marine Jetty Boathouse',
    acquisition_date: '2023-05-10',
    commission_date: '2023-11-10',
    expected_lifetime: '7 years',
    condition: 'GOOD',
    status: 'AVAILABLE',
    last_maintenance_date: '2026-08-01',
    next_maintenance_date: '2026-11-01',
    operating_hours: 420,
    maintenance_threshold_hours: 800,
    vibration_index: 1.5,
    health_score: 92,
    notes: 'Outboard engine winterized with arctic grease.',
    created_at: '2023-05-10T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z'
  },
  // 7. Refrigeration & Cold Storage
  {
    id: 13,
    asset_id: 'AST-013',
    asset_name: 'Thermo Scientific -80°C Ultra-Low Freezer Core',
    asset_category: 'Refrigeration equipment',
    asset_type: 'Ultra-Low Temperature Cryo-Freezer',
    serial_number: 'THM-TSX-90082',
    manufacturer: 'Thermo Fisher Scientific',
    model: 'TSX Series -86°C Cryo',
    description: 'Specialized deep-freeze vault for microbial cryo-preservation and Antarctic lake water core aliquots.',
    expedition_id: 'EXP-2025-044',
    assigned_station: 'bharati',
    assigned_team: 'Bio-Science Core',
    assigned_personnel: 'Dr. Priya Sharma',
    current_location: 'Bharati Station - Clean Lab 2',
    acquisition_date: '2023-09-14',
    commission_date: '2023-12-05',
    expected_lifetime: '10 years',
    condition: 'GOOD',
    status: 'IN_USE',
    last_maintenance_date: '2026-06-20',
    next_maintenance_date: '2026-12-20',
    operating_hours: 19800,
    maintenance_threshold_hours: 30000,
    vibration_index: 2.3,
    health_score: 95,
    notes: 'Dual cascade compressors running at -81.4°C nominal.',
    created_at: '2023-09-14T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z'
  },
  // 8. Maitri Heavy Crane / Specialized Equipment
  {
    id: 14,
    asset_id: 'AST-014',
    asset_name: 'Tadano GR-300XL Rough Terrain Polar Crane',
    asset_category: 'Specialized expedition equipment',
    asset_type: '30-Ton Rough Terrain Crane',
    serial_number: 'TAD-GR300-POL-771',
    manufacturer: 'Tadano Ltd.',
    model: 'GR-300XL Arctic Package',
    description: 'Heavy hydraulic mobile crane for container offloading on fast ice and fuel bladder placement.',
    expedition_id: 'EXP-2025-044',
    assigned_station: 'maitri',
    assigned_team: 'Heavy Engineering',
    assigned_personnel: 'Sunil Verma',
    current_location: 'Maitri Station - Cargo Yard',
    acquisition_date: '2020-03-12',
    commission_date: '2020-11-20',
    expected_lifetime: '15 years',
    condition: 'FAIR',
    status: 'IN_USE',
    last_maintenance_date: '2026-07-10',
    next_maintenance_date: '2026-10-10',
    operating_hours: 4120,
    maintenance_threshold_hours: 4500,
    vibration_index: 5.5,
    health_score: 83,
    notes: 'Hydraulic boom cylinder seals inspected under low-temp glycol heating.',
    created_at: '2020-03-12T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z'
  },
  // 9. Ny-Alesund Arctic Station Asset (Himadri)
  {
    id: 15,
    asset_id: 'AST-015',
    asset_name: 'DJI Matrice 350 RTK Arctic Drone Surveyor',
    asset_category: 'Research equipment',
    asset_type: 'Thermal & Lidar Mapping UAV',
    serial_number: 'DJI-M350-SVAL-004',
    manufacturer: 'DJI Enterprise',
    model: 'Matrice 350 RTK Polar Custom',
    description: 'Self-heating battery drone payload carrying multispectral and thermal sensors for glacier crevasse tracking.',
    expedition_id: 'EXP-2026-002',
    assigned_station: 'himadri',
    assigned_team: 'Arctic Cryosphere Ops',
    assigned_personnel: 'Dr. Arjun Rampal',
    current_location: 'Himadri Station - Ny-Ålesund, Svalbard',
    acquisition_date: '2024-05-18',
    commission_date: '2024-06-10',
    expected_lifetime: '4 years',
    condition: 'EXCELLENT',
    status: 'AVAILABLE',
    last_maintenance_date: '2026-08-20',
    next_maintenance_date: '2026-11-20',
    operating_hours: 210,
    maintenance_threshold_hours: 500,
    vibration_index: 0.9,
    health_score: 99,
    notes: 'Equipped with TB65 battery warming pack for -30°C flight operations.',
    created_at: '2024-05-18T08:00:00.000Z',
    updated_at: '2026-09-11T12:00:00.000Z'
  }
];

// -------------------------------------------------------------
// INITIAL ASSIGNMENT HISTORY LEDGER
// -------------------------------------------------------------
export const INITIAL_ASSET_ASSIGNMENTS: AssetAssignmentRecord[] = [
  {
    id: 1,
    asset_id: 'AST-001',
    assigned_station: 'bharati',
    assigned_team: 'Power & Utilities Team',
    assigned_personnel: 'Vikram Malhotra',
    expedition_id: 'EXP-2025-044',
    assigned_location: 'Bharati Station - Generator Hall',
    assignment_date: '2025-11-15',
    release_date: null,
    assigned_by: 'Expedition Commander Dr. Priya Sharma',
    notes: 'Primary station power assignment for 44th ISEA winter season.',
    created_at: '2025-11-15T09:00:00.000Z'
  },
  {
    id: 2,
    asset_id: 'AST-002',
    assigned_station: 'bharati',
    assigned_team: 'Field Operations Team',
    assigned_personnel: 'Rajesh Nair',
    expedition_id: 'EXP-2025-044',
    assigned_location: 'Field Camp A (Larsemann Hills)',
    assignment_date: '2026-02-10',
    release_date: null,
    assigned_by: 'Expedition Commander Dr. Priya Sharma',
    notes: 'Deployed to Field Camp A to support glaciology core drilling operations.',
    created_at: '2026-02-10T11:00:00.000Z'
  },
  {
    id: 3,
    asset_id: 'AST-010',
    assigned_station: 'bharati',
    assigned_team: 'Safety & Emergency',
    assigned_personnel: 'Capt. Rakesh Mehta',
    expedition_id: 'EXP-2025-044',
    assigned_location: 'Field Camp B (Glacier Rim)',
    assignment_date: '2026-03-01',
    release_date: null,
    assigned_by: 'Safety Officer Arun Joshi',
    notes: 'Emergency comms relay post for traverse route.',
    created_at: '2026-03-01T08:30:00.000Z'
  }
];

// -------------------------------------------------------------
// INITIAL TRANSFER LEDGER
// -------------------------------------------------------------
export const INITIAL_ASSET_TRANSFERS: AssetTransferRecord[] = [
  {
    id: 1,
    asset_id: 'AST-001',
    from_location: 'Cape Town Port (Vessel MV Vasiliy Golovnin)',
    to_location: 'Bharati Station - Generator Hall',
    transfer_date: '2023-12-05T14:30:00.000Z',
    person_responsible: 'Vikram Malhotra',
    reason: 'Initial commissioning and station integration',
    notes: 'Transported via heavy sledge from fast ice offloading zone.',
    created_at: '2023-12-05T14:30:00.000Z'
  },
  {
    id: 2,
    asset_id: 'AST-002',
    from_location: 'Bharati Station Workshop',
    to_location: 'Field Camp A (Larsemann Hills)',
    transfer_date: '2026-02-10T09:00:00.000Z',
    person_responsible: 'Rajesh Nair',
    reason: 'Scientific field operation & ice core drilling electrical supply',
    notes: 'Towed with PistenBully PB300 across 28km groomed snow track.',
    created_at: '2026-02-10T09:00:00.000Z'
  },
  {
    id: 3,
    asset_id: 'AST-007',
    from_location: 'Bharati Science Block',
    to_location: 'Larsemann Hills Glaciology Site C',
    transfer_date: '2026-02-15T11:00:00.000Z',
    person_responsible: 'Dr. Ananya Sen',
    reason: 'Paleoclimate deep ice core extraction campaign',
    notes: 'Mounted on heated scientific shelter sled.',
    created_at: '2026-02-15T11:00:00.000Z'
  }
];

// -------------------------------------------------------------
// INITIAL MAINTENANCE RECORDS
// -------------------------------------------------------------
export const INITIAL_ASSET_MAINTENANCE: AssetMaintenanceRecord[] = [
  {
    id: 1,
    asset_id: 'AST-001',
    maintenance_type: 'PREVENTIVE',
    problem: 'Routine 500-hour service interval reached',
    inspection_details: 'Inspected fuel injectors, oil viscosity, turbocharger bearings, and block heater circuits.',
    work_performed: 'Flushed lube oil, installed dual Racor arctic fuel filters, cleaned air intake pre-screen.',
    technician: 'Vikram Malhotra (Senior Heavy Diesel Specialist)',
    maintenance_date: '2026-08-15',
    next_maintenance_date: '2026-09-18',
    maintenance_status: 'COMPLETED',
    parts_used: '2x Fuel Filter FF5776, 1x Lube Filter LF9009, 38L Valvoline Premium Blue Polar 0W-40',
    notes: 'Generator load tested at 80% capacity for 2 hours with zero thermal anomalies.',
    created_at: '2026-08-15T16:00:00.000Z'
  },
  {
    id: 2,
    asset_id: 'AST-002',
    maintenance_type: 'PREVENTIVE',
    problem: 'Approaching 250-hour field inspection threshold',
    inspection_details: 'Vibration detected in exhaust support bracket; battery fluid specific gravity low.',
    work_performed: 'Re-torqued exhaust manifold, replenished low-temp electrolyte in starter battery.',
    technician: 'Rajesh Nair (Field Ops Mech)',
    maintenance_date: '2026-07-20',
    next_maintenance_date: '2026-09-15', // Due in 3 days!
    maintenance_status: 'SCHEDULED',
    parts_used: 'Exhaust clamp gasket, 2L Arctic coolant mix',
    notes: 'Mandatory field check scheduled before next blizzard window.',
    created_at: '2026-07-20T10:00:00.000Z'
  },
  {
    id: 3,
    asset_id: 'AST-006',
    maintenance_type: 'CORRECTIVE',
    problem: 'Sprocket drive tooth failure and high vibration index (7.9)',
    inspection_details: 'Right side drive sprocket exhibiting 40% shear wear from traversing frozen blue-ice moraine.',
    work_performed: 'Disassembled track drive, removed damaged drive segments, placed unit in heated workshop bay.',
    technician: 'Sunil Verma (Fleet Master Mechanic)',
    maintenance_date: '2026-09-02',
    next_maintenance_date: '2026-09-16',
    maintenance_status: 'IN_PROGRESS',
    parts_used: 'Awaiting Drive Pin Segment Kit from India logistics resupply',
    notes: 'Vehicle immobilised in Maitri workshop. Do not operate.',
    created_at: '2026-09-02T14:00:00.000Z'
  }
];

// -------------------------------------------------------------
// INITIAL INCIDENT & DAMAGE RECORDS
// -------------------------------------------------------------
export const INITIAL_ASSET_INCIDENTS: AssetIncidentRecord[] = [
  {
    id: 1,
    incident_code: 'INC-AST-2026-001',
    asset_id: 'AST-010',
    incident_type: 'DAMAGED',
    severity: 'HIGH',
    description: 'VHF Tactical Antenna array sheared off at base mount during Category 2 katabatic storm (gusts 78 knots).',
    location: 'Field Camp B (Glacier Rim)',
    reported_by: 'Capt. Rakesh Mehta (Safety & Emergency)',
    reported_date: '2026-09-08',
    status: 'INVESTIGATING',
    resolution_notes: 'Temporary wire dipole antenna rigged for emergency reception. High-gain directional replacement antenna required.',
    resolved_at: undefined,
    created_at: '2026-09-08T18:45:00.000Z'
  },
  {
    id: 2,
    incident_code: 'INC-AST-2026-002',
    asset_id: 'AST-006',
    incident_type: 'FAILURE',
    severity: 'MEDIUM',
    description: 'Track drive sprocket teeth fractured on blue ice pressure ridge during Maitri-to-Oasis transport run.',
    location: 'Schirmacher Oasis Route Km 14',
    reported_by: 'Sunil Verma (Fleet Lead)',
    reported_date: '2026-08-30',
    status: 'REPORTED',
    resolution_notes: 'Snowcat towed back to Maitri workshop. Unit status changed to UNDER_MAINTENANCE.',
    resolved_at: undefined,
    created_at: '2026-08-30T11:20:00.000Z'
  }
];

// -------------------------------------------------------------
// INITIAL PREDICTIONS (Small ML & Rule-based Forecasts)
// -------------------------------------------------------------
export const INITIAL_ASSET_PREDICTIONS: AssetPredictionRecord[] = [
  {
    id: 1,
    expedition_id: 'EXP-2025-044',
    station_id: 'bharati',
    asset_category: 'Generators',
    asset_type: 'Heavy Polar Genset / Field Inverter Generators',
    predicted_requirement: 8,
    currently_available: 5,
    predicted_shortage: 3, // Section 20 requirement!
    prediction_horizon: '30 Days (Upcoming Traverse Campaign)',
    risk_level: 'HIGH',
    confidence_metric: 0.88,
    model_version: 'Antarctic-AssetRF-v1.4',
    prediction_date: '2026-09-11',
    status: 'ACTIVE',
    reason: 'Upcoming Larsemann Deep Ice Traverse requires 2 additional field generator sleds, and 1 station generator reaches overhaul threshold.',
    algorithm_used: 'RandomForestRegressor_AssetDemandEnsemble',
    is_fallback: false,
    created_at: '2026-09-11T06:00:00.000Z'
  },
  {
    id: 2,
    expedition_id: 'EXP-2025-044',
    station_id: 'bharati',
    asset_category: 'Radios',
    asset_type: 'Scientific & Tactical Polar VHF/UHF Radios',
    predicted_requirement: 20,
    currently_available: 18,
    predicted_shortage: 2, // Section 15 example!
    prediction_horizon: '45 Days (Multi-team field expansion)',
    risk_level: 'MEDIUM',
    confidence_metric: 0.85,
    model_version: 'Antarctic-AssetRF-v1.4',
    prediction_date: '2026-09-11',
    status: 'ACTIVE',
    reason: 'Expansion of 2 independent glaciology field teams plus 1 unit damaged (AST-010 antenna incident) reduces available margin.',
    algorithm_used: 'RandomForestRegressor_AssetDemandEnsemble',
    is_fallback: false,
    created_at: '2026-09-11T06:00:00.000Z'
  },
  {
    id: 3,
    expedition_id: 'EXP-2025-044',
    station_id: 'maitri',
    asset_category: 'Snow vehicles',
    asset_type: 'Heavy Tracked Snowcats & Groomers',
    predicted_requirement: 4,
    currently_available: 2,
    predicted_shortage: 2,
    prediction_horizon: '60 Days (Summer Convoy Preparation)',
    risk_level: 'HIGH',
    confidence_metric: 0.81,
    model_version: 'Antarctic-AssetRF-v1.4',
    prediction_date: '2026-09-11',
    status: 'ACTIVE',
    reason: 'AST-006 under maintenance with sprocket failure; upcoming fuel bladder convoy requires minimum 4 heavy snowcats.',
    algorithm_used: 'RandomForestRegressor_AssetDemandEnsemble',
    is_fallback: false,
    created_at: '2026-09-11T06:00:00.000Z'
  },
  {
    id: 4,
    expedition_id: 'EXP-2026-002',
    station_id: 'himadri',
    asset_category: 'Scientific instruments',
    asset_type: 'Cryosphere Radiometers & Snow Sensors',
    predicted_requirement: 6,
    currently_available: 6,
    predicted_shortage: 0,
    prediction_horizon: '90 Days',
    risk_level: 'LOW',
    confidence_metric: 0.92,
    model_version: 'Antarctic-AssetRF-v1.4',
    prediction_date: '2026-09-11',
    status: 'RESOLVED',
    reason: 'Asset fleet currently meets projected Svalbard summer scientific campaign demand.',
    algorithm_used: 'RandomForestRegressor_AssetDemandEnsemble',
    is_fallback: false,
    created_at: '2026-09-11T06:00:00.000Z'
  }
];

// -------------------------------------------------------------
// INITIAL ASSET SUPPLY REQUESTS (Procurement / Resupply)
// -------------------------------------------------------------
export const INITIAL_ASSET_SUPPLY_REQUESTS: AssetSupplyRequestRecord[] = [
  {
    id: 1,
    request_code: 'ASR-2026-001',
    expedition_id: 'EXP-2025-044',
    station_id: 'bharati',
    asset_type: 'Portable Arctic Diesel Generators (45kVA)',
    asset_category: 'Generators',
    requested_quantity: 3,
    predicted_quantity: 3,
    approved_quantity: 3,
    received_quantity: null,
    reason: 'Supply alert review: 3 additional mobile generators approved for 45th ISEA Larsemann traverse scientific operations.',
    requested_by: 'Automated ML Requirement Engine',
    approved_by: 'Shri Alok Mukherjee (Director Polar Assets, India)',
    approved_at: '2026-09-11T10:00:00.000Z',
    status: 'IN_PREPARATION',
    cargo_code: 'CRG-AST-GEN-901',
    containerNo: 'CONT-IND-901',
    vessel_name: 'MV Vasiliy Golovnin (Charter 2026)',
    notes: 'Equipment staged at Garden Reach Shipbuilders & Engineers yard, Kolkata.',
    created_at: '2026-09-11T07:00:00.000Z',
    updated_at: '2026-09-11T10:00:00.000Z'
  },
  {
    id: 2,
    request_code: 'ASR-2026-002',
    expedition_id: 'EXP-2025-044',
    station_id: 'bharati',
    asset_type: 'Tactical Polar VHF/UHF Handheld Radios',
    asset_category: 'Radios',
    requested_quantity: 2,
    predicted_quantity: 2,
    approved_quantity: null,
    received_quantity: null,
    reason: 'Antenna incident AST-010 and field team expansion require 2 replacement units.',
    requested_by: 'Capt. Rakesh Mehta (Safety & Emergency Lead)',
    approved_by: null,
    approved_at: null,
    status: 'PENDING',
    cargo_code: undefined,
    containerNo: undefined,
    vessel_name: undefined,
    notes: 'Pending India Logistics Officer review.',
    created_at: '2026-09-11T09:30:00.000Z',
    updated_at: '2026-09-11T09:30:00.000Z'
  }
];

// -------------------------------------------------------------
// INITIAL ASSET NOTIFICATIONS DISPATCHED TO INDIA
// -------------------------------------------------------------
export const INITIAL_ASSET_NOTIFICATIONS: AssetNotificationRecord[] = [
  {
    id: 1,
    alert_id: 1,
    alert_type: 'EQUIPMENT_SHORTAGE',
    department: 'Polar Heavy Engineering & Scientific Assets Directorate, NCPOR Goa',
    officer_name: 'Shri Alok Mukherjee',
    email: 'alok.mukherjee@ncpor.gov.in',
    phone: '+91-832-2525600',
    subject: 'Asset Requirement Alert: 3x Portable Generators Required for Bharati Station',
    message: `Asset Requirement Alert

Expedition:
EXP-2025-044

Station:
Bharati

Equipment:
Portable Generator

Currently Available:
5

Predicted Requirement:
8

Additional Requirement:
3

Reason:
Projected operational requirement exceeds current available assets.

Please review the requirement and initiate the appropriate supply process.`,
    channel: 'Email',
    sent_at: '2026-09-11T06:15:00.000Z',
    delivery_status: 'DELIVERED',
    created_at: '2026-09-11T06:15:00.000Z'
  }
];
