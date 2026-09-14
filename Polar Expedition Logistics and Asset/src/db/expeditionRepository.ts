import fs from 'fs';
import path from 'path';
import { db } from './index.ts';
import { expeditions, expeditionAuditLogs, expeditionPersonnelLinks, expeditionTeamLinks, expeditionLocationLinks, expeditionCargoLinks, expeditionShipmentLinks, expeditionInventoryLinks, expeditionAssetLinks } from './schema.ts';
import { eq, or, sql } from 'drizzle-orm';
import { 
  ExpeditionRecord, 
  ExpeditionStatusValue, 
  ExpeditionAuditLog, 
  FutureModuleCounts,
  ExpeditionFilterParams,
  DashboardStats 
} from '../types.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'expeditions_store.json');

// Memory store initialized from disk
interface StoreData {
  expeditions: ExpeditionRecord[];
  auditLogs: ExpeditionAuditLog[];
  links: {
    personnel: { id: number; expeditionId: string; code: string; role: string }[];
    teams: { id: number; expeditionId: string; name: string; lead: string }[];
    locations: { id: number; expeditionId: string; name: string; coords: string }[];
    cargo: { id: number; expeditionId: string; containerNo: string; weightKg: number }[];
    shipments: { id: number; expeditionId: string; code: string; vessel: string }[];
    inventory: { id: number; expeditionId: string; itemCode: string; qty: number }[];
    assets: { id: number; expeditionId: string; assetCode: string; name: string }[];
  };
}

const SEED_DATA: StoreData = {
  expeditions: [
    {
      id: 1,
      expedition_id: 'EXP-2025-044',
      expedition_name: '44th Indian Scientific Expedition to Antarctica',
      expedition_code: 'ISEA-44',
      expedition_year: 2025,
      description: 'Comprehensive multidisciplinary polar expedition encompassing cryosphere dynamics, atmospheric chemistry, and biological sampling across Eastern Antarctica.',
      mission_objective: 'Execute high-precision ice-core drilling at Princess Elizabeth Land, perform structural maintenance on Bharati Station, and conduct Southern Ocean biochemical profiling.',
      target_region: 'Larsemann Hills (Bharati Station)',
      lead_organization: 'NCPOR - National Centre for Polar and Ocean Research',
      expedition_leader: 'Dr. Shailendra Saini',
      start_date: '2025-11-15',
      end_date: '2026-04-10',
      status: 'Active',
      notes: 'Winter-over team deployed. Satellite telemetry nominal. Automated weather stations relaying continuous data to Goa HQ.',
      created_at: '2025-08-10T09:00:00.000Z',
      updated_at: '2025-11-15T12:00:00.000Z',
      created_by: 'director@ncpor.res.in',
      updated_by: 'logistics@ncpor.res.in',
    },
    {
      id: 2,
      expedition_id: 'EXP-2026-045',
      expedition_name: '45th Indian Scientific Expedition to Antarctica',
      expedition_code: 'ISEA-45',
      expedition_year: 2026,
      description: 'Milestone 45th polar campaign focusing on Maitri-II site ground stabilization, clean solar-wind microgrid installation, and continental ice margin radar sounding.',
      mission_objective: 'Complete preliminary engineering works for new Maitri-II station, transport 300 tons of prefabricated structural panels, and establish deep ice GPS markers.',
      target_region: 'Schirmacher Oasis (Maitri Station)',
      lead_organization: 'NCPOR - National Centre for Polar and Ocean Research',
      expedition_leader: 'Dr. Rajesh Asthana',
      start_date: '2026-11-20',
      end_date: '2027-03-30',
      status: 'Planned',
      notes: 'Environmental impact assessment submitted to Antarctic Treaty Consultative Meeting (ATCM). Cargo consolidation ongoing at Mormugao Port.',
      created_at: '2026-01-14T10:30:00.000Z',
      updated_at: '2026-02-01T15:45:00.000Z',
      created_by: 'director@ncpor.res.in',
      updated_by: 'coordinator@ncpor.res.in',
    },
    {
      id: 3,
      expedition_id: 'EXP-2026-002',
      expedition_name: 'Amery Ice Shelf Grounding Zone Expedition',
      expedition_code: 'AMERY-ICE-01',
      expedition_year: 2026,
      description: 'Collaborative deep grounding-line exploration deploying autonomous sub-ice ocean gliders and radar tomography to map oceanic melting rates.',
      mission_objective: 'Deploy 4 long-endurance oceanographic profilers into the sub-shelf cavity and retrieve seismic sensor strings across the hinge line.',
      target_region: 'Amery Ice Shelf',
      lead_organization: 'NCPOR & Australian Antarctic Division',
      expedition_leader: 'Dr. Ananya Mukherjee',
      start_date: '2026-12-05',
      end_date: '2027-02-25',
      status: 'Approved',
      notes: 'Joint logistics protocol ratified. Helicopter reconnaissance flight paths approved by air safety council.',
      created_at: '2026-02-20T11:15:00.000Z',
      updated_at: '2026-03-05T09:20:00.000Z',
      created_by: 'coordinator@ncpor.res.in',
      updated_by: 'director@ncpor.res.in',
    },
    {
      id: 6,
      expedition_id: 'EXP-2025-046',
      expedition_name: 'Southern Ocean Biogeochemical & Carbon Flux Campaign',
      expedition_code: 'SO-TRANS-25',
      expedition_year: 2025,
      description: 'Multi-institution high-latitude oceanographic cruise quantifying carbon draw-down, microplastic distribution, and phytoplankton bloom kinetics in Prydz Bay and the Antarctic Divergence.',
      mission_objective: 'Conduct 54 CTD rosette casts, deploy 8 biogeochemical Argo floats, and sample micronutrient trace metals across 60°S to 69°S transects.',
      target_region: 'Southern Ocean (Prydz Bay Sector)',
      lead_organization: 'NCPOR & National Institute of Oceanography (CSIR-NIO)',
      expedition_leader: 'Dr. Sandip K. Roy',
      start_date: '2025-12-01',
      end_date: '2026-04-15',
      status: 'Active',
      notes: 'Operations active aboard chartered icebreaker. Underway spectrophotometry active. 3 Argo floats successfully deployed.',
      created_at: '2025-09-01T10:00:00.000Z',
      updated_at: '2025-12-05T14:30:00.000Z',
      created_by: 'director@ncpor.res.in',
      updated_by: 'logistics@ncpor.res.in',
    },
    {
      id: 7,
      expedition_id: 'EXP-2026-047',
      expedition_name: 'Maitri Clean Energy Microgrid & Decarbonization Campaign',
      expedition_code: 'MAITRI-MICRO-26',
      expedition_year: 2026,
      description: 'Renewable energy retrofitting initiative deploying bifacial vertical wind turbines, high-capacity lithium-titanate battery storage, and smart grid automation.',
      mission_objective: 'Reduce station diesel fuel dependency by 38%, install 60kW polar-rated wind turbines, and integrate automated waste-heat recovery loops.',
      target_region: 'Schirmacher Oasis (Maitri Station)',
      lead_organization: 'NCPOR & Central Building Research Institute (CSIR-CBRI)',
      expedition_leader: 'Dr. Vikram K. Malhotra',
      start_date: '2026-11-10',
      end_date: '2027-03-20',
      status: 'Approved',
      notes: 'Engineering clearance certified. Equipment packed in 6 specialized 20ft insulated shipping containers at Mormugao Berth 9.',
      created_at: '2026-02-15T11:00:00.000Z',
      updated_at: '2026-03-10T16:00:00.000Z',
      created_by: 'coordinator@ncpor.res.in',
      updated_by: 'director@ncpor.res.in',
    },
    {
      id: 8,
      expedition_id: 'EXP-2023-042',
      expedition_name: '42nd Indian Scientific Expedition to Antarctica',
      expedition_code: 'ISEA-42',
      expedition_year: 2023,
      description: 'Full summer and winter campaign at Bharati and Maitri. Focused on atmospheric greenhouse gas monitoring, geomagnetic observatories, and physiological cold-adaptation genomics.',
      mission_objective: 'Maintain continuous seismic and magnetometric observations, establish new sub-glacial meteorological towers, and execute winter personnel changeover.',
      target_region: 'Larsemann Hills & Maitri',
      lead_organization: 'NCPOR - National Centre for Polar and Ocean Research',
      expedition_leader: 'Dr. Atul Kumar',
      start_date: '2023-11-20',
      end_date: '2024-04-02',
      status: 'Completed',
      notes: 'Completed with distinction. Safe repatriation of all 48 summer and winter researchers. All scientific deliverables archived.',
      created_at: '2023-08-01T08:30:00.000Z',
      updated_at: '2024-04-10T12:00:00.000Z',
      created_by: 'director@ncpor.res.in',
      updated_by: 'director@ncpor.res.in',
    },
    {
      id: 9,
      expedition_id: 'EXP-2022-041',
      expedition_name: '41st Indian Scientific Expedition to Antarctica',
      expedition_code: 'ISEA-41',
      expedition_year: 2022,
      description: 'Post-pandemic consolidated polar logistics mission securing multi-year scientific continuity, major generator overhauls at Bharati, and long-baseline GPS station upgrades.',
      mission_objective: 'Overhaul main station fuel transfer manifolds, conduct GPS strain-rate mapping at Schirmacher Oasis, and relieve wintering researchers.',
      target_region: 'Larsemann Hills & Maitri',
      lead_organization: 'NCPOR - National Centre for Polar and Ocean Research',
      expedition_leader: 'Dr. K. Swaminathan',
      start_date: '2022-11-15',
      end_date: '2023-04-10',
      status: 'Completed',
      notes: '100% mission safety compliance recorded. Comprehensive structural health audit of Bharati modules submitted to Ministry of Earth Sciences.',
      created_at: '2022-07-20T09:15:00.000Z',
      updated_at: '2023-04-15T10:00:00.000Z',
      created_by: 'director@ncpor.res.in',
      updated_by: 'director@ncpor.res.in',
    },
    {
      id: 10,
      expedition_id: 'EXP-2026-048',
      expedition_name: 'Dronning Maud Land Deep Ice Radar Tomography',
      expedition_code: 'DML-TRAV-26',
      expedition_year: 2026,
      description: 'Ground-based over-snow traverse spanning 800km inland from Maitri Station using heavy PistenBully convoys pulling dual-frequency ice-penetrating radar.',
      mission_objective: 'Map internal isochronal ice layers to bedrock, quantify basal topography roughness, and identify potential subglacial water conduits.',
      target_region: 'Dronning Maud Land Interior',
      lead_organization: 'NCPOR & Geological Survey of India',
      expedition_leader: 'Dr. Priya Deshmukh',
      start_date: '2026-12-15',
      end_date: '2027-02-28',
      status: 'Planned',
      notes: 'Traverse safety routing and crevasse detection radar protocols under review. Polar sled fuel sledding calculations completed.',
      created_at: '2026-03-01T10:00:00.000Z',
      updated_at: '2026-03-12T11:00:00.000Z',
      created_by: 'coordinator@ncpor.res.in',
      updated_by: 'coordinator@ncpor.res.in',
    },
    {
      id: 11,
      expedition_id: 'EXP-2027-049',
      expedition_name: 'Antarctic Stratospheric Aerosol & Ozone Profiling',
      expedition_code: 'POLAR-AER-27',
      expedition_year: 2027,
      description: 'High-altitude meteorological balloon sounding campaign measuring stratospheric polar vortex dynamics, volcanic aerosol residence time, and springtime ozone recovery.',
      mission_objective: 'Launch 90 cryogenic frostpoint hygrometer (CFH) and ozonesonde balloons during the polar spring vortex transition.',
      target_region: 'Larsemann Hills (Bharati Station)',
      lead_organization: 'NCPOR & India Meteorological Department (IMD)',
      expedition_leader: 'Dr. R. Ramanathan',
      start_date: '2027-01-05',
      end_date: '2027-05-30',
      status: 'Planned',
      notes: 'Helium gas cylinder logistics requisition submitted to Mormugao port staging authority.',
      created_at: '2026-03-08T15:00:00.000Z',
      updated_at: '2026-03-08T15:00:00.000Z',
      created_by: 'coordinator@ncpor.res.in',
      updated_by: 'coordinator@ncpor.res.in',
    },
    {
      id: 12,
      expedition_id: 'EXP-2024-033',
      expedition_name: 'Subglacial Lake CECS Exploration Traverse',
      expedition_code: 'SUB-LAKE-24',
      expedition_year: 2024,
      description: 'Proposed autonomous hot-water drilling probe test over suspected peripheral subglacial cavity.',
      mission_objective: 'Test sterile hot-water drill probe and recovery system under extreme inland temperatures (-45°C).',
      target_region: 'Dome-C Peripheral Subglacial Trench',
      lead_organization: 'NCPOR & National Geophysical Research Institute',
      expedition_leader: 'Dr. Harsh Vardhan',
      start_date: '2024-12-01',
      end_date: '2025-02-15',
      status: 'Cancelled',
      notes: 'Mission cancelled due to logistical reprioritization to support critical structural repairs on Bharati Station wastewater system.',
      created_at: '2024-05-10T10:00:00.000Z',
      updated_at: '2024-09-15T14:00:00.000Z',
      created_by: 'director@ncpor.res.in',
      updated_by: 'director@ncpor.res.in',
    },
    {
      id: 4,
      expedition_id: 'EXP-2024-043',
      expedition_name: '43rd Indian Scientific Expedition to Antarctica',
      expedition_code: 'ISEA-43',
      expedition_year: 2024,
      description: 'Annual summer campaign coupled with continuous winter-over research. Conducted paleoclimate studies through lake sediment coring in Schirmacher Oasis.',
      mission_objective: 'Recover 20m sediment cores from Priyadarshini Lake, complete generator overhauls at Bharati, and relief of wintering team.',
      target_region: 'Larsemann Hills & Maitri',
      lead_organization: 'NCPOR - National Centre for Polar and Ocean Research',
      expedition_leader: 'Dr. Yogesh Ray',
      start_date: '2024-11-01',
      end_date: '2025-04-05',
      status: 'Completed',
      notes: 'All objectives successfully fulfilled. 18 peer-reviewed datasets uploaded to the National Polar Data Center. Scientific team safely demobilized.',
      created_at: '2024-07-15T08:00:00.000Z',
      updated_at: '2025-04-06T18:30:00.000Z',
      created_by: 'director@ncpor.res.in',
      updated_by: 'director@ncpor.res.in',
    },
    {
      id: 5,
      expedition_id: 'EXP-2025-019',
      expedition_name: 'Weddell Sea Benthic Ecology Survey',
      expedition_code: 'WEDDELL-BIO-25',
      expedition_year: 2025,
      description: 'Exploratory deep-sea benthic dredge and environmental DNA sampling within the eastern Weddell Sea polynya corridor.',
      mission_objective: 'Quantify cold-adapted invertebrate biomass and determine benthic vulnerability to ocean acidification.',
      target_region: 'Weddell Sea Sector',
      lead_organization: 'NCPOR & British Antarctic Survey',
      expedition_leader: 'Dr. Victor Vance',
      start_date: '2025-01-10',
      end_date: '2025-03-15',
      status: 'Cancelled',
      notes: 'Expedition cancelled in early planning phase due to severe multi-year pack ice obstruction and charter vessel redirection for humanitarian relief.',
      created_at: '2024-09-01T14:20:00.000Z',
      updated_at: '2024-11-20T16:00:00.000Z',
      created_by: 'coordinator@ncpor.res.in',
      updated_by: 'director@ncpor.res.in',
    }
  ],
  auditLogs: [
    {
      id: 1,
      expedition_id: 'EXP-2025-044',
      user_email: 'director@ncpor.res.in',
      user_name: 'Dr. Thamban Meloth',
      user_role: 'Expedition Manager',
      action: 'CREATED',
      previous_state: null,
      new_state: JSON.stringify({ status: 'Planned', expedition_id: 'EXP-2025-044' }),
      details: 'Expedition record EXP-2025-044 (ISEA-44) registered in polar command registry.',
      timestamp: '2025-08-10T09:00:00.000Z',
    },
    {
      id: 2,
      expedition_id: 'EXP-2025-044',
      user_email: 'director@ncpor.res.in',
      user_name: 'Dr. Thamban Meloth',
      user_role: 'Expedition Manager',
      action: 'APPROVED',
      previous_state: JSON.stringify({ status: 'Planned' }),
      new_state: JSON.stringify({ status: 'Approved' }),
      details: 'Expedition approved following peer committee operational review.',
      timestamp: '2025-09-12T11:00:00.000Z',
    },
    {
      id: 3,
      expedition_id: 'EXP-2025-044',
      user_email: 'logistics@ncpor.res.in',
      user_name: 'Dr. Shailendra Saini',
      user_role: 'Expedition Manager',
      action: 'ACTIVATED',
      previous_state: JSON.stringify({ status: 'Approved' }),
      new_state: JSON.stringify({ status: 'Active' }),
      details: 'Expedition transitioned to Active status upon departure of chartered ice vessel from Mormugao Port.',
      timestamp: '2025-11-15T12:00:00.000Z',
    },
    {
      id: 4,
      expedition_id: 'EXP-2026-045',
      user_email: 'director@ncpor.res.in',
      user_name: 'Dr. Thamban Meloth',
      user_role: 'Expedition Manager',
      action: 'CREATED',
      previous_state: null,
      new_state: JSON.stringify({ status: 'Planned', expedition_id: 'EXP-2026-045' }),
      details: 'Expedition record EXP-2026-045 (ISEA-45) initiated for Maitri-II reconstruction cycle.',
      timestamp: '2026-01-14T10:30:00.000Z',
    },
    {
      id: 5,
      expedition_id: 'EXP-2026-002',
      user_email: 'coordinator@ncpor.res.in',
      user_name: 'Dr. Ananya Mukherjee',
      user_role: 'Expedition Manager',
      action: 'CREATED',
      previous_state: null,
      new_state: JSON.stringify({ status: 'Planned', expedition_id: 'EXP-2026-002' }),
      details: 'Expedition record EXP-2026-002 created for Amery Ice Shelf Grounding Zone.',
      timestamp: '2026-02-20T11:15:00.000Z',
    },
    {
      id: 6,
      expedition_id: 'EXP-2026-002',
      user_email: 'director@ncpor.res.in',
      user_name: 'Dr. Thamban Meloth',
      user_role: 'Expedition Manager',
      action: 'APPROVED',
      previous_state: JSON.stringify({ status: 'Planned' }),
      new_state: JSON.stringify({ status: 'Approved' }),
      details: 'Expedition approved after bilateral treaty verification.',
      timestamp: '2026-03-05T09:20:00.000Z',
    }
  ],
  links: {
    personnel: [
      { id: 1, expeditionId: 'EXP-2025-044', code: 'POL-0101', role: 'Expedition Leader' },
      { id: 2, expeditionId: 'EXP-2025-044', code: 'POL-0102', role: 'Glaciology Lead' },
      { id: 3, expeditionId: 'EXP-2025-044', code: 'POL-0103', role: 'Station Medical Officer' },
    ],
    teams: [
      { id: 1, expeditionId: 'EXP-2025-044', name: 'Alpha Ice Drilling Unit', lead: 'Dr. S. Saini' },
      { id: 2, expeditionId: 'EXP-2025-044', name: 'Bravo Atmospheric Sensors', lead: 'Dr. K. Swaminathan' },
    ],
    locations: [
      { id: 1, expeditionId: 'EXP-2025-044', name: 'Bharati Station Campus', coords: '69°24\'28"S 76°11\'14"E' },
      { id: 2, expeditionId: 'EXP-2025-044', name: 'Princess Elizabeth Land Deep Camp', coords: '73°00\'00"S 75°00\'00"E' },
    ],
    cargo: [
      { id: 1, expeditionId: 'EXP-2025-044', containerNo: 'NCPOR-CNT-1021', weightKg: 14200 },
      { id: 2, expeditionId: 'EXP-2025-044', containerNo: 'NCPOR-CNT-1022', weightKg: 16800 },
    ],
    shipments: [
      { id: 1, expeditionId: 'EXP-2025-044', code: 'SHP-2025-VG-01', vessel: 'MV Vasiliy Golovnin' },
    ],
    inventory: [
      { id: 1, expeditionId: 'EXP-2025-044', itemCode: 'FUEL-POL-01', qty: 45000 },
      { id: 2, expeditionId: 'EXP-2025-044', itemCode: 'RATION-POL-09', qty: 12000 },
    ],
    assets: [
      { id: 1, expeditionId: 'EXP-2025-044', assetCode: 'AST-SNOWCAT-01', name: 'PistenBully 300 Polar' },
      { id: 2, expeditionId: 'EXP-2025-044', assetCode: 'AST-GENSET-02', name: 'Caterpillar 3406 Diesel Generator' },
    ],
  }
};

function ensureStorage(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      fs.writeFileSync(STORE_FILE, JSON.stringify(SEED_DATA, null, 2), 'utf8');
      return SEED_DATA;
    }
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed.expeditions || parsed.expeditions.length === 0) {
      fs.writeFileSync(STORE_FILE, JSON.stringify(SEED_DATA, null, 2), 'utf8');
      return SEED_DATA;
    }
    return parsed;
  } catch (err) {
    console.warn('Fallback initializing expedition store in memory:', err);
    return SEED_DATA;
  }
}

function saveStorage(data: StoreData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save expedition store:', err);
  }
}

// Validation Helpers
export function validateDateOrder(startDate: string, endDate: string) {
  const startTs = new Date(startDate).getTime();
  const endTs = new Date(endDate).getTime();
  if (isNaN(startTs) || isNaN(endTs)) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD.');
  }
  if (endTs < startTs) {
    throw new Error('End date cannot be before start date.');
  }
}

const VALID_STATUSES: ExpeditionStatusValue[] = ['Planned', 'Approved', 'Active', 'Completed', 'Cancelled'];

const STATUS_TRANSITIONS: Record<ExpeditionStatusValue, ExpeditionStatusValue[]> = {
  'Planned': ['Approved', 'Cancelled'],
  'Approved': ['Active', 'Cancelled'],
  'Active': ['Completed', 'Cancelled'],
  'Completed': [],
  'Cancelled': []
};

export function validateStatusTransition(current: ExpeditionStatusValue, target: ExpeditionStatusValue) {
  if (current === target) return;
  if (!VALID_STATUSES.includes(target)) {
    throw new Error(`Invalid expedition status: ${target}. Allowed: ${VALID_STATUSES.join(', ')}`);
  }
  const allowed = STATUS_TRANSITIONS[current] || [];
  if (!allowed.includes(target)) {
    throw new Error(`Invalid status transition from '${current}' to '${target}'. Allowed next steps: ${allowed.length > 0 ? allowed.join(', ') : 'None (Terminal state)'}.`);
  }
}

// -------------------------------------------------------------
// REPOSITORY METHODS
// -------------------------------------------------------------

export async function getAllExpeditions(params?: ExpeditionFilterParams): Promise<ExpeditionRecord[]> {
  const store = ensureStorage();
  let list = [...store.expeditions];

  if (!params) {
    return list.sort((a, b) => b.id - a.id);
  }

  // General query search (ID, Name, Code, Year, Region, Org, Leader, Status)
  if (params.q && params.q.trim()) {
    const q = params.q.trim().toLowerCase();
    list = list.filter((e) => {
      return (
        e.expedition_id.toLowerCase().includes(q) ||
        e.expedition_name.toLowerCase().includes(q) ||
        e.expedition_code.toLowerCase().includes(q) ||
        e.expedition_year.toString().includes(q) ||
        e.target_region.toLowerCase().includes(q) ||
        e.lead_organization.toLowerCase().includes(q) ||
        e.expedition_leader.toLowerCase().includes(q) ||
        e.status.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.mission_objective && e.mission_objective.toLowerCase().includes(q))
      );
    });
  }

  // Status filter
  if (params.status && params.status !== 'ALL') {
    const statuses = params.status.split(',').map((s) => s.trim().toLowerCase());
    list = list.filter((e) => statuses.includes(e.status.toLowerCase()));
  }

  // Year filter
  if (params.year && params.year !== 'ALL') {
    const y = Number(params.year);
    if (!isNaN(y)) {
      list = list.filter((e) => e.expedition_year === y);
    }
  }

  // Target Region filter
  if (params.target_region && params.target_region !== 'ALL') {
    const r = params.target_region.trim().toLowerCase();
    list = list.filter((e) => e.target_region.toLowerCase().includes(r));
  }

  // Lead Organization filter
  if (params.lead_organization && params.lead_organization !== 'ALL') {
    const org = params.lead_organization.trim().toLowerCase();
    list = list.filter((e) => e.lead_organization.toLowerCase().includes(org));
  }

  // Specific Start Date filter
  if (params.start_date) {
    list = list.filter((e) => e.start_date >= params.start_date!);
  }

  // Specific End Date filter
  if (params.end_date) {
    list = list.filter((e) => e.end_date <= params.end_date!);
  }

  // Date Range filter (operational overlap: start_date <= date_to && end_date >= date_from)
  if (params.date_from && params.date_to) {
    validateDateOrder(params.date_from, params.date_to);
    list = list.filter((e) => {
      return e.start_date <= params.date_to! && e.end_date >= params.date_from!;
    });
  } else if (params.date_from) {
    list = list.filter((e) => e.end_date >= params.date_from!);
  } else if (params.date_to) {
    list = list.filter((e) => e.start_date <= params.date_to!);
  }

  return list.sort((a, b) => b.id - a.id);
}

export async function getExpeditionById(idOrExpId: string | number): Promise<ExpeditionRecord | null> {
  const store = ensureStorage();
  const searchStr = String(idOrExpId).trim().toLowerCase();
  const found = store.expeditions.find(
    (e) => String(e.id) === searchStr || e.expedition_id.toLowerCase() === searchStr || e.expedition_code.toLowerCase() === searchStr
  );
  return found || null;
}

export async function getExpeditionDetailWithRelations(idOrExpId: string | number) {
  const expedition = await getExpeditionById(idOrExpId);
  if (!expedition) {
    return null;
  }

  const store = ensureStorage();
  const expId = expedition.expedition_id;

  const module_connections: FutureModuleCounts = {
    personnel_count: store.links.personnel.filter((p) => p.expeditionId === expId).length,
    teams_count: store.links.teams.filter((t) => t.expeditionId === expId).length,
    locations_count: store.links.locations.filter((l) => l.expeditionId === expId).length,
    cargo_count: store.links.cargo.filter((c) => c.expeditionId === expId).length,
    shipments_count: store.links.shipments.filter((s) => s.expeditionId === expId).length,
    inventory_count: store.links.inventory.filter((i) => i.expeditionId === expId).length,
    assets_count: store.links.assets.filter((a) => a.expeditionId === expId).length,
  };

  const audit_logs = store.auditLogs
    .filter((log) => log.expedition_id.toLowerCase() === expId.toLowerCase())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    expedition,
    module_connections,
    audit_logs,
  };
}

export async function createExpedition(
  payload: any,
  user: { email: string; name: string; role: string }
): Promise<ExpeditionRecord> {
  const store = ensureStorage();

  const expedition_id = (payload.expedition_id || '').trim();
  const expedition_name = (payload.expedition_name || '').trim();
  const expedition_code = (payload.expedition_code || '').trim();
  const expedition_year = Number(payload.expedition_year);
  const target_region = (payload.target_region || '').trim();
  const lead_organization = (payload.lead_organization || '').trim();
  const expedition_leader = (payload.expedition_leader || '').trim();
  const start_date = (payload.start_date || '').trim();
  const end_date = (payload.end_date || '').trim();
  const status: ExpeditionStatusValue = payload.status || 'Planned';
  const description = (payload.description || '').trim();
  const mission_objective = (payload.mission_objective || '').trim();
  const notes = (payload.notes || '').trim();

  // Field presence validation
  if (!expedition_id) throw new Error('Expedition ID is required and cannot be empty.');
  if (!expedition_name) throw new Error('Expedition Name is required and cannot be empty.');
  if (!expedition_code) throw new Error('Expedition Code is required and cannot be empty.');
  if (isNaN(expedition_year) || expedition_year < 1950 || expedition_year > 2100) {
    throw new Error('Valid Expedition Year is required (e.g. 2026).');
  }
  if (!target_region) throw new Error('Target Region is required.');
  if (!lead_organization) throw new Error('Lead Organization is required.');
  if (!expedition_leader) throw new Error('Expedition Leader is required.');
  if (!start_date) throw new Error('Start Date is required.');
  if (!end_date) throw new Error('End Date is required.');

  // Date Order Validation
  validateDateOrder(start_date, end_date);

  // Status Validation
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  // Duplicate Expedition ID check
  const duplicateId = store.expeditions.find(
    (e) => e.expedition_id.toLowerCase() === expedition_id.toLowerCase()
  );
  if (duplicateId) {
    throw new Error('Expedition ID already exists.');
  }

  // Duplicate Expedition Code check
  const duplicateCode = store.expeditions.find(
    (e) => e.expedition_code.toLowerCase() === expedition_code.toLowerCase()
  );
  if (duplicateCode) {
    throw new Error('Expedition code already exists.');
  }

  const nextId = store.expeditions.reduce((max, e) => Math.max(max, e.id), 0) + 1;
  const now = new Date().toISOString();

  const newExpedition: ExpeditionRecord = {
    id: nextId,
    expedition_id,
    expedition_name,
    expedition_code,
    expedition_year,
    description,
    mission_objective,
    target_region,
    lead_organization,
    expedition_leader,
    start_date,
    end_date,
    status,
    notes,
    created_at: now,
    updated_at: now,
    created_by: user.email,
    updated_by: user.email,
  };

  store.expeditions.push(newExpedition);

  // Write Audit Log
  const nextLogId = store.auditLogs.reduce((max, l) => Math.max(max, l.id), 0) + 1;
  store.auditLogs.push({
    id: nextLogId,
    expedition_id,
    user_email: user.email,
    user_name: user.name,
    user_role: user.role,
    action: 'CREATED',
    previous_state: null,
    new_state: JSON.stringify({
      id: nextId,
      expedition_id,
      expedition_name,
      expedition_code,
      status,
      start_date,
      end_date,
    }),
    details: `Expedition ${expedition_id} (${expedition_name}) was successfully created.`,
    timestamp: now,
  });

  saveStorage(store);
  return newExpedition;
}

export async function updateExpedition(
  idOrExpId: string | number,
  updates: any,
  user: { email: string; name: string; role: string }
): Promise<ExpeditionRecord> {
  const store = ensureStorage();
  const searchStr = String(idOrExpId).trim().toLowerCase();
  const index = store.expeditions.findIndex(
    (e) => String(e.id) === searchStr || e.expedition_id.toLowerCase() === searchStr
  );

  if (index === -1) {
    throw new Error(`Expedition '${idOrExpId}' not found.`);
  }

  const existing = store.expeditions[index];
  const previousState = JSON.stringify(existing);

  // Check code uniqueness if code changed
  if (updates.expedition_code && updates.expedition_code.trim().toLowerCase() !== existing.expedition_code.toLowerCase()) {
    const codeConflict = store.expeditions.find(
      (e) => e.id !== existing.id && e.expedition_code.toLowerCase() === updates.expedition_code.trim().toLowerCase()
    );
    if (codeConflict) {
      throw new Error('Expedition code already exists.');
    }
  }

  // Validate dates if updated
  const newStartDate = updates.start_date || existing.start_date;
  const newEndDate = updates.end_date || existing.end_date;
  validateDateOrder(newStartDate, newEndDate);

  // Validate status transition if updated
  let statusChanged = false;
  if (updates.status && updates.status !== existing.status) {
    validateStatusTransition(existing.status, updates.status);
    statusChanged = true;
  }

  const now = new Date().toISOString();

  const updatedRecord: ExpeditionRecord = {
    ...existing,
    expedition_name: updates.expedition_name !== undefined ? updates.expedition_name.trim() : existing.expedition_name,
    expedition_code: updates.expedition_code !== undefined ? updates.expedition_code.trim() : existing.expedition_code,
    expedition_year: updates.expedition_year !== undefined ? Number(updates.expedition_year) : existing.expedition_year,
    description: updates.description !== undefined ? updates.description.trim() : existing.description,
    mission_objective: updates.mission_objective !== undefined ? updates.mission_objective.trim() : existing.mission_objective,
    target_region: updates.target_region !== undefined ? updates.target_region.trim() : existing.target_region,
    lead_organization: updates.lead_organization !== undefined ? updates.lead_organization.trim() : existing.lead_organization,
    expedition_leader: updates.expedition_leader !== undefined ? updates.expedition_leader.trim() : existing.expedition_leader,
    start_date: newStartDate,
    end_date: newEndDate,
    status: updates.status || existing.status,
    notes: updates.notes !== undefined ? updates.notes.trim() : existing.notes,
    updated_at: now,
    updated_by: user.email,
  };

  store.expeditions[index] = updatedRecord;

  // Audit Log
  const nextLogId = store.auditLogs.reduce((max, l) => Math.max(max, l.id), 0) + 1;
  const actionType = statusChanged
    ? (updates.status === 'Approved' ? 'APPROVED' : updates.status === 'Active' ? 'ACTIVATED' : updates.status === 'Completed' ? 'COMPLETED' : updates.status === 'Cancelled' ? 'CANCELLED' : 'STATUS_CHANGED')
    : 'UPDATED';

  store.auditLogs.push({
    id: nextLogId,
    expedition_id: existing.expedition_id,
    user_email: user.email,
    user_name: user.name,
    user_role: user.role,
    action: actionType,
    previous_state: previousState,
    new_state: JSON.stringify(updatedRecord),
    details: statusChanged
      ? `Status transitioned from '${existing.status}' to '${updatedRecord.status}'.`
      : `Expedition details updated by ${user.name}.`,
    timestamp: now,
  });

  saveStorage(store);
  return updatedRecord;
}

export async function deleteExpedition(
  idOrExpId: string | number,
  user: { email: string; name: string; role: string }
): Promise<{ success: boolean; message: string }> {
  const store = ensureStorage();
  const searchStr = String(idOrExpId).trim().toLowerCase();
  const index = store.expeditions.findIndex(
    (e) => String(e.id) === searchStr || e.expedition_id.toLowerCase() === searchStr
  );

  if (index === -1) {
    throw new Error(`Expedition '${idOrExpId}' not found.`);
  }

  const existing = store.expeditions[index];
  const expId = existing.expedition_id;

  // Check for associated operational records
  const linkedPersonnel = store.links.personnel.filter((p) => p.expeditionId === expId).length;
  const linkedTeams = store.links.teams.filter((t) => t.expeditionId === expId).length;
  const linkedLocations = store.links.locations.filter((l) => l.expeditionId === expId).length;
  const linkedCargo = store.links.cargo.filter((c) => c.expeditionId === expId).length;
  const linkedShipments = store.links.shipments.filter((s) => s.expeditionId === expId).length;
  const linkedInventory = store.links.inventory.filter((i) => i.expeditionId === expId).length;
  const linkedAssets = store.links.assets.filter((a) => a.expeditionId === expId).length;

  const totalOperationalRecords = 
    linkedPersonnel + 
    linkedTeams + 
    linkedLocations + 
    linkedCargo + 
    linkedShipments + 
    linkedInventory + 
    linkedAssets;

  if (totalOperationalRecords > 0) {
    // Record audit log of rejected deletion attempt
    const nextLogId = store.auditLogs.reduce((max, l) => Math.max(max, l.id), 0) + 1;
    store.auditLogs.push({
      id: nextLogId,
      expedition_id: expId,
      user_email: user.email,
      user_name: user.name,
      user_role: user.role,
      action: 'DELETE_ATTEMPTED',
      previous_state: JSON.stringify(existing),
      new_state: null,
      details: `Deletion rejected: Expedition has ${totalOperationalRecords} associated operational records.`,
      timestamp: new Date().toISOString(),
    });
    saveStorage(store);

    throw new Error('This expedition cannot be deleted because it contains associated operational records.');
  }

  // If clean, allow deletion
  store.expeditions.splice(index, 1);

  // Audit Log
  const nextLogId = store.auditLogs.reduce((max, l) => Math.max(max, l.id), 0) + 1;
  store.auditLogs.push({
    id: nextLogId,
    expedition_id: expId,
    user_email: user.email,
    user_name: user.name,
    user_role: user.role,
    action: 'DELETED',
    previous_state: JSON.stringify(existing),
    new_state: null,
    details: `Expedition ${expId} (${existing.expedition_name}) was deleted from the registry.`,
    timestamp: new Date().toISOString(),
  });

  saveStorage(store);
  return { success: true, message: `Expedition ${expId} was successfully deleted.` };
}

export async function getExpeditionAuditLogs(expeditionId: string): Promise<ExpeditionAuditLog[]> {
  const store = ensureStorage();
  const searchId = expeditionId.trim().toLowerCase();
  return store.auditLogs
    .filter((l) => l.expedition_id.toLowerCase() === searchId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const store = ensureStorage();
  const exps = store.expeditions;
  const now = new Date();

  const total = exps.length;
  const planned = exps.filter((e) => e.status === 'Planned').length;
  const approved = exps.filter((e) => e.status === 'Approved').length;
  const active = exps.filter((e) => e.status === 'Active').length;
  const completed = exps.filter((e) => e.status === 'Completed').length;
  const cancelled = exps.filter((e) => e.status === 'Cancelled').length;

  const upcoming = exps.filter((e) => {
    return (e.status === 'Planned' || e.status === 'Approved') && new Date(e.start_date) >= now;
  }).length;

  const recent = [...exps]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50);

  return {
    total_expeditions: total,
    planned_expeditions: planned,
    approved_expeditions: approved,
    active_expeditions: active,
    completed_expeditions: completed,
    cancelled_expeditions: cancelled,
    upcoming_expeditions: upcoming,
    recent_expeditions: recent,
  };
}
