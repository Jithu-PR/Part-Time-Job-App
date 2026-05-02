import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, getLocalDateString } from '../context/DataContext';
import { SlotSelectionGrid } from './SlotSelectionGrid';

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
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium tracking-wide">Loading Dashboard...</p>
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
      <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2 sm:mb-3">Student Dashboard</h1>
            <p className="text-slate-400 text-sm sm:text-lg text-balance">Book your preferred time slots at available restaurants.</p>
          </div>
          <button
            onClick={handleLogout}
            className="self-start px-4 py-2 sm:px-5 sm:py-2.5 bg-slate-800 hover:bg-rose-600 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-colors border border-slate-700 hover:border-rose-500 shadow-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Booking Form Section */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
        <h2 className="text-base sm:text-xl font-bold mb-3 sm:mb-6 text-slate-800 tracking-tight">Booking Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6">
          <div>
            <label className="block text-[10px] sm:text-sm font-medium text-slate-600 mb-1 sm:mb-2">Select Restaurant</label>
            <select
              className="border border-slate-200 bg-slate-50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-xs sm:text-base w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none appearance-none"
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
                <option key={company.id} value={company.id}>
                  {company.name || company.id} ({company.startHour}:00 - {company.endHour}:00)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] sm:text-sm font-medium text-slate-600 mb-1 sm:mb-2">Select Position</label>
            <select
              className="border border-slate-200 bg-slate-50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-xs sm:text-base w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none appearance-none"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {availableRoles.map(r => (
                <option key={r} value={r}>
                  {r} - ${currentCompany.roles[r]?.salary || 'N/A'}/hour
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Slot Selection Section */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
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
            // clear selection when date changes to avoid confusion
          }}
          selectedTimeSlots={selectedSlots.get(viewDate)}
        />
        {status && (
          <div className={`mb-2 p-2 sm:p-4 rounded-lg sm:rounded-xl border text-[10px] sm:text-base ${status.includes('success') || status.includes('Successfully')
            ? 'bg-green-50 border-green-200 text-green-800'
            : status.includes('selected')
              ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
              : 'bg-red-50 border-red-200 text-red-800'
            }`}>
            {status}
          </div>
        )}
      </div>

      {/* Actions Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
        <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
          <div className="text-sm text-slate-500">
            {selectedSlots.size > 0 && (
              <span className="font-semibold text-slate-700 bg-slate-100 px-4 py-2 rounded-full">
                {[...selectedSlots.values()].reduce((acc, s) => acc + s.size, 0)} slot(s) selected across {selectedSlots.size} date(s)
              </span>
            )}
            {selectedSlots.size === 0 && (
              <span>No slots selected.</span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              className="flex-1 sm:flex-none bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-all shadow-sm"
              onClick={() => setSelectedSlots(new Map())}
            >
              Clear
            </button>
            <button
              className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-sm disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
              onClick={handleBookSelected}
              disabled={selectedSlots.size === 0 || isBooking}
            >
              {isBooking ? 'Booking...' : 'Book Slots'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
