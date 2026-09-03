'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HardDrive, Loader2, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiLogin, apiRegister } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setLoading(true);
    setError('');

    try {
      const data = await apiLogin({ email: loginEmail, password: loginPassword });
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        throw new Error('Login succeeded but no token was returned.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regPassword) return;

    setLoading(true);
    setError('');

    try {
      const data = await apiRegister({
        fullName: regFullName,
        email: regEmail,
        password: regPassword,
      });

      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        throw new Error('Failed to obtain authentication token.');
      }
    } catch (err: any) {
      // Display the exact server error message (e.g. "Email already exists. Please sign in instead.")
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafd] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#dadce0] rounded-3xl p-8 shadow-lg">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f0fe] text-[#1a73e8] mb-3">
            <HardDrive className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-normal text-[#202124] tracking-tight font-sans">
            NebulaVault
          </h1>
          <p className="text-sm text-[#5f6368] mt-1">
            Secure cloud storage for all your files
          </p>
        </div>

        {/* Toggle Tabs */}
        <div className="flex rounded-xl bg-[#f1f3f4] p-1 mb-6 border border-[#dadce0]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setError('');
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'signin'
                ? 'bg-white text-[#1a73e8] shadow-xs font-semibold'
                : 'text-[#5f6368] hover:text-[#202124]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setError('');
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'signup'
                ? 'bg-white text-[#1a73e8] shadow-xs font-semibold'
                : 'text-[#5f6368] hover:text-[#202124]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        {/* Sign In Form */}
        {activeTab === 'signin' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#5f6368]" htmlFor="login-email">
                Email address
              </label>
              <Input
                id="login-email"
                type="email"
                placeholder="name@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="h-10 border-[#dadce0] bg-white text-[#202124]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#5f6368]" htmlFor="login-password">
                Password
              </label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="h-10 border-[#dadce0] bg-white text-[#202124]"
              />
            </div>

            <Button
              id="signin-submit"
              type="submit"
              disabled={loading}
              className="w-full h-10 text-sm font-medium bg-[#1a73e8] hover:bg-[#1557b0] text-white mt-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </form>
        ) : (
          /* Sign Up Form */
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#5f6368]" htmlFor="reg-fullname">
                Full Name
              </label>
              <Input
                id="reg-fullname"
                type="text"
                placeholder="John Doe"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                required
                className="h-10 border-[#dadce0] bg-white text-[#202124]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#5f6368]" htmlFor="reg-email">
                Email address
              </label>
              <Input
                id="reg-email"
                type="email"
                placeholder="name@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                className="h-10 border-[#dadce0] bg-white text-[#202124]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#5f6368]" htmlFor="reg-password">
                Password
              </label>
              <Input
                id="reg-password"
                type="password"
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                minLength={6}
                className="h-10 border-[#dadce0] bg-white text-[#202124]"
              />
            </div>

            <Button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="w-full h-10 text-sm font-medium bg-[#1a73e8] hover:bg-[#1557b0] text-white mt-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
