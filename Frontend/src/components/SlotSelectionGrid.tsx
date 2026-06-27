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
      return 'bg-[var(--black)] border-dashed border-[rgba(255,255,255,0.05)] text-zinc-700 cursor-not-allowed';
    }

    if (slot.bookedBy !== null) {
      // Booked slot
      return 'bg-[var(--orange)] border-[var(--orange)] text-[var(--white)] cursor-pointer shadow-md';
    }

    // Selected by student
    if (selectedTimeSlots?.has(timeSlot)) {
      return 'bg-[var(--gold)] border-[var(--gold)] text-[var(--black)] cursor-pointer font-bold shadow-md';
    }

    if (slot.status === 'closed') {
      // Manually closed slot
      return 'bg-[var(--slate)] border-[rgba(255,255,255,0.08)] text-[var(--muted)] cursor-pointer';
    }
    // Open slot
    return 'bg-[var(--black)] border border-[var(--gold)] text-[var(--gold)] hover:bg-[rgba(232,200,74,0.04)] cursor-pointer';
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
      <h3 className="font-['Bebas Neue'] text-2xl uppercase tracking-wider text-[var(--gold)] mb-4">{title}</h3>

      {/* Booked Slots Summary */}
      {showTopSummary && bookedSlotsSummary.bookedSlots.length > 0 && (
        <div className="mb-6 p-4 bg-[var(--black)] border border-[rgba(232,200,74,0.15)] rounded">
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--gold)] mb-2 font-bold">Booked Shifts Summary</p>
          <div className="text-xs font-mono text-[var(--white)] opacity-85 space-y-1">
            {Object.entries(bookedSlotsSummary.bookedByStudent).map(([studentName, count]) => (
              <div key={studentName}>
                <span className="text-[var(--gold)]">{studentName}:</span> {count} shift{count !== 1 ? 's' : ''} booked
              </div>
            ))}
          </div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mt-2">Total Booked: {bookedSlotsSummary.bookedSlots.length} shift(s)</p>
        </div>
      )}

      {/* Date Selector */}
      <div className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] mb-3">Select Date</p>
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
              className={`flex-shrink-0 py-2 px-5 rounded text-xs font-mono uppercase tracking-wider transition-all border ${selectedDate === date
                ? 'bg-[var(--gold)] text-[var(--black)] border-[var(--gold)] font-bold shadow-md'
                : 'bg-[var(--black)] text-[var(--muted)] border-[rgba(232,200,74,0.1)] hover:text-[var(--white)] hover:bg-[var(--mid)]'
                }`}
            >
              <div className="whitespace-nowrap">{formatDate(date)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-6 sm:mb-8 text-[10px] bg-[var(--black)] p-4 border border-[rgba(232,200,74,0.15)] rounded font-mono uppercase tracking-wider">
        <div className="flex items-center gap-2 text-[var(--white)] opacity-85">
          <div className="w-3 h-3 rounded-sm bg-[var(--black)] border border-[var(--gold)]"></div>
          Available
        </div>
        {selectedTimeSlots !== undefined && (
          <div className="flex items-center gap-2 text-[var(--white)] opacity-85">
            <div className="w-3 h-3 rounded-sm bg-[var(--gold)]"></div>
            Selected
          </div>
        )}
        <div className="flex items-center gap-2 text-[var(--white)] opacity-85">
          <div className="w-3 h-3 rounded-sm bg-[var(--orange)]"></div>
          Booked
        </div>
        <div className="flex items-center gap-2 text-[var(--white)] opacity-85">
          <div className="w-3 h-3 rounded-sm bg-[var(--slate)] border border-[rgba(255,255,255,0.08)]"></div>
          Closed
        </div>
      </div>

      {/* Slots Grid */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] mb-3">
          {selectedDate && `Shifts for ${formatDate(selectedDate)}`}
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
          {sortedTimes.map((timeSlot) => {
            // guard against missing slot (shouldn't normally happen but avoids runtime errors)
            const slot = currentDateSlots[timeSlot] || { status: 'open' as const, bookedBy: null };
            const isPast = isPastSlot(selectedDate || '', timeSlot);
            const isSelected = selectedTimeSlots?.has(timeSlot) ?? false;
            const colorClass = getSlotColor(slot, isPast, timeSlot);
            const label = isSelected ? '✓ Selected' : isPast ? 'Past' : getSlotLabel(slot);

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
                  relative h-14 sm:h-20 rounded border font-mono
                  transition-all duration-200 flex flex-col items-center justify-center
                  text-sm leading-tight group overflow-hidden px-1
                  ${colorClass}
                  ${readOnly || isPast ? 'opacity-55 cursor-not-allowed' : 'hover:scale-[1.02]'}
                `}
                title={`${timeSlot} - ${label}`}
              >
                <div className="font-bold text-xs sm:text-sm">{timeSlot.split('-')[0]}</div>
                <div className="text-[9px] font-semibold mt-0.5 opacity-90 truncate w-full px-1 text-center uppercase tracking-wider">{label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {sortedTimes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">No shifts available for selected date</p>
        </div>
      )}

      {/* Detailed Booked Slots List */}
      {showSummary && bookedSlotsSummary.bookedSlots.filter(s => s.date === getLocalDateString(new Date())).length > 0 && (
        <div className="mt-6 sm:mt-8 p-4 bg-[var(--black)] border border-[rgba(232,200,74,0.15)] rounded">
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--gold)] mb-3 font-bold">Detailed Booked Shifts (Today)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 text-xs">
            {bookedSlotsSummary.bookedSlots
              .filter(slot => slot.date === getLocalDateString(new Date()))
              .sort((a, b) => a.date.localeCompare(b.date) || a.timeSlot.localeCompare(b.timeSlot))
              .map((slot, idx) => (
                <div key={idx} className="p-3 bg-[var(--slate)] rounded border border-[rgba(255,255,255,0.06)] flex flex-col justify-center">
                  <span className="font-bold text-[var(--white)] text-sm mb-1">{slot.bookedBy}</span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">{formatDate(slot.date)} at {formatTimeSlot(slot.timeSlot)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

