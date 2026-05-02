import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
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
