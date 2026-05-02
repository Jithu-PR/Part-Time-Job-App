import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { SlotSelectionGrid } from './SlotSelectionGrid';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Slot type defined elsewhere if needed, otherwise omitted

const CompanyDashboard: React.FC = () => {
  const { data, role, toggleSlot, fetchRestaurantData, loading, saveRoleSlots } = useData();
  const navigate = useNavigate();
  const [saveLoading, setSaveLoading] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewDate, setViewDate] = useState<string>(new Date().toISOString().slice(0, 10));
  
  // Fetch restaurant data on component mount
  useEffect(() => {
    fetchRestaurantData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleToggleSlot = (roleName: string, date: string, timeSlot: string) => {
    if (!Array.isArray(data) && data) {
      toggleSlot(String(data.id), roleName, timeSlot, date);
    }
  };

  const handleSaveRoleSlots = async (roleName: string) => {
    setSaveLoading(roleName);
    setSaveMessage(null);
    
    const roleData = !Array.isArray(data) && data ? data.roles[roleName] : null;
    if (!roleData) {
      setSaveMessage({
        type: 'error',
        text: `Role "${roleName}" not found`,
      });
      setSaveLoading(null);
      return;
    }
    
    const result = await saveRoleSlots(roleName, roleData.slotsByDate);
    
    setSaveMessage({
      type: result.ok ? 'success' : 'error',
      text: result.message,
    });
    setSaveLoading(null);
    
    // Clear message after 5 seconds
    setTimeout(() => setSaveMessage(null), 5000);
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

  // For company view - data is a single Company
  // For student view - data is an array of Company[]
  const companies = Array.isArray(data) ? data : data ? [data] : [];
  const isRestaurantOwner = role === 'Restaurant Owner' && !Array.isArray(data) && data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative">
      {/* Full Screen Loading Overlay */}
      {saveLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm cursor-wait">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-800 font-bold tracking-wide text-sm sm:text-base">Saving Changes...</p>
          </div>
        </div>
      )}
      {/* Header Section */}
      <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2 sm:mb-3">
              {isRestaurantOwner ? 'Restaurant Management Dashboard' : 'Company Dashboard'}
            </h1>
            <p className="text-slate-400 text-sm sm:text-lg">
              {isRestaurantOwner ? 'Manage your restaurant shifts and availability' : 'View available positions'}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="self-start px-4 py-2 sm:px-5 sm:py-2.5 bg-slate-800 hover:bg-rose-600 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-colors border border-slate-700 hover:border-rose-500 shadow-sm"
          >
            Logout
          </button>
        </div>
        {/* global date selector for owners */}
        {isRestaurantOwner && (
          <div className="mt-6 sm:mt-8 relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <label htmlFor="view-date" className="text-xs sm:text-sm font-medium text-slate-300">
              View date:
            </label>
            <input
              id="view-date"
              type="date"
              value={viewDate}
              onChange={(e) => setViewDate(e.target.value)}
              className="border border-slate-700 bg-slate-800 text-white rounded-lg sm:rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>
        )}
      </div>

      {/* Save status message */}
      {saveMessage && (
        <div className={`p-4 rounded-lg border ${saveMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {saveMessage.text}
        </div>
      )}

      {/* Companies Section */}
      {companies.map((company) => (
        <div key={company.id} className="space-y-8">
          {/* Company Header */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6 tracking-tight">{company.name || `Company ${company.id}`}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="bg-slate-50 p-3 sm:p-5 rounded-lg sm:rounded-2xl border border-slate-100 flex flex-col justify-center">
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mb-0.5 sm:mb-1">Operating Hours</p>
                <p className="text-sm sm:text-xl font-bold text-slate-800">
                  {company.startHour}:00 - {company.endHour}:00
                </p>
              </div>
              <div className="bg-indigo-50 p-3 sm:p-5 rounded-lg sm:rounded-2xl border border-indigo-100 flex flex-col justify-center">
                <p className="text-[10px] sm:text-xs text-indigo-600 font-medium mb-0.5 sm:mb-1">Total Positions</p>
                <p className="text-sm sm:text-xl font-bold text-indigo-900">
                  {Object.keys(company.roles).length}
                </p>
              </div>
            </div>
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {Object.keys(company.roles).map((roleName) => {
              const roleData = company.roles[roleName];
              
              return (
                <div key={roleName} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col">
                  {/* Role Header */}
                  <div className="mb-4 sm:mb-6 border-b border-slate-100 pb-4 sm:pb-6">
                    <h3 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight">{roleName}</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">{roleData.desc || 'No description'}</p>
                    <div className="flex items-baseline gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                      <span className="text-2xl sm:text-3xl font-bold text-slate-800">${roleData.salary}</span>
                      <span className="text-xs sm:text-sm text-slate-500 font-medium">/hour</span>
                    </div>
                  </div>

                  {/* Slot Selection Grid */}
                  <div className="flex-1 mb-8">
                    <SlotSelectionGrid
                      slotsByDate={roleData.slotsByDate}
                      onSlotClick={(date, timeSlot, slot) => {
                        if (!slot.bookedBy) {
                          handleToggleSlot(roleName, date, timeSlot);
                        }
                      }}
                      title={`Manage Slots`}
                      readOnly={!isRestaurantOwner}
                      showTopSummary={false}
                      startHour={company.startHour}
                      endHour={company.endHour}
                      selectedDate={viewDate}
                      onDateChange={setViewDate}
                    />
                  </div>

                  {/* Save Button - Only for Restaurant Owners */}
                  {isRestaurantOwner && (
                    <div className="pt-4 sm:pt-6 mt-auto">
                      <button
                        onClick={() => handleSaveRoleSlots(roleName)}
                        disabled={saveLoading === roleName || loading}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 sm:py-4 px-4 rounded-xl sm:rounded-2xl text-xs sm:text-base border-transparent transition-colors shadow-md active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {saveLoading === roleName ? (
                          <>
                            <span className="inline-block animate-spin mr-3 border-2 border-slate-400 border-t-white rounded-full w-5 h-5"></span>
                            Saving...
                          </>
                        ) : (
                          `Save Changes`
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {Object.keys(company.roles).length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500">No positions available for this restaurant</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CompanyDashboard;
