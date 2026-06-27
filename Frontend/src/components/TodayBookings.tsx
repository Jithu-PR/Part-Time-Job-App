import React, { useEffect, useState } from 'react';
import { getCurrentUser } from '../utils/authHelper';

interface Booking {
  id: number;
  documentId: string;
  startDateTime: string;
  slotStatus: string;
  restaurant?: {
    name: string;
  };
  job?: {
    title: string;
  };
}

const TodayBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;
        
        const jwt = localStorage.getItem('jwt');
        
        // Today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/slots?filters[booked_by][documentId][$eq]=${user.documentId}&filters[startDateTime][$gte]=${today.toISOString()}&filters[startDateTime][$lt]=${tomorrow.toISOString()}&populate[restaurant]=*&populate[job]=*`,
          {
            headers: {
              Authorization: `Bearer ${jwt}`
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setBookings(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch bookings", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[var(--mid)] border-t-[var(--gold)] rounded-full animate-spin"></div>
          <p className="text-[var(--muted)] font-mono text-xs uppercase tracking-wider">Loading today's bookings...</p>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-[var(--slate)] border border-[rgba(232,200,74,0.15)] rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-[var(--black)] rounded-full border border-[rgba(232,200,74,0.1)] flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[var(--gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="font-['Bebas Neue'] text-2xl uppercase tracking-wider text-[var(--gold)] mb-2">No Bookings Today</h3>
        <p className="text-[var(--muted)] text-sm font-sans">You don't have any shifts booked for today.</p>
      </div>
    );
  }

  // Sort bookings by time
  const sortedBookings = [...bookings].sort((a, b) => 
    new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedBookings.map((booking) => {
        const date = new Date(booking.startDateTime);
        const startHour = date.getHours();
        const endHour = startHour + 1;
        
        return (
          <div key={booking.documentId} className="bg-[var(--slate)] border border-[rgba(232,200,74,0.15)] p-6 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-[var(--gold)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--black)] border border-[rgba(232,200,74,0.1)] rounded-full flex items-center justify-center text-[var(--gold)] shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-['Bebas Neue'] text-2xl uppercase tracking-wider text-[var(--gold)] leading-none">{booking.restaurant?.name || 'Unknown Restaurant'}</h3>
                <p className="text-[var(--white)] opacity-60 font-mono text-xs uppercase tracking-widest mt-1.5">{booking.job?.title || 'Unknown Role'}</p>
              </div>
            </div>
            <div className="bg-[var(--black)] border border-[rgba(232,200,74,0.1)] px-5 py-3 rounded text-center min-w-[150px] w-full sm:w-auto">
              <p className="text-[10px] text-[var(--muted)] font-mono uppercase tracking-widest mb-1 font-bold">Scheduled Shift</p>
              <p className="text-[var(--orange)] font-mono font-bold text-lg">{startHour}:00 - {endHour}:00</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TodayBookings;
