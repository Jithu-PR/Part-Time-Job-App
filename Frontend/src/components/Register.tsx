import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getUserRole, getCurrentUser } from '../utils';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/local/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || errorData.message || 'Registration failed. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      const data = await response.json();

      // Store the JWT token and user data
      localStorage.setItem('jwt', data.jwt);

      toast.success('Registration successful!');

      // Navigate based on user role
      const userRole = await getUserRole();

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
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--black)] relative overflow-hidden">
      {/* Grid background effect */}
      <div className="absolute inset-0 bg-image-grid opacity-30 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(232,200,74,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,200,74,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="bg-[var(--slate)] rounded-lg border border-[rgba(232,200,74,0.2)] p-8 sm:p-10 max-w-md w-full relative z-10 shadow-xl">
        <div className="text-center mb-6">
          <Link to="/" className="logo text-4xl inline-block hover:scale-[1.02] transition-transform">
            Free<span>Mason</span>
          </Link>
          <h2 className="text-xs font-mono uppercase tracking-widest text-[var(--muted)] mt-2">
            Create a new account
          </h2>
        </div>

        {error && (
          <div className="bg-rose-950/40 border border-rose-500/40 text-rose-200 px-4 py-3 rounded text-xs font-mono uppercase tracking-wider mb-6">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-[var(--white)] opacity-80 font-mono text-[10px] uppercase tracking-wider mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              className="w-full px-4 py-3 bg-[var(--black)] border border-[rgba(232,200,74,0.15)] rounded text-[var(--white)] focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] transition-all font-sans text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-[var(--white)] opacity-80 font-mono text-[10px] uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-3 bg-[var(--black)] border border-[rgba(232,200,74,0.15)] rounded text-[var(--white)] focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] transition-all font-sans text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-[var(--white)] opacity-80 font-mono text-[10px] uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[var(--black)] border border-[rgba(232,200,74,0.15)] rounded text-[var(--white)] focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] transition-all font-sans text-sm"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 rounded font-bold uppercase tracking-wider font-mono text-xs shadow-md mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : 'Create account'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-[rgba(255,255,255,0.06)] pt-6">
          <p className="text-[var(--muted)] font-mono text-xs uppercase tracking-wider">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--gold)] hover:text-[var(--orange)] font-bold transition-colors">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
