'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function TestLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setMessage('');

    try {
      console.log('Attempting login...');

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Login response:', { data, error });

      if (error) {
        setMessage(`Error: ${error.message}`);
        return;
      }

      if (data.user) {
        setMessage(`Success! User: ${data.user.email}`);

        // Check session
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('Session after login:', sessionData);

        // Force redirect
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessage(`Unexpected error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current session:', session);
    console.log('Current user:', user);
    setMessage(`Session: ${session ? 'Exists' : 'None'}, User: ${user ? user.email : 'None'}`);
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Login</h1>

      <div className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <button
          onClick={checkSession}
          className="w-full bg-gray-500 text-white p-2 rounded"
        >
          Check Session
        </button>

        {message && (
          <div className="p-3 bg-gray-100 rounded text-sm">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}