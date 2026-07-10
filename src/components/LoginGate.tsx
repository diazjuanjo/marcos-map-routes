import React, { useState, FormEvent } from 'react';
import { ShieldAlert, LogIn } from 'lucide-react';

const AUTH_KEY = 'rutaapp_auth';
const PASSWORD = import.meta.env.VITE_APP_PASSWORD;

interface LoginGateProps {
  onSuccess: () => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({ onSuccess }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!PASSWORD) {
      onSuccess();
      return;
    }
    setLoading(true);
    setError(false);
    // Simulate brief check
    setTimeout(() => {
      if (value === PASSWORD) {
        sessionStorage.setItem(AUTH_KEY, '1');
        onSuccess();
      } else {
        setError(true);
        setLoading(false);
      }
    }, 200);
  };

  return (
    <div className="h-full w-full flex items-center justify-center bg-gray-900">
      <form onSubmit={handleSubmit}
        className="bg-gray-800 border border-gray-700 rounded-2xl p-8 w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center justify-center mb-6">
          <div className="w-14 h-14 bg-blue-600/20 rounded-full flex items-center justify-center">
            <ShieldAlert size={28} className="text-blue-500" />
          </div>
        </div>
        <h1 className="text-white text-xl font-bold text-center mb-1">RutaApp</h1>
        <p className="text-gray-400 text-sm text-center mb-6">Ingresá la contraseña para acceder</p>

        <input
          type="password"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(false); }}
          placeholder="Contraseña"
          autoFocus
          className={`w-full bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm border transition-colors outline-none ${
            error ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
          }`}
        />
        {error && (
          <p className="text-red-400 text-xs mt-2">Contraseña incorrecta</p>
        )}

        <button type="submit" disabled={loading || !value}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <LogIn size={16} />
          )}
          Ingresar
        </button>
      </form>
    </div>
  );
};

export function checkAuth(): boolean {
  return !!sessionStorage.getItem(AUTH_KEY);
}

export default LoginGate;
