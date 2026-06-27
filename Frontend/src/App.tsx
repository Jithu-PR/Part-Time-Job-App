import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import CompanyDashboard from './components/CompanyDashboard';
import StudentDashboard from './components/StudentDashboard';
import { PublicRoute, ProtectedRoute } from './components/RouteGuards';
import { DataProvider } from './context/DataContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
  return (
    <DataProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1c1c1c',
            color: '#f5f0e8',
            border: '1px solid rgba(232,200,74,0.25)',
            borderRadius: '4px',
            fontFamily: "'Space Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          },
          success: {
            iconTheme: { primary: '#e8c84a', secondary: '#0a0a0a' },
          },
          error: {
            iconTheme: { primary: '#f2622e', secondary: '#0a0a0a' },
          },
          loading: {
            iconTheme: { primary: '#e8c84a', secondary: '#1c1c1c' },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/company" element={<ProtectedRoute allowedRole="Restaurant Owner"><CompanyDashboard /></ProtectedRoute>} />
          <Route path="/student" element={<ProtectedRoute allowedRole="Authenticated"><StudentDashboard /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
