import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getUserRole, getCurrentUser } from '../utils';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: email,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || errorData.message || 'Login failed. Please check your credentials.';
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log(data);
      // Store the JWT token and user data
      localStorage.setItem('jwt', data.jwt);

      toast.success('Login successful!');

      // Navigate based on user role
      const userRole = await getUserRole();
      console.log('User role:', userRole);

      if (userRole === 'Restaurant Owner') {
        navigate('/company');
      } else if (userRole === 'Authenticated') {
        navigate('/student');
      } else {
        // Fallback: check current user to determine role
        const currentUser = await getCurrentUser();
        if (currentUser?.restaurant) {
          navigate('/company');
        } else {
          navigate('/student');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      toast.error('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sm:p-10 max-w-md w-full">
        <h1 className="text-3xl font-bold tracking-tight text-center mb-2 text-slate-900">Job Booking App</h1>
        <h2 className="text-lg font-medium text-center mb-8 text-slate-500">Welcome back. Please login.</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-slate-600 font-medium mb-2 text-sm">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50"
              required
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-2 text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm mt-2"
          >
            {loading ? 'Logging in...' : 'Login into your account'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-slate-600 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">
              Register here
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Demo credentials: user@example.com / userpassword
        </p>
      </div>
    </div>
  );
};

export default Login;
