import React, { useState, useMemo } from 'react';
import { Container, Vessel, ContainerJourneyStatus, CargoItem } from '../types';
import { 
  Boxes, 
  Package, 
  Fuel, 
  Apple, 
  Wrench, 
  HeartPulse, 
  Search, 
  Ship, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Anchor, 
  ShieldAlert, 
  ArrowRight,
  Compass,
  Navigation,
  Layers,
  ThermometerSnowflake,
  FileText
} from 'lucide-react';

interface CargoTrackingProps {
  containers: Container[];
  vessels: Vessel[];
  onUpdateContainerStatus?: (containerId: string, newStatus: ContainerJourneyStatus) => void;
  onSelectContainer?: (containerId: string) => void;
}

// Staging stages data
const VOYAGE_STAGES = [
  {
    stage: 1,
    name: 'Goa Port Loading & Customs',
    location: 'Mormugao Port, Goa, India',
    date: '15 Nov 2025',
    status: 'COMPLETED',
    description: 'Cargo consolidation, hazardous materials classification, and container inspection by NCPOR.'
  },
  {
    stage: 2,
    name: 'Cape Town Staging & Polar Bunkering',
    location: 'Port of Cape Town, South Africa',
    date: '02 Dec 2025',
    status: 'COMPLETED',
    description: 'Polar fuel replenishment, cold-chain fresh provisions staging, and polar survival gear loading.'
  },
  {
    stage: 3,
    name: 'Southern Ocean & Roaring Forties',
    location: '52°24\'S, 48°15\'E (Southern Ocean)',
    date: 'In Transit (Current)',
    status: 'ACTIVE',
    description: 'Ice-strengthened transit through Antarctic circumpolar convergence zone toward Prydz Bay.'
  },
  {
    stage: 4,
    name: 'Fast-Ice Mooring & Channel Break',
    location: 'Prydz Bay / Larsemann Hills',
    date: 'ETA: 6 Days',
    status: 'UPCOMING',
    description: 'Mooring to shore-fast winter ice; Ka-32 helicopter recon of offloading channels.'
  },
  {
    stage: 5,
    name: 'Helo-Sling & Crane Offloading',
    location: 'Bharati & Maitri Fast-Ice Moorings',
    date: 'ETA: 9 Days',
    status: 'UPCOMING',
    description: 'Heavy crane and helicopter sling-load delivery of aviation fuel, provisions, and machinery spares.'
  }
];

export const CargoTracking: React.FC<CargoTrackingProps> = ({
  containers,
  vessels,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStationFilter, setSelectedStationFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'manifest' | 'staging'>('manifest');

  // Aggregate all cargo items across the mission containers
  const allCargoItems = useMemo(() => {
    const items: Array<CargoItem & { 
      containerCode: string; 
      destinationStationId: string; 
      status: string;
      hazmat?: string;
      tempReq?: string;
      priority?: string;
    }> = [];

    containers.forEach((cnt) => {
      cnt.items.forEach((item) => {
        let hazmat: string | undefined;
        let tempReq: string | undefined;
        let priority = 'Routine';

        if (item.category.includes('Fuel')) {
          hazmat = 'Class 3 Flammable';
          priority = 'Critical High';
        } else if (item.category.includes('Food')) {
          tempReq = '-20°C Reefer';
          priority = 'High';
        } else if (item.category.includes('Medical')) {
          tempReq = '+4°C Cold Pack';
          priority = 'Urgent Priority';
        }

        items.push({
          ...item,
          containerCode: cnt.code,
          destinationStationId: cnt.destinationStationId,
          status: cnt.status,
          hazmat,
          tempReq,
          priority
        });
      });
    });
    return items;
  }, [containers]);

  // Multi-category aggregations for the cargo manifest
  const categoryTotals = useMemo(() => {
    let fuelKg = 0;
    let foodKg = 0;
    let equipmentKg = 0;
    let medicalKg = 0;

    allCargoItems.forEach((item) => {
      const cat = (item.category || '').toLowerCase();
      const wt = item.weightKg || 0;
      if (cat.includes('fuel')) {
        fuelKg += wt;
      } else if (cat.includes('food') || cat.includes('ration')) {
        foodKg += wt;
      } else if (cat.includes('medical') || cat.includes('health')) {
        medicalKg += wt;
      } else {
        equipmentKg += wt;
      }
    });

    const totalKg = fuelKg + foodKg + equipmentKg + medicalKg;
    return {
      fuelKg,
      foodKg,
      equipmentKg,
      medicalKg,
      totalKg,
      totalTons: (totalKg / 1000).toFixed(1),
    };
  }, [allCargoItems]);

  // Filtered cargo list
  const filteredItems = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    const selCat = (selectedCategory || '').toLowerCase();
    const selStation = (selectedStationFilter || '').toLowerCase();

    return allCargoItems.filter((item) => {
      const name = (item.name || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const code = (item.containerCode || '').toLowerCase();
      const dest = (item.destinationStationId || '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || cat.includes(q) || code.includes(q);
      const matchesCat = selectedCategory === 'ALL' || cat.includes(selCat);
      const matchesStation = selectedStationFilter === 'ALL' || dest === selStation;

      return matchesSearch && matchesCat && matchesStation;
    });
  }, [allCargoItems, searchQuery, selectedCategory, selectedStationFilter]);

  const activeVessel = vessels.find((v) => v.id === 'vessel_golovnin') || vessels[0];

  return (
    <div className="space-y-6">
      {/* Module Title & Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
              <Boxes className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Cargo Manifest & Voyage Staging
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Indian Antarctic Expedition supply manifests, container batches, and Southern Ocean transit stages
              </p>
            </div>
          </div>
        </div>

        {/* Sub-view Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('manifest')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'manifest'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Cargo Manifest</span>
          </button>
          <button
            onClick={() => setActiveTab('staging')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'staging'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ship className="w-3.5 h-3.5" />
            <span>Voyage Staging Stages</span>
          </button>
        </div>
      </div>

      {/* Vessel & Route Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
            <Ship className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">{activeVessel?.name || 'MV Vasiliy Golovnin'}</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Active Polar Carrier
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>Ice Class: <strong>Arc7 Polar Icebreaker</strong></span>
              <span>•</span>
              <span>Speed: <strong>12.4 knots</strong></span>
              <span>•</span>
              <span>Heading: <strong>178° South</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-sans block">Current Fleet Position</span>
            <strong className="text-slate-900">52°24&apos;S, 48°15&apos;E</strong>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-sans block">Total Cargo Onboard</span>
            <strong className="text-blue-700">{categoryTotals.totalTons} Metric Tons</strong>
          </div>
        </div>
      </div>

      {/* Multi-Category Cargo Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Category 1: Fuel */}
        <div 
          onClick={() => setSelectedCategory(selectedCategory === 'Fuel' ? 'ALL' : 'Fuel')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            selectedCategory === 'Fuel' 
              ? 'bg-blue-50/80 border-blue-500 shadow-xs' 
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Aviation & Station Fuel
            </span>
            <div className="p-1.5 rounded-md bg-blue-100/70 text-blue-700">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-2">
            {(categoryTotals.fuelKg / 1000).toFixed(1)} <span className="text-xs font-sans font-normal text-slate-500">Tons</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Jet A-1 Polar & Low-pour Diesel
          </div>
        </div>

        {/* Category 2: Food */}
        <div 
          onClick={() => setSelectedCategory(selectedCategory === 'Food' ? 'ALL' : 'Food')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            selectedCategory === 'Food' 
              ? 'bg-blue-50/80 border-blue-500 shadow-xs' 
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Cold-Chain Rations
            </span>
            <div className="p-1.5 rounded-md bg-emerald-100/70 text-emerald-700">
              <Apple className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-2">
            {(categoryTotals.foodKg / 1000).toFixed(1)} <span className="text-xs font-sans font-normal text-slate-500">Tons</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Freeze-dried rations & protein packs
          </div>
        </div>

        {/* Category 3: Spares */}
        <div 
          onClick={() => setSelectedCategory(selectedCategory === 'Equipment' ? 'ALL' : 'Equipment')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            selectedCategory === 'Equipment' 
              ? 'bg-blue-50/80 border-blue-500 shadow-xs' 
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Scientific Spares & Gear
            </span>
            <div className="p-1.5 rounded-md bg-amber-100/70 text-amber-700">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-2">
            {(categoryTotals.equipmentKg / 1000).toFixed(1)} <span className="text-xs font-sans font-normal text-slate-500">Tons</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Ice drill rig, LIDAR crates & snowcat parts
          </div>
        </div>

        {/* Category 4: Medical */}
        <div 
          onClick={() => setSelectedCategory(selectedCategory === 'Medical' ? 'ALL' : 'Medical')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            selectedCategory === 'Medical' 
              ? 'bg-blue-50/80 border-blue-500 shadow-xs' 
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Medical & Life-Support
            </span>
            <div className="p-1.5 rounded-md bg-rose-100/70 text-rose-700">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-2">
            {(categoryTotals.medicalKg / 1000).toFixed(1)} <span className="text-xs font-sans font-normal text-slate-500">Tons</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Plasma, oxygen & emergency trauma kits
          </div>
        </div>
      </div>

      {/* Main Content Area based on activeTab */}
      {activeTab === 'staging' ? (
        /* Voyage Staging Stages View */
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              <span>Antarctic Resupply Voyage Stages</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronological voyage milestones from Indian ports to Antarctic fast-ice moorings
            </p>
          </div>

          <div className="space-y-4">
            {VOYAGE_STAGES.map((s) => {
              const isCompleted = s.status === 'COMPLETED';
              const isActive = s.status === 'ACTIVE';

              return (
                <div 
                  key={s.stage}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive 
                      ? 'bg-blue-50/60 border-blue-400 ring-2 ring-blue-500/20 shadow-xs' 
                      : isCompleted
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-50/50 border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mt-0.5 ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : isActive
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.stage}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{s.name}</h4>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isActive
                              ? 'bg-blue-100 text-blue-800 border border-blue-200 font-bold'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {s.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-mono text-slate-600 sm:text-right pl-11 sm:pl-0">
                      <span className="text-[11px] text-slate-400 block font-sans">Milestone Timing</span>
                      <strong>{s.date}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 pl-11">
                    {s.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Cargo Manifest Table View */
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          {/* Table Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Cargo Manifest Items ({filteredItems.length})
              </h3>
              <span className="text-xs text-slate-500">
                Total Payload: <strong className="text-blue-700 font-mono">{categoryTotals.totalTons} Metric Tons</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search item, lot, or container..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 sm:w-56"
                />
              </div>

              {/* Station Filter */}
              <select
                value={selectedStationFilter}
                onChange={(e) => setSelectedStationFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Stations</option>
                <option value="bharati">Bharati Station</option>
                <option value="maitri">Maitri Station</option>
              </select>

              {/* Reset Filter Button */}
              {(selectedCategory !== 'ALL' || selectedStationFilter !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSelectedStationFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded bg-blue-50 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Clean Items Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Cargo Item & Specification</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Container ID</th>
                  <th className="p-3">Destination</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3 text-right">Net Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 font-medium text-slate-900">
                      <div>{item.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono">Lot: {item.id}</span>
                        {item.hazmat && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                            {item.hazmat}
                          </span>
                        )}
                        {item.tempReq && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono">
                            {item.tempReq}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        item.category.includes('Fuel') 
                          ? 'bg-blue-50 text-blue-800 border-blue-200' 
                          : item.category.includes('Food') 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : item.category.includes('Medical')
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-medium text-slate-600">
                      {item.containerCode}
                    </td>
                    <td className="p-3 uppercase font-medium text-slate-700">
                      {item.destinationStationId} Station
                    </td>
                    <td className="p-3 text-right font-mono">
                      {(item.quantity ?? 0).toLocaleString()} {item.unit}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-blue-700">
                      {((item.weightKg ?? 0) / 1000).toFixed(2)} t
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No cargo items match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
