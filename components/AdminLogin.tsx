import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const AdminLogin: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      onLogin();
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[380px]">
        
        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-900">Admin Access</h2>
            <p className="mt-1 text-slate-500 text-sm">Dashboard Login</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <input
                type="text"
                required
                className="block w-full rounded-2xl border-0 bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 py-3.5 px-4 text-[17px] outline-none transition-all"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="block w-full rounded-2xl border-0 bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 py-3.5 px-4 text-[17px] outline-none transition-all"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl text-[17px] font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 transition-all shadow-lg"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8 text-center">
             <Link to="/" className="text-slate-400 hover:text-slate-600 text-sm font-medium">
               ← Back to verification
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;