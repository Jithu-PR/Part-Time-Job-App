import React, { createContext, useContext, useState } from 'react';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../utils';

type Slot = { status: 'open' | 'closed'; bookedBy: string | null };
// slots are now grouped by date string (YYYY-MM-DD)
type Role = { desc: string; salary: number; slotsByDate: Record<string, Record<string, Slot>>; documentId?: string };
type Company = { id?: string | number; documentId?: string; name?: string; startHour: number; endHour: number; roles: Record<string, Role> };
type Data = Company[] | Company | null;

export function initializeSlots(start: number, end: number) {
  const slots: Record<string, Slot> = {};
  for (let h = start; h < end; h++) {
    slots[`${h}:00-${h + 1}:00`] = { status: 'open', bookedBy: null };
  }
  return slots;
}

// Helper to get YYYY-MM-DD in local time
export function getLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Convert API slots array to internal slotsByDate structure
// The API includes a `booked_by` object when a slot is booked; we want to
// show the username of that user instead of a generic "Booked" label in the
// UI (especially in the detailed booked slots tab).
function parseApiSlots(apiSlots: any[]): Record<string, Record<string, Slot>> {
  const slotsByDate: Record<string, Record<string, Slot>> = {};

  apiSlots.forEach(slot => {
    const startDate = new Date(slot.startDateTime);
    const dateStr = getLocalDateString(startDate); // YYYY-MM-DD (Local)
    const startHour = startDate.getHours();
    const endHour = startHour + 1;
    const timeKey = `${startHour}:00-${endHour}:00`;

    if (!slotsByDate[dateStr]) {
      slotsByDate[dateStr] = {};
    }
    console.log(apiSlots, "apislots");

    // determine who booked the slot, if any
    let bookedBy: string | null = null;
    if (slot.slotStatus === 'booked') {
      // prefer the username from the populated relationship
      if (slot.booked_by && typeof slot.booked_by === 'object') {
        bookedBy = slot.booked_by.username || slot.booked_by.name || 'Booked';
      } else {
        // fallback in case the API didn't provide a user object
        bookedBy = 'Booked';
      }
    }

    slotsByDate[dateStr][timeKey] = {
      status: slot.slotStatus === 'booked' ? 'closed' : 'open',
      bookedBy,
    };
  });

  return slotsByDate;
}

// Convert internal slotsByDate structure back to API format
function convertSlotsToApi(slotsByDate: Record<string, Record<string, Slot>>): any[] {
  const slots: any[] = [];

  Object.entries(slotsByDate).forEach(([dateStr, timeSlots]) => {
    Object.entries(timeSlots).forEach(([timeRange, slot]) => {
      const [startHourStr] = timeRange.split(':');
      const startHour = parseInt(startHourStr, 10);

      const startDateTime = new Date(`${dateStr}T${startHour.toString().padStart(2, '0')}:00:00.000Z`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

      slots.push({
        slotStatus: slot.status === 'closed' && slot.bookedBy ? 'booked' : 'open',
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
      });
    });
  });

  return slots;
}

type DataContextType = {
  data: Data;
  role: 'Authenticated' | 'Restaurant Owner' | null;
  loading: boolean;
  toggleSlot: (companyId: string, role: string, slot: string, date?: string) => void;
  bookSlot: (name: string, companyId: string, role: string, start: number, hours: number, date?: string) => { ok: boolean; message: string };
  bookSlotApi: (companyId: string, roleName: string, timeSlot: string, date: string) => Promise<{ ok: boolean; message: string }>;
  fetchRestaurantData: () => Promise<void>;
  updateRestaurantSlots: (roleName?: string) => Promise<{ ok: boolean; message: string }>;
  saveRoleSlots: (roleName: string, slotsByDate: Record<string, Record<string, Slot>>) => Promise<{ ok: boolean; message: string }>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<Data>(null);
  const [role, setRole] = useState<'Authenticated' | 'Restaurant Owner' | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleSlot(companyId: string, roleName: string, slotKey: string, date?: string) {
    const d = date || new Date().toISOString().slice(0, 10);
    setData((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as Data;

      // helper used by both branches
      const ensureSlotExists = (roleObj: Role, companyStart: number, companyEnd: number) => {
        if (!roleObj.slotsByDate[d]) {
          // no data for this date at all, create full range
          roleObj.slotsByDate[d] = initializeSlots(companyStart, companyEnd);
        }
        const dateSlots = roleObj.slotsByDate[d];
        if (!dateSlots[slotKey]) {
          // slot wasn't included by the API, add a default open one so toggling works
          dateSlots[slotKey] = { status: 'open', bookedBy: null };
        }
        return dateSlots[slotKey];
      };

      if (Array.isArray(next)) {
        // Student view - multiple companies
        const company = next.find(c => c.id === companyId);
        if (company) {
          const roleObj = company.roles[roleName];
          if (!roleObj) {
            console.warn(`toggleSlot: role "${roleName}" not found for company ${companyId}`);
          } else {
            const slot = ensureSlotExists(roleObj, company.startHour, company.endHour);
            if (!slot.bookedBy) slot.status = slot.status === 'open' ? 'closed' : 'open';
          }
        }
      } else if (next) {
        // Company view - single company
        const roleObj = next.roles[roleName];
        if (!roleObj) {
          console.warn(`toggleSlot: role "${roleName}" not found in company data`);
        } else {
          const slot = ensureSlotExists(roleObj, next.startHour, next.endHour);
          // console.log(slot, "obj"); // kept for debugging if necessary
          if (!slot.bookedBy) slot.status = slot.status === 'open' ? 'closed' : 'open';
        }
      }
      return next;
    });
  }

  function bookSlot(name: string, companyId: string, roleName: string, start: number, hours: number, date?: string) {
    const d = date || getLocalDateString(new Date());

    if (!data) return { ok: false, message: 'No company data available.' };

    let comp: Company | undefined;

    if (Array.isArray(data)) {
      comp = data.find(c => c.id === companyId);
    } else {
      comp = data.id === companyId ? data : undefined;
    }

    if (!comp) return { ok: false, message: 'Company not found.' };

    if (!name || start < 1 || start > 23 || hours < 1 || start + hours > 24) {
      return { ok: false, message: 'Invalid name, start hour, or duration.' };
    }
    if (start < comp.startHour || start + hours > comp.endHour) {
      return { ok: false, message: 'Selected time is outside company operating hours.' };
    }

    const roleObj = comp.roles[roleName];
    if (!roleObj.slotsByDate[d]) {
      roleObj.slotsByDate[d] = initializeSlots(comp.startHour, comp.endHour);
    }
    const roleSlots = roleObj.slotsByDate[d];
    for (let h = start; h < start + hours; h++) {
      const key = `${h}:00-${h + 1}:00`;
      const s = roleSlots[key];
      if (!s || s.status !== 'open' || s.bookedBy) return { ok: false, message: 'Some slots are not available.' };
    }

    setData((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as Data;

      if (Array.isArray(next)) {
        const company = next.find(c => c.id === companyId);
        if (company) {
          const roleNext = company.roles[roleName];
          if (!roleNext.slotsByDate[d]) roleNext.slotsByDate[d] = initializeSlots(company.startHour, company.endHour);
          for (let h = start; h < start + hours; h++) {
            const key = `${h}:00-${h + 1}:00`;
            roleNext.slotsByDate[d][key].bookedBy = name;
          }
        }
      } else if (next) {
        const roleNext = next.roles[roleName];
        if (!roleNext.slotsByDate[d]) roleNext.slotsByDate[d] = initializeSlots(next.startHour, next.endHour);
        for (let h = start; h < start + hours; h++) {
          const key = `${h}:00-${h + 1}:00`;
          roleNext.slotsByDate[d][key].bookedBy = name;
        }
      }
      return next;
    });
    return { ok: true, message: 'Slot booked successfully!' };
  }

  async function fetchRestaurantData() {
    setLoading(true);
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        console.error('No JWT token found');
        setLoading(false);
        return;
      }

      // First, get the current user using helper function
      const userData = await getCurrentUser();
      if (!userData) {
        console.error('Failed to fetch user data');
        setLoading(false);
        return;
      }

      // Determine user role
      const userRole = userData.role?.name === 'Restaurant Owner' ? 'Restaurant Owner' : 'Authenticated';
      setRole(userRole);
      console.log('User role determined:', userRole);

      // If restaurant owner - fetch only their restaurant
      if (userRole === 'Restaurant Owner') {
        if (!userData.restaurant) {
          console.warn('No restaurant linked to this company account');
          setData(null);
          setLoading(false);
          return;
        }

        const restaurantResponse = await fetch(
          `import.meta.env.VITE_API_URL/api/restaurants/${userData.restaurant.documentId}?populate[jobs][populate][slots][populate][0]=booked_by`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${jwt}`,
            },
          }
        );

        if (!restaurantResponse.ok) {
          console.error('Failed to fetch restaurant data');
          toast.error('Failed to fetch restaurant data');
          setData(null);
          return;
        }

        const restaurant = await restaurantResponse.json();
        const restaurantData = restaurant.data || restaurant;
        console.log('Restaurant data fetched:', restaurant.data);

        const transformedCompany: Company = {
          id: restaurantData.id,
          documentId: restaurantData.documentId,
          name: restaurantData.name,
          startHour: restaurantData.startHour || 9,
          endHour: restaurantData.endHour || 23,
          roles: {},
        };

        // Process roles
        if (restaurantData.jobs && Array.isArray(restaurantData.jobs)) {
          restaurantData.jobs.forEach((roleData: any) => {
            console.log(roleData.slots, "role")
            const slotsByDate = roleData.slots ? parseApiSlots(roleData.slots) : (restaurantData.slots ? parseApiSlots(restaurantData.slots) : {});
            transformedCompany.roles[roleData.title] = {
              desc: roleData.description || '',
              salary: roleData.salary || 0,
              slotsByDate: slotsByDate,
              documentId: roleData.documentId,
            };
          });
        }

        setData(transformedCompany);
        console.log("authenticated else blockll", transformedCompany)
      } else {
        console.log("authenticated else blockll")
        // If authenticated user - fetch all restaurants with full slot population
        const restaurantsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/restaurants?populate[jobs][populate][slots][populate]=booked_by`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ jwt }`,
          },
        });

        if (!restaurantsResponse.ok) {
          console.error('Failed to fetch restaurants');
          toast.error('Failed to fetch restaurants');
          setData(null);
          return;
        }

        const restaurantsData = await restaurantsResponse.json();
        const restaurants = restaurantsData.data || [];
        console.log('All restaurants fetched:', restaurants);

        const transformedCompanies: Company[] = restaurants.map((restaurant: any) => ({
          id: restaurant.id,
          documentId: restaurant.documentId,
          name: restaurant.name,
          startHour: restaurant.startHour || 9,
          endHour: restaurant.endHour || 23,
          roles: restaurant.jobs
            ? restaurant.jobs.reduce((acc: any, role: any) => {
              // Parse slots from API response
              const slotsByDate = role.slots
                ? parseApiSlots(role.slots)
                : {};

              acc[role.title] = {
                desc: role.description || '',
                salary: role.salary || 0,
                slotsByDate,
                documentId: role.documentId,
              };
              return acc;
            }, {})
            : {},
        }));

        setData(transformedCompanies);
        console.log(transformedCompanies, "trans")
      }
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function updateRestaurantSlots(roleName?: string) {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        return { ok: false, message: 'No JWT token found' };
      }

      const userData = await getCurrentUser();
      if (!userData) {
        return { ok: false, message: 'Failed to fetch user data' };
      }

      // Only works for restaurant owners (single company view)
      if (!userData.restaurant) {
        return { ok: false, message: 'User is not a restaurant owner' };
      }

      if (!data || Array.isArray(data)) {
        return { ok: false, message: 'No restaurant data or invalid data state' };
      }

      // Transform the internal data structure to API format
      let rolesData = Object.entries(data.roles).map(([title, roleData]) => ({
        title,
        description: roleData.desc,
        salary: roleData.salary,
        slots: convertSlotsToApi(roleData.slotsByDate),
      }));

      // If specific role is provided, filter to only that role
      if (roleName) {
        rolesData = rolesData.filter(role => role.title === roleName);
        if (rolesData.length === 0) {
          return { ok: false, message: `Role "${roleName}" not found` };
        }
      }

      const payload = {
        data: {
          name: data.name,
          startHour: data.startHour,
          endHour: data.endHour,
          jobs: rolesData,
        },
      };

      const response = await fetch(
        `import.meta.env.VITE_API_URL / api / restaurants / ${ userData.restaurant.documentId }`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ jwt }`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `Failed to update restaurant slots(${ response.status })`;
        console.error('Failed to update restaurant slots:', errorMessage);
        toast.error(errorMessage);
        return { ok: false, message: errorMessage };
      }

      console.log('Restaurant slots updated successfully');
      toast.success('Restaurant slots updated successfully!');
      return { ok: true, message: 'Restaurant slots updated successfully!' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating slots';
      console.error('Error updating restaurant slots:', error);
      toast.error(errorMessage);
      return { ok: false, message: errorMessage };
    }
  }

  async function bookSlotApi(companyId: string, roleName: string, timeSlot: string, date: string): Promise<{ ok: boolean; message: string }> {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) return { ok: false, message: 'Not authenticated' };

      const userData = await getCurrentUser();
      if (!userData) return { ok: false, message: 'Failed to get user data' };

      // Find the company and role to get their documentIds (relation IDs)
      let company: Company | undefined;
      if (Array.isArray(data)) {
        company = data.find(c => String(c.id) === String(companyId));
      } else if (data) {
        company = String(data.id) === String(companyId) ? data : undefined;
      }

      if (!company) return { ok: false, message: 'Restaurant not found' };
      if (!company.documentId) return { ok: false, message: 'Restaurant document ID missing' };

      const roleData = company.roles[roleName];
      if (!roleData) return { ok: false, message: 'Job not found' };
      if (!roleData.documentId) return { ok: false, message: 'Job document ID missing' };

      // Build startDateTime from date + timeSlot (e.g. "2024-03-15" + "9:00-10:00")
      const [startHourStr] = timeSlot.split(':');
      const startHour = parseInt(startHourStr, 10);
      const startDateTime = new Date(`${ date }T${ startHour.toString().padStart(2, '0') }:00:00.000`).toISOString();

      const payload = {
        data: {
          job: roleData.documentId,
          restaurant: company.documentId,
          startDateTime,
          slotStatus: 'booked',
        },
      };
      console.log(payload, "payload")

      const response = await fetch(`${ import.meta.env.VITE_API_URL }/api/slots`, {
        method: 'POST',
          headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
          body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || `Booking failed (${response.status})`;
        console.error('bookSlotApi error:', errMsg);
        toast.error(errMsg, { id: 'book-slot-error' });
        return { ok: false, message: errMsg };
      }

      // Optimistically update local state so the UI reflects the booking immediately
      bookSlot(userData.username || userData.email || 'You', companyId, roleName, startHour, 1, date);

      toast.success('Slot booked successfully!', { id: 'book-slot-success' });
      return { ok: true, message: 'Slot booked successfully!' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'An error occurred while booking';
      console.error('bookSlotApi exception:', error);
      toast.error(msg, { id: 'book-slot-error' });
      return { ok: false, message: msg };
    }
  }

  async function saveRoleSlots(roleName: string, slotsByDate: Record<string, Record<string, Slot>>) {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        return { ok: false, message: 'No JWT token found' };
      }

      const userData = await getCurrentUser();
      if (!userData) {
        return { ok: false, message: 'Failed to fetch user data' };
      }

      if (!userData.restaurant) {
        return { ok: false, message: 'User is not a restaurant owner' };
      }

      if (!data || Array.isArray(data)) {
        return { ok: false, message: 'No restaurant data or invalid data state' };
      }

      const roleData = data.roles[roleName];
      if (!roleData) {
        return { ok: false, message: `Role "${roleName}" not found` };
      }

      // Build the roles array with the updated role
      const rolesArray = Object.entries(data.roles).map(([title, role]) => ({
        title,
        description: role.desc,
        salary: role.salary,
        slots: title === roleName ? convertSlotsToApi(slotsByDate) : convertSlotsToApi(role.slotsByDate),
      }));

      // Build the payload with jobs array
      const payload = {
        data: {
          jobs: rolesArray,
        },
      };

      const response = await fetch(
        `import.meta.env.VITE_API_URL/api/restaurants/${userData.restaurant.documentId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `Failed to save ${roleName} slots (${response.status})`;
        console.error(`Failed to save ${roleName} slots:`, errorMessage);
        toast.error(errorMessage);
        return { ok: false, message: errorMessage };
      }

      console.log(`${roleName} slots saved successfully`);
      toast.success(`${roleName} slots saved successfully!`);
      return { ok: true, message: `${roleName} slots saved successfully!` };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while saving slots';
      console.error('Error saving role slots:', error);
      toast.error(errorMessage);
      return { ok: false, message: errorMessage };
    }
  }

  return (
    <DataContext.Provider value={{ data, role, toggleSlot, bookSlot, bookSlotApi, fetchRestaurantData, updateRestaurantSlots, saveRoleSlots, loading }}>{children}</DataContext.Provider>
  );
};
