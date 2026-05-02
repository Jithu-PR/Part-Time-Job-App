# Slot Booking System Documentation

## Overview
This application now features a BookMyShow-style slot selection system for managing restaurant shifts and job bookings. The system displays all available, booked, and closed slots with color-coded visual indicators.

## Color Scheme

- **Green (#22C55E)**: Available slots - Open for booking
- **Red (#EF4444)**: Booked slots - Already taken by students
- **Gray (#9CA3AF)**: Closed slots - Manually closed by restaurant owner

## Components

### 1. SlotSelectionGrid Component
**File**: `src/components/SlotSelectionGrid.tsx`

A reusable grid-based slot display component that shows all slots organized by date.

**Props**:
- `slotsByDate: Record<string, Record<string, Slot>>` - Slots organized by date and time
- `onSlotClick?: (date: string, timeSlot: string, slot: Slot) => void` - Callback when a slot is clicked
- `title?: string` - Component title (default: 'Available Slots')
- `readOnly?: boolean` - Prevent interactions (default: false)
- `selectedDate?: string` - **optional** date to force the grid to a particular day (YYYY-MM-DD); when provided the component becomes controlled
- `onDateChange?: (date: string) => void` - callback fired when the user picks a date from the built-in selector (useful for syncing multiple grids)

**Features**:
- Date selector to switch between dates (publisher can also control the date externally via props)
- Visual legend showing color meanings
- Responsive grid layout
- Slot information on hover
- Interactive slot selection

**Example Usage**:
```tsx
import { SlotSelectionGrid } from './SlotSelectionGrid';

<SlotSelectionGrid
  slotsByDate={roleData.slotsByDate}
  onSlotClick={handleSlotClick}
  title="Chef Positions"
  readOnly={false}
/>
```

### 2. SlotBookingPanel Component
**File**: `src/components/SlotBookingPanel.tsx`

An integrated component that combines role information with the SlotSelectionGrid for displaying position details and managing slots.

**Props**:
- `companyId: string` - ID of the restaurant
- `roleName: string` - Name of the job position
- `readOnly?: boolean` - Prevent interactions (default: false)

**Features**:
- Displays role description and hourly salary
- Shows success/error messages
- Integrates with DataContext for slot management
- Toggle slot open/closed functionality

**Example Usage**:
```tsx
import { SlotBookingPanel } from './SlotBookingPanel';

<SlotBookingPanel
  companyId="1"
  roleName="Chef"
  readOnly={false}
/>
```

### 3. Updated StudentDashboard Component
**File**: `src/components/StudentDashboard.tsx`

Enhanced dashboard for students to book slots with visual slot selection.

**Features**:
- Beautiful gradient header
- Organized form inputs (Name, Restaurant, Position, Date)
- Visual slot grid with color coding
- Multiple slot selection capability
- Clear/Book actions
- Real-time feedback messages

**Workflow**:
1. Student enters their name
2. Selects a restaurant and position
3. Chooses a date
4. Clicks on available (green) slots to select them
5. Clicks "Book Selected Slots" to complete booking

### 4. Updated CompanyDashboard Component
**File**: `src/components/CompanyDashboard.tsx`

Enhanced dashboard for restaurant owners to manage shifts and availability.

**Features** (for Restaurant Owners):
- Restaurant information display
- Global date selector to view/manage slots across all positions
- Grid layout for each position (synchronized to the chosen date)
- Visual slot management with SlotSelectionGrid
- Toggle slots open/closed (click on them)
- Save changes per position
- Loading and success/error messages

**Workflow**:
1. View your restaurant's positions and hours
2. Select a position
3. Click slots to toggle them open/closed
4. Save changes for each position

## Data Flow

### Slot Status Management

```
API Response (Backend)
    ↓
parseApiSlots() - Convert API format to internal format
    ↓
Internal slotsByDate Structure
    ↓
SlotSelectionGrid - Display with color coding
    ↓
User Actions (Click/Select)
    ↓
toggleSlot() / bookSlot()
    ↓
convertSlotsToApi() - Convert back to API format
    ↓
Save to Backend
```

### Slot State Transitions

```
Open (Green)
  ↓ [Click by Owner] → Closed (Gray)
  ↓ [Click by Student] → Booked (Red)

Closed (Gray)
  ↓ [Click by Owner] → Open (Green)

Booked (Red)
  ↓ [Can only be reset by owner manually toggling]
```

## API Integration

### Slot Object Structure

**Backend Format**:
```typescript
{
  id: number;
  documentId: string;
  slotStatus: 'open' | 'booked';
  startDateTime: string; // ISO 8601 format
  endDateTime: string;   // ISO 8601 format
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}
```

**Internal Format**:
```typescript
type Slot = {
  status: 'open' | 'closed';
  bookedBy: string | null;
};

// Organized as:
slotsByDate[YYYY-MM-DD][HH:00-HH+1:00] = Slot
```

### Conversion Functions

**parseApiSlots()**:
- Converts API slots array to internal slotsByDate structure
- Extracts date and time from ISO datetime
- Maps `slotStatus: 'booked'` to internal closed state with bookedBy value

**convertSlotsToApi()**:
- Converts internal slotsByDate back to API format
- Reconstructs proper ISO datetime strings
- Determines slot status for backend

## Styling

The components use Tailwind CSS for styling. Key classes:

- **Layout**: `grid`, `grid-cols-*`, `gap-*`
- **Colors**: `bg-green-400`, `bg-red-500`, `bg-gray-400`
- **States**: `hover:`, `disabled:`, `active:`
- **Typography**: `text-lg`, `font-bold`, `font-medium`

## Usage Examples

### For Students - Booking Slots

```tsx
const { bookSlot } = useData();

// Select slots visually in StudentDashboard
// Click "Book Selected Slots" to confirm

// Or programmatically:
const result = bookSlot(
  'John Doe',      // Student name
  '1',             // Company ID
  'Chef',          // Role name
  11,              // Start hour
  2,               // Duration in hours
  '2026-02-24'     // Date
);

if (result.ok) {
  console.log('Slot booked successfully!');
}
```

### For Owners - Managing Slots

```tsx
const { toggleSlot, saveRoleSlots } = useData();

// Toggle individual slots
toggleSlot('1', 'Chef', '11:00-12:00', '2026-02-24');

// Save all changes for a role
const result = await saveRoleSlots('Chef', slotsByDate);

if (result.ok) {
  console.log('Changes saved successfully!');
}
```

## Responsive Design

The SlotSelectionGrid adapts to different screen sizes:

- **Mobile**: 2 columns for slots
- **Tablet**: 3-4 columns
- **Desktop**: 6 columns

Date selector:
- **Mobile**: 3 columns
- **Tablet/Desktop**: 6 columns

## Accessibility Features

- Semantic HTML structure
- Clear visual hierarchy
- Color-independent information (also uses text labels)
- Keyboard-friendly interactive elements
- Proper button states (disabled, hover)

## State Management

Uses React Context (DataContext) for:
- Centralized slot data
- User authentication state
- Booking logic
- API communication

All state updates are immutable to prevent side effects.

## Error Handling

- Network errors logged to console
- User-friendly error messages displayed
- Graceful fallbacks for missing data
- Validation of user inputs

## Future Enhancements

- Export/import slot configurations
- Recurring slot patterns
- Bulk slot actions
- Slot history and audit logs
- Advanced filtering and search
- Calendar view option
- Notifications for bookings
