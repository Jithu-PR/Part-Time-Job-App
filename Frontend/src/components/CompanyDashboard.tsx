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
        <div className="fm-loader">
          <div className="logo">Free<span>Mason</span></div>
          <div className="fm-loader-sub">Loading Dashboard…</div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--black)]/80 backdrop-blur-sm cursor-wait">
          <div className="bg-[var(--slate)] border border-[rgba(232,200,74,0.2)] p-6 sm:p-8 rounded-lg shadow-xl flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[var(--mid)] border-t-[var(--gold)] rounded-full animate-spin"></div>
            <p className="text-[var(--white)] font-mono uppercase tracking-wider text-xs font-bold">Saving Changes...</p>
          </div>
        </div>
      )}
      
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
              {isRestaurantOwner ? 'Restaurant Management Dashboard' : 'Company Dashboard'}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="self-start btn-outline py-2 px-5 font-semibold text-xs tracking-wider"
          >
            Logout
          </button>
        </div>

        {/* global date selector for owners */}
        {isRestaurantOwner && (
          <div className="mt-6 sm:mt-8 relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <label htmlFor="view-date" className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">
              View date:
            </label>
            <input
              id="view-date"
              type="date"
              value={viewDate}
              onChange={(e) => setViewDate(e.target.value)}
              className="border border-[rgba(232,200,74,0.15)] bg-[var(--black)] text-[var(--white)] rounded px-3 py-1.5 text-xs font-mono uppercase tracking-wider focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)] transition-all"
            />
          </div>
        )}
      </div>

      {/* Save status message */}
      {saveMessage && (
        <div className={`p-4 rounded border text-xs font-mono uppercase tracking-wider ${
          saveMessage.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
            : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
        }`}>
          {saveMessage.type === 'success' ? '✓' : '⚠️'} {saveMessage.text}
        </div>
      )}

      {/* Companies Section */}
      {companies.map((company) => (
        <div key={company.id} className="space-y-8">
          {/* Company Header */}
          <div className="bg-[var(--slate)] border border-[rgba(232,200,74,0.15)] rounded-lg p-6 sm:p-8 shadow-sm">
            <h2 className="font-['Bebas Neue'] text-3xl uppercase tracking-wider text-[var(--gold)] mb-4">
              {company.name || `Company ${company.id}`}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-[var(--black)] p-4 rounded border border-[rgba(232,200,74,0.1)] flex flex-col justify-center">
                <p className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider mb-1">Operating Hours</p>
                <p className="text-base font-bold text-[var(--white)]">
                  {company.startHour}:00 - {company.endHour}:00
                </p>
              </div>
              <div className="bg-[var(--black)] p-4 rounded border border-[rgba(242,98,46,0.15)] flex flex-col justify-center">
                <p className="text-[10px] font-mono text-[var(--orange)] uppercase tracking-wider mb-1">Total Positions</p>
                <p className="text-base font-bold text-[var(--white)]">
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
                <div key={roleName} className="bg-[var(--slate)] border border-[rgba(232,200,74,0.15)] rounded-lg p-6 sm:p-8 shadow-sm flex flex-col">
                  {/* Role Header */}
                  <div className="mb-6 border-b border-[rgba(255,255,255,0.06)] pb-6">
                    <h3 className="font-['Bebas Neue'] text-2xl uppercase tracking-wider text-[var(--gold)]">{roleName}</h3>
                    <p className="text-xs text-[var(--white)] opacity-60 mt-1.5 font-sans leading-relaxed">{roleData.desc || 'No description'}</p>
                    <div className="flex items-baseline gap-1.5 mt-4">
                      <span className="text-2xl font-mono font-bold text-[var(--white)]">${roleData.salary}</span>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">/ hour</span>
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
                    <div className="pt-4 mt-auto border-t border-[rgba(255,255,255,0.06)]">
                      <button
                        onClick={() => handleSaveRoleSlots(roleName)}
                        disabled={saveLoading === roleName || loading}
                        className="w-full btn-primary py-3.5 rounded text-xs uppercase tracking-wider font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {saveLoading === roleName ? (
                          <>
                            <span className="inline-block animate-spin mr-3 border-2 border-[var(--black)] border-t-[var(--white)] rounded-full w-4 h-4"></span>
                            Saving shifts...
                          </>
                        ) : (
                          `Save Shift Configuration`
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {Object.keys(company.roles).length === 0 && (
            <div className="bg-[var(--slate)] border border-[rgba(232,200,74,0.1)] rounded p-8 text-center">
              <p className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">No positions available for this restaurant</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CompanyDashboard;
