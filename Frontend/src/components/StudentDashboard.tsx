import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, getLocalDateString } from '../context/DataContext';
import { SlotSelectionGrid } from './SlotSelectionGrid';
import TodayBookings from './TodayBookings';

type Slot = { status: 'open' | 'closed'; bookedBy: string | null };

const StudentDashboard: React.FC = () => {
  const { data, bookSlotApi, fetchRestaurantData, loading } = useData();
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState<string | number | null>(null);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  // Map<date, Set<timeSlot>> — mirrors CompanyDashboard's per-date slot structure
  const [selectedSlots, setSelectedSlots] = useState<Map<string, Set<string>>>(new Map());
  const [viewDate, setViewDate] = useState<string>(() => getLocalDateString(new Date()));
  const [isBooking, setIsBooking] = useState(false);
  const [activeTab, setActiveTab] = useState<'book' | 'today'>('book');

  // Fetch restaurant data on component mount
  useEffect(() => {
    fetchRestaurantData();
    console.log('Fetching restaurant data');
  }, []);

  // Initialize company and role when data loads
  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      const firstCompany = data[0];
      setCompanyId(firstCompany.id ?? null);
      const firstRole = Object.keys(firstCompany.roles)[0];
      setRole(firstRole);
    }
  }, [data]);

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="fm-loader">
          <div className="logo">Free<span>Mason</span></div>
          <div className="fm-loader-sub">Loading Dashboard…</div>
        </div>
      </div>
    );
  }

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Student Dashboard</h2>
        <p className="text-gray-500">No restaurants available at this time</p>
      </div>
    );
  }

  const currentCompany = data.find(c => String(c.id) === String(companyId));
  if (!currentCompany) {
    return (
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Student Dashboard</h2>
        <p className="text-gray-500">Company not found</p>
      </div>
    );
  }

  const handleSlotClick = (date: string, timeSlot: string, slot: Slot) => {
    if (slot.bookedBy) {
      setStatus('Cannot select already booked slots');
      setTimeout(() => setStatus(''), 3000);
      return;
    }

    // Toggle slot selection — key is the date, value is a Set of timeSlots
    // (mirrors CompanyDashboard's slotsByDate structure)
    const newSelected = new Map(selectedSlots);
    const existing = newSelected.get(date);

    if (!existing) {
      newSelected.set(date, new Set([timeSlot]));
    } else if (existing.has(timeSlot)) {
      existing.delete(timeSlot);
      if (existing.size === 0) newSelected.delete(date);
    } else {
      existing.add(timeSlot);
    }

    setSelectedSlots(newSelected);
    setStatus(`Selected ${timeSlot} on ${date}`);
    setTimeout(() => setStatus(''), 2000);
  };

  const handleBookSelected = async () => {
    console.log("emtered ")

    if (selectedSlots.size === 0) {
      setStatus('Please select at least one slot');
      return;
    }

    setIsBooking(true);
    setStatus('Booking slots...');

    // Book each selected slot via API — date is the Map key, timeSlots are the Set values
    let successCount = 0;
    let failMessages: string[] = [];

    for (const [date, timeSlots] of selectedSlots) {
      for (const timeSlot of timeSlots) {
        const result = await bookSlotApi(String(companyId), role, timeSlot, date);
        if (result.ok) {
          successCount++;
        } else {
          failMessages.push(result.message);
        }
      }
    }

    setIsBooking(false);

    if (successCount > 0) {
      setStatus(`Successfully booked ${successCount} slot(s)!`);
      setSelectedSlots(new Map());
      await fetchRestaurantData();
    } else {
      setStatus(failMessages[0] || 'Failed to book slots');
    }

    setTimeout(() => setStatus(''), 3000);
  };

  const availableRoles = Object.keys(currentCompany.roles);
  const currentRole = currentCompany.roles[role];
  const roleSlots = currentRole?.slotsByDate || {};

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Header Section */}
      <div className="bg-[var(--slate)] border border-[rgba(232,200,74,0.2)] rounded-lg p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(232,200,74,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,200,74,0.04) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="logo text-3xl mb-1">
              Free<span>Mason</span>
            </div>
            <p className="text-[var(--muted)] font-mono text-xs uppercase tracking-wider">
              Student / Worker Dashboard
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="self-start btn-outline py-2 px-5 font-semibold text-xs tracking-wider"
          >
            Logout
          </button>
        </div>
        
        <div className="mt-8 flex gap-2 relative z-10">
          <button 
            onClick={() => setActiveTab('book')}
            className={`px-5 py-2.5 rounded font-mono text-xs uppercase tracking-wider transition-all ${
              activeTab === 'book' 
                ? 'bg-[var(--gold)] text-[var(--black)] font-bold shadow-md' 
                : 'bg-[var(--black)] text-[var(--muted)] hover:text-[var(--white)] border border-[rgba(232,200,74,0.1)]'
            }`}
          >
            ⚡ Book Slots
          </button>
          <button 
            onClick={() => setActiveTab('today')}
            className={`px-5 py-2.5 rounded font-mono text-xs uppercase tracking-wider transition-all ${
              activeTab === 'today' 
                ? 'bg-[var(--gold)] text-[var(--black)] font-bold shadow-md' 
                : 'bg-[var(--black)] text-[var(--muted)] hover:text-[var(--white)] border border-[rgba(232,200,74,0.1)]'
            }`}
          >
            📅 Today's Bookings
          </button>
        </div>
      </div>

      {activeTab === 'book' && (
        <div className="space-y-8">
          {/* Booking Form Section */}
          <div className="bg-[var(--slate)] border border-[rgba(232,200,74,0.15)] rounded-lg p-6 sm:p-8 shadow-sm">
            <h2 className="font-['Bebas Neue'] text-2xl uppercase tracking-wider text-[var(--gold)] mb-6">
              Booking Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-2">
              <div>
                <label className="block text-[var(--white)] opacity-80 font-mono text-[10px] uppercase tracking-wider mb-2">
                  Select Restaurant
                </label>
                <select
                  className="w-full px-4 py-3 bg-[var(--black)] border border-[rgba(232,200,74,0.15)] rounded text-[var(--white)] focus:outline-none focus:border-[var(--gold)] transition-all font-sans text-sm appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e8c84a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1em'
                  }}
                  value={companyId || ''}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setCompanyId(selectedId);
                    const selectedCompany = data.find(c => String(c.id) === selectedId);
                    if (selectedCompany) {
                      const firstRole = Object.keys(selectedCompany.roles)[0];
                      setRole(firstRole);
                    }
                  }}
                >
                  {data.map(company => (
                    <option key={company.id} value={company.id} className="bg-[var(--slate)]">
                      {company.name || company.id} ({company.startHour}:00 - {company.endHour}:00)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[var(--white)] opacity-80 font-mono text-[10px] uppercase tracking-wider mb-2">
                  Select Position
                </label>
                <select
                  className="w-full px-4 py-3 bg-[var(--black)] border border-[rgba(232,200,74,0.15)] rounded text-[var(--white)] focus:outline-none focus:border-[var(--gold)] transition-all font-sans text-sm appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e8c84a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1em'
                  }}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {availableRoles.map(r => (
                    <option key={r} value={r} className="bg-[var(--slate)]">
                      {r} - ${currentCompany.roles[r]?.salary || 'N/A'}/hour
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Slot Selection Section */}
          <div className="bg-[var(--slate)] border border-[rgba(232,200,74,0.15)] rounded-lg p-6 sm:p-8 shadow-sm">
            <SlotSelectionGrid
              slotsByDate={roleSlots}
              onSlotClick={handleSlotClick}
              title={`${currentCompany.name} - ${role}`}
              readOnly={isBooking}
              showSummary={false}
              showTopSummary={false}
              startHour={currentCompany.startHour}
              endHour={currentCompany.endHour}
              selectedDate={viewDate}
              onDateChange={(d) => {
                setViewDate(d);
              }}
              selectedTimeSlots={selectedSlots.get(viewDate)}
            />
            {status && (
              <div className={`mt-4 p-4 rounded border text-xs font-mono uppercase tracking-wider ${
                status.includes('success') || status.includes('Successfully')
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : status.includes('selected')
                    ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}>
                {status}
              </div>
            )}
          </div>

          {/* Actions Section */}
          <div className="bg-[var(--slate)] border border-[rgba(232,200,74,0.15)] rounded-lg p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
              <div className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">
                {selectedSlots.size > 0 ? (
                  <span className="text-[var(--gold)] font-bold bg-[var(--black)] border border-[rgba(232,200,74,0.15)] px-4 py-2.5 rounded">
                    {[...selectedSlots.values()].reduce((acc, s) => acc + s.size, 0)} slot(s) selected across {selectedSlots.size} date(s)
                  </span>
                ) : (
                  <span>No slots selected yet. Click slots above.</span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  className="flex-1 sm:flex-none btn-outline font-bold py-3 px-6 rounded text-xs uppercase tracking-wider"
                  onClick={() => setSelectedSlots(new Map())}
                >
                  Clear Selection
                </button>
                <button
                  className="flex-1 sm:flex-none btn-primary py-3 px-8 rounded text-xs uppercase tracking-wider font-bold"
                  onClick={handleBookSelected}
                  disabled={selectedSlots.size === 0 || isBooking}
                >
                  {isBooking ? 'Booking...' : 'Book Selected Slots'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'today' && <TodayBookings />}
    </div>
  );
};

export default StudentDashboard;
