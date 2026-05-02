import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { SlotSelectionGrid } from './SlotSelectionGrid';

type Slot = { status: 'open' | 'closed'; bookedBy: string | null };

interface SlotBookingPanelProps {
  companyId: string;
  roleName: string;
  readOnly?: boolean;
}

export const SlotBookingPanel: React.FC<SlotBookingPanelProps> = ({
  companyId,
  roleName,
  readOnly = false,
}) => {
  const { data, toggleSlot } = useData();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Get the company and role data
  let roleData: any = null;
  let company: any = null;
  
  if (Array.isArray(data)) {
    company = data.find(c => c.id === companyId);
    roleData = company?.roles[roleName];
  } else if (data && data.id === companyId) {
    company = data;
    roleData = data.roles[roleName];
  }

  if (!roleData || !company) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-center text-gray-500">No role data available</p>
      </div>
    );
  }

  const handleSlotClick = (date: string, timeSlot: string, slot: Slot) => {
    if (readOnly) return;

    // Toggle slot for company owners (opens/closes the slot)
    if (!slot.bookedBy) {
      toggleSlot(companyId, roleName, timeSlot, date);
      setMessage({
        type: 'success',
        text: `Slot ${timeSlot} ${slot.status === 'open' ? 'closed' : 'opened'}`,
      });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">{roleName}</h2>
        <p className="text-gray-600">{roleData.desc || 'No description'}</p>
        <p className="text-sm text-gray-500 mt-1">Salary: ${roleData.salary}</p>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <SlotSelectionGrid
        slotsByDate={roleData.slotsByDate}
        onSlotClick={handleSlotClick}
        title={`${roleName} Slots`}
        readOnly={readOnly}
        startHour={company.startHour}
        endHour={company.endHour}
      />
    </div>
  );
};
