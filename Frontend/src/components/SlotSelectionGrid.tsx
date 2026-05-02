import React, { useState, useMemo } from 'react';
import { getLocalDateString } from '../context/DataContext';

type Slot = { status: 'open' | 'closed'; bookedBy: string | null };

// UTC+5:30 timezone offset in hours
const TIMEZONE_OFFSET_HOURS = 5.5;

// Helper function to extract date and hour from DateTime format (startDateTime only)
// Converts from UTC to UTC+5:30
// Assumes 1-hour slots, so endTime = startTime + 1 hour
function extractDateTimeInfo(dateTimeStr: string): { date: string; hour: number } | null {
  try {
    const utcDate = new Date(dateTimeStr);
    if (isNaN(utcDate.getTime())) return null;

    // Convert UTC to UTC+5:30
    const localDate = new Date(utcDate.getTime() + TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000);

    // Extract date and hour using UTC methods on converted time
    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(localDate.getUTCDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const hour = localDate.getUTCHours();
    return { date: dateStr, hour };
  } catch {
    return null;
  }
}

interface SlotSelectionGridProps {
  slotsByDate: Record<string, Record<string, Slot>>;
  onSlotClick?: (date: string, timeSlot: string, slot: Slot) => void;
  title?: string;
  readOnly?: boolean;
  startHour?: number;
  endHour?: number;
  // optionally control which date is shown from parent and be notified when user changes it
  selectedDate?: string;
  onDateChange?: (date: string) => void;
  selectedTimeSlots?: Set<string>;
  showSummary?: boolean;
  showTopSummary?: boolean;
}

// Helper function to initialize default slots for a date
function initializeDefaultSlots(startHour: number, endHour: number): Record<string, Slot> {
  const slots: Record<string, Slot> = {};
  for (let h = startHour; h < endHour; h++) {
    slots[`${h}:00-${h + 1}:00`] = { status: 'open', bookedBy: null };
  }
  return slots;
}

export const SlotSelectionGrid: React.FC<SlotSelectionGridProps> = ({
  slotsByDate,
  onSlotClick,
  title = 'Available Slots',
  readOnly = false,
  startHour = 9,
  endHour = 23,
  selectedDate: controlledDate,
  onDateChange,
  selectedTimeSlots,
  showSummary = true,
  showTopSummary = true,
}) => {

  // Check if a slot time is in the past
  const isPastSlot = (date: string, timeSlot: string): boolean => {
    const now = new Date();
    const currentDate = getLocalDateString(now);
    const currentHour = now.getHours();
    const [startHourStr] = timeSlot.split(':');
    const slotHour = parseInt(startHourStr, 10);

    // If the date is before today, it's past
    if (date < currentDate) {
      return true;
    }

    // If the date is today, check if slot time has passed
    if (date === currentDate) {
      return slotHour < currentHour;
    }

    // Future dates are not past
    return false;
  };

  // Initialize slots with default slots if empty
  const enhancedSlotsByDate = useMemo(() => {
    const today = getLocalDateString(new Date());
    const enhanced: Record<string, Record<string, Slot>> = {};

    // First, ensure today's slots exist
    if (Object.keys(slotsByDate).length === 0) {
      enhanced[today] = initializeDefaultSlots(startHour, endHour);
    } else {
      // Process existing slots with DateTime support
      Object.entries(slotsByDate).forEach(([dateOrDateTime, timeSlots]) => {
        let dateKey = dateOrDateTime;

        // Check if this is a DateTime format (contains T) and extract the date
        if (dateOrDateTime.includes('T')) {
          const dateTimeInfo = extractDateTimeInfo(dateOrDateTime);
          if (dateTimeInfo) {
            dateKey = dateTimeInfo.date;
          }
        }

        if (!enhanced[dateKey]) {
          enhanced[dateKey] = initializeDefaultSlots(startHour, endHour);
        }

        // Merge slots, handling both time slot keys and potential DateTime values (startTime only)
        Object.entries(timeSlots).forEach(([key, slot]) => {
          let slotKey = key;

          // If the key is a DateTime format (startTime), extract hour and create proper time key
          // Assumes 1-hour slots: endTime = startHour + 1
          if (key.includes('T')) {
            const dateTimeInfo = extractDateTimeInfo(key);
            if (dateTimeInfo) {
              const slotEndHour = dateTimeInfo.hour + 1;
              slotKey = `${dateTimeInfo.hour}:00-${slotEndHour}:00`;
            }
          }

          enhanced[dateKey][slotKey] = slot;
        });
      });

      // Ensure today's slots are present
      if (!enhanced[today]) {
        enhanced[today] = initializeDefaultSlots(startHour, endHour);
      }

      // Merge default slots with existing data, keeping API data if it exists
      Object.keys(enhanced).forEach(date => {
        const defaultSlots = initializeDefaultSlots(startHour, endHour);
        const existingSlots = enhanced[date];
        enhanced[date] = { ...defaultSlots, ...existingSlots };
      });
    }

    return enhanced;
  }, [slotsByDate, startHour, endHour]);

  // internal state for uncontrolled mode
  const [internalSelectedDate, setInternalSelectedDate] = useState<string | null>(
    Object.keys(enhancedSlotsByDate).length > 0 ? Object.keys(enhancedSlotsByDate)[0] : null
  );

  // derive the effective date to display. if parent provides selectedDate, use it.
  const selectedDate = controlledDate ?? internalSelectedDate;

  // keep internal state in sync when parent changes date
  React.useEffect(() => {
    if (controlledDate !== undefined) {
      setInternalSelectedDate(controlledDate);
    }
  }, [controlledDate]);

  // if a controlled date is provided but not present in enhanced slots, add a default entry
  if (controlledDate && !enhancedSlotsByDate[controlledDate]) {
    enhancedSlotsByDate[controlledDate] = initializeDefaultSlots(startHour, endHour);
  }

  // when parent controls the date, only expose that single date in the tab list
  let sortedDates = Object.keys(enhancedSlotsByDate).sort();
  if (controlledDate !== undefined) {
    sortedDates = [controlledDate];
  }

  if (sortedDates.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-center text-gray-500">No slots available</p>
      </div>
    );
  }

  const currentDateSlots = selectedDate ? enhancedSlotsByDate[selectedDate] : {};
  const sortedTimes = Object.keys(currentDateSlots).sort((a, b) => {
    const aHour = parseInt(a.split(':')[0], 10);
    const bHour = parseInt(b.split(':')[0], 10);
    return aHour - bHour;
  });

  // Function to check if a slot is booked
  const getSlotColor = (slot: Slot, isPast: boolean, timeSlot: string): string => {
    // Past slot
    if (isPast) {
      return 'bg-slate-100 hover:bg-slate-100 cursor-not-allowed border-slate-200 text-slate-400';
    }

    if (slot.bookedBy !== null) {
      // Booked slot
      return 'bg-rose-50 hover:bg-rose-100 cursor-pointer border-rose-200 text-rose-700';
    }

    // Selected by student
    if (selectedTimeSlots?.has(timeSlot)) {
      return 'bg-slate-900 hover:bg-slate-800 cursor-pointer border-slate-900 text-white shadow-md ring-2 ring-slate-400 ring-offset-1';
    }

    if (slot.status === 'closed') {
      // Manually closed slot
      return 'bg-slate-100 hover:bg-slate-200 cursor-pointer border-slate-200 text-slate-500';
    }
    // Open slot
    return 'bg-teal-50 hover:bg-teal-100 cursor-pointer border-teal-200 text-teal-800';
  };

  const getSlotLabel = (slot: Slot): string => {
    if (slot.bookedBy !== null) {
      return slot.bookedBy;
    }
    return slot.status === 'closed' ? 'Closed' : 'Available';
  };

  const formatDate = (dateStr: string): string => {
    let date: Date;

    // Handle both YYYY-MM-DD and DateTime format
    if (dateStr.includes('T')) {
      date = new Date(dateStr);
    } else {
      date = new Date(dateStr + 'T00:00:00');
    }

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Helper to format time slot display
  const formatTimeSlot = (timeSlot: string): string => {
    // If it's already in HH:00-HH:00 format, return as is
    if (timeSlot.match(/^\d{1,2}:00-\d{1,2}:00$/)) {
      return timeSlot;
    }

    // If it's a DateTime format, extract hour
    const dateTimeInfo = extractDateTimeInfo(timeSlot);
    if (dateTimeInfo) {
      const endHour = dateTimeInfo.hour + 1;
      return `${dateTimeInfo.hour}:00-${endHour}:00`;
    }

    return timeSlot;
  };

  // Calculate booked slots summary
  const bookedSlotsSummary = useMemo(() => {
    const bookedSlots: Array<{ date: string; timeSlot: string; bookedBy: string }> = [];
    const bookedByStudent: Record<string, number> = {};
    Object.entries(enhancedSlotsByDate).forEach(([date, timeSlots]) => {
      Object.entries(timeSlots).forEach(([timeSlot, slot]) => {
        if (slot.bookedBy !== null) {
          bookedSlots.push({ date, timeSlot, bookedBy: slot.bookedBy });
          bookedByStudent[slot.bookedBy] = (bookedByStudent[slot.bookedBy] || 0) + 1;
        }
      });
    });

    return { bookedSlots, bookedByStudent };
  }, [enhancedSlotsByDate]);

  return (
    <div className="flex flex-col">
      <h3 className="text-base sm:text-xl font-bold mb-4 sm:mb-6 text-slate-800 tracking-tight">{title}</h3>

      {/* Booked Slots Summary */}
      {showTopSummary && bookedSlotsSummary.bookedSlots.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-900 mb-2">Booked Slots Summary</p>
          <div className="text-xs text-blue-800 space-y-1">
            {Object.entries(bookedSlotsSummary.bookedByStudent).map(([studentName, count]) => (
              <div key={studentName}>
                <span className="font-semibold">{studentName}:</span> {count} slot{count !== 1 ? 's' : ''} booked
              </div>
            ))}
          </div>
          <p className="text-xs text-blue-700 mt-2 font-medium">Total Booked: {bookedSlotsSummary.bookedSlots.length} slot(s)</p>
        </div>
      )}

      {/* Date Selector */}
      <div className="mb-8">
        <p className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Date</p>
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
          {sortedDates.map((date) => (
            <button
              key={date}
              onClick={() => {
                if (onDateChange) {
                  onDateChange(date);
                } else {
                  setInternalSelectedDate(date);
                }
              }}
              className={`flex-shrink-0 py-2.5 px-5 rounded-full text-sm font-semibold transition-all border ${selectedDate === date
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
            >
              <div className="whitespace-nowrap">{formatDate(date)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-6 sm:mb-8 text-[10px] sm:text-sm bg-slate-50 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100">
        <div className="flex items-center gap-1.5 sm:gap-2 font-medium text-slate-600">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-teal-50 border border-teal-200"></div>
          Available
        </div>
        {selectedTimeSlots !== undefined && (
          <div className="flex items-center gap-1.5 sm:gap-2 font-medium text-slate-600">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-slate-900 border border-slate-900"></div>
            Selected
          </div>
        )}
        <div className="flex items-center gap-1.5 sm:gap-2 font-medium text-slate-600">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-rose-50 border border-rose-200"></div>
          Booked
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 font-medium text-slate-600">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-slate-100 border border-slate-200"></div>
          Closed
        </div>
      </div>

      {/* Slots Grid */}
      <div>
        <p className="text-xs sm:text-sm font-semibold text-slate-500 mb-2 sm:mb-4 uppercase tracking-wider">
          {selectedDate && `Slots for ${formatDate(selectedDate)}`}
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
          {sortedTimes.map((timeSlot) => {
            // guard against missing slot (shouldn't normally happen but avoids runtime errors)
            const slot = currentDateSlots[timeSlot] || { status: 'open' as const, bookedBy: null };
            const isPast = isPastSlot(selectedDate || '', timeSlot);
            const isSelected = selectedTimeSlots?.has(timeSlot) ?? false;
            const colorClass = getSlotColor(slot, isPast, timeSlot);
            const label = isSelected ? '✓ Selected' : getSlotLabel(slot);

            return (
              <button
                key={timeSlot}
                onClick={() => {
                  if (!readOnly && !isPast && onSlotClick) {
                    onSlotClick(selectedDate || '', timeSlot, slot);
                  }
                }}
                disabled={readOnly || isPast}
                className={`
                  relative h-14 sm:h-20 rounded-xl border-2 font-semibold
                  transition-all duration-200 flex flex-col items-center justify-center
                  text-sm leading-tight group overflow-hidden px-1
                  ${colorClass}
                  ${readOnly || isPast ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'}
                `}
                title={`${timeSlot} - ${label}`}
              >
                <div className="font-bold text-xs sm:text-base">{timeSlot.split('-')[0]}</div>
                <div className="text-[10px] sm:text-xs font-medium mt-0.5 opacity-90 truncate w-full px-1">{label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {sortedTimes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No slots available for selected date</p>
        </div>
      )}

      {/* Detailed Booked Slots List */}
      {showSummary && bookedSlotsSummary.bookedSlots.filter(s => s.date === getLocalDateString(new Date())).length > 0 && (
        <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-rose-50 rounded-xl sm:rounded-2xl border border-rose-100">
          <p className="text-xs sm:text-sm font-bold text-rose-900 mb-3 sm:mb-4 tracking-tight">Detailed Booked Slots (Today)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 text-xs">
            {bookedSlotsSummary.bookedSlots
              .filter(slot => slot.date === getLocalDateString(new Date()))
              .sort((a, b) => a.date.localeCompare(b.date) || a.timeSlot.localeCompare(b.timeSlot))
              .map((slot, idx) => (
                <div key={idx} className="p-2.5 sm:p-3 bg-white rounded-lg sm:rounded-xl border border-rose-100 shadow-sm flex flex-col justify-center">
                  <span className="font-bold text-rose-800 text-xs sm:text-sm mb-0.5 sm:mb-1">{slot.bookedBy}</span>
                  <span className="text-[10px] sm:text-xs text-slate-500 font-medium">{formatDate(slot.date)} at {formatTimeSlot(slot.timeSlot)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
