'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Shield, Sparkles, CheckCircle2, KeyRound, ArrowLeft, ShieldCheck } from 'lucide-react';
import { TrademarkBadge } from './TrademarkBadge';
import api from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, resetPasswordWithPin } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);

  // Form Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');

  // UI States
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleResetModal = () => {
    setError(null);
    setSuccessMsg(null);
    setForgotStep(1);
    setSecurityPin('');
    setNewPassword('');
    setConfirmPassword('');
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
      } else if (authMode === 'FORGOT_PASSWORD') {
        if (forgotStep === 1) {
          if (!username && !email) {
            throw new Error('Username or email is required');
          }
          if (!securityPin || !/^\d{4}$/.test(securityPin.trim())) {
            throw new Error('Please enter your 4-digit Security PIN');
          }
          // Verify with backend
          await api.post('/auth/verify-reset-pin', {
            identifier: username || email,
            pin: securityPin.trim()
          });
          setForgotStep(2);
        } else {
          // Step 2: Set new password
          if (newPassword.length < 6) {
            throw new Error('New password must be at least 6 characters');
          }
          if (newPassword !== confirmPassword) {
            throw new Error('Passwords do not match');
          }
          await resetPasswordWithPin(username || email, securityPin.trim(), newPassword);
          setSuccessMsg('Password updated successfully! Logging you in...');
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Action failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    const demoUser = 'trader_cse';
    const demoEmail = 'trader@cse-demo.lk';
    const demoPass = 'DemoPass123!';

    try {
      // Try login first
      await login(demoEmail, demoPass);
      onClose();
    } catch {
      // If doesn't exist, create it with default PIN 1234
      try {
        await register(demoUser, demoEmail, demoPass, '1234', 'USER');
        onClose();
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Failed to initialize demo account');
      }
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
                  : authMode === 'FORGOT_PASSWORD'
                    ? `Password Recovery (Step ${forgotStep} of 2)`
                    : 'Sign In to Demo Terminal'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {authMode === 'FORGOT_PASSWORD'
                  ? 'Two-Step Security PIN Verification'
                  : 'Colombo Stock Exchange Virtual Platform'}
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

        {authMode === 'FORGOT_PASSWORD' && (
          <div className="mx-4 mt-4 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <span>
              {forgotStep === 1
                ? 'Enter your Username/Email and your 4-digit Security PIN (default for demo accounts is 1234).'
                : 'Identity confirmed! Please create a new password for your account.'}
            </span>
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

          {/* FORGOT PASSWORD STEP 1: Identify and PIN */}
          {authMode === 'FORGOT_PASSWORD' && forgotStep === 1 && (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Username or Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Enter your username or email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-fintech-panel border border-fintech-border rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-sans"
                    required
                  />
                </div>
              </div>

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
                  Demo default is <strong>1234</strong> if not customized.
                </span>
              </div>
            </>
          )}

          {/* FORGOT PASSWORD STEP 2: New Password */}
          {authMode === 'FORGOT_PASSWORD' && forgotStep === 2 && (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  New Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-fintech-panel border border-fintech-border rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Confirm New Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-fintech-panel border border-fintech-border rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </>
          )}

          {/* STANDARD LOGIN & REGISTRATION FIELDS */}
          {authMode !== 'FORGOT_PASSWORD' && (
            <>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-zinc-300">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  {authMode === 'LOGIN' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('FORGOT_PASSWORD');
                        handleResetModal();
                      }}
                      className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
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
                <>
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
                      Used for instant self-service password recovery.
                    </span>
                  </div>
                </>
              )}
            </>
          )}

          {/* Action Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-blue-900/40"
          >
            {isLoading
              ? 'Processing...'
              : authMode === 'FORGOT_PASSWORD'
                ? forgotStep === 1
                  ? 'Verify Account & Continue'
                  : 'Update Password & Sign In'
                : authMode === 'REGISTER'
                  ? 'Create Account (Rs. 1M Starting Cash)'
                  : 'Sign In to Terminal'}
          </button>

          {/* Mode Switchers */}
          {authMode === 'FORGOT_PASSWORD' ? (
            <div className="text-center pt-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('LOGIN');
                  handleResetModal();
                }}
                className="text-zinc-400 hover:text-zinc-200 flex items-center justify-center space-x-1 mx-auto transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          ) : (
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
          )}

          {/* Instant 1-Click Demo Buttons (Shown on Login and Register) */}
          {authMode !== 'FORGOT_PASSWORD' && (
            <div className="pt-3 border-t border-fintech-border">
              <div className="text-[11px] text-zinc-500 text-center mb-2">Or test instantly with 1-click demo account:</div>
              <button
                type="button"
                onClick={handleQuickDemo}
                disabled={isLoading}
                className="w-full py-2 px-3 bg-fintech-panel hover:bg-fintech-hover border border-fintech-border rounded-lg text-xs font-semibold text-zinc-200 hover:text-white transition-colors flex items-center justify-center space-x-2 shadow-sm"
              >
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>1-Click Demo Trader (Rs. 1M Capital)</span>
              </button>
            </div>
          )}

          {/* Trademark Footer Badge */}
          <div className="pt-2 border-t border-fintech-border/40 flex items-center justify-center">
            <TrademarkBadge size="xs" />
          </div>
        </form>
      </div>
    </div>
  );
};
