'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Sparkles, CheckCircle2, KeyRound } from 'lucide-react';
import { TrademarkBadge } from './TrademarkBadge';
import api from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'LOGIN' | 'REGISTER';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');

  // Form Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [securityPin, setSecurityPin] = useState('');

  // UI States
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleResetModal = () => {
    setError(null);
    setSuccessMsg(null);
    setSecurityPin('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (authMode === 'REGISTER') {
        if (!securityPin || !/^\d{4}$/.test(securityPin.trim())) {
          throw new Error('Please provide a 4-digit numeric Security PIN');
        }
        await register(username, email, password, securityPin.trim(), 'USER');
        onClose();
      } else if (authMode === 'LOGIN') {
        await login(username || email, password);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Action failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-fintech-card border border-fintech-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-fintech-border bg-[#0D131F] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
              CSE
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100">
                {authMode === 'REGISTER'
                  ? 'Create CSE Demo Account'
                  : 'Sign In to Demo Terminal'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Colombo Stock Exchange Virtual Platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-fintech-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Banner Alert */}
        {authMode === 'REGISTER' && (
          <div className="mx-4 mt-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Every newly registered trader automatically starts with <strong>Rs. 1,000,000.00 LKR</strong> in virtual trading capital!</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {error && (
            <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STANDARD LOGIN & REGISTRATION FIELDS */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Username {authMode === 'REGISTER' && <span className="text-rose-400">*</span>}
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={authMode === 'REGISTER' ? "e.g. colombo_trader" : "Username or Email"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-fintech-panel border border-fintech-border rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {authMode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="e.g. trader@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-fintech-panel border border-fintech-border rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-fintech-panel border border-fintech-border rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {authMode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                4-Digit Security PIN <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  maxLength={4}
                  placeholder="•••• (e.g. 1234)"
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full bg-fintech-panel border border-fintech-border rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono tracking-widest"
                  required
                />
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Used for administrative authorizations and in-app security settings.
              </span>
            </div>
          )}

          {/* Action Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-blue-900/40"
          >
            {isLoading
              ? 'Processing...'
              : authMode === 'REGISTER'
                ? 'Create Account (Rs. 1M Starting Cash)'
                : 'Sign In to Terminal'}
          </button>

          {/* Mode Switchers */}
          <div className="text-center pt-1 text-xs text-zinc-400">
            {authMode === 'REGISTER' ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'REGISTER' ? 'LOGIN' : 'REGISTER');
                handleResetModal();
              }}
              className="text-blue-400 hover:text-blue-300 font-semibold underline ml-1"
            >
              {authMode === 'REGISTER' ? 'Sign In' : 'Register Now'}
            </button>
          </div>

          {/* Trademark Footer Badge */}
          <div className="pt-2 border-t border-fintech-border/40 flex items-center justify-center">
            <TrademarkBadge size="xs" />
          </div>
        </form>
      </div>
    </div>
  );
};
