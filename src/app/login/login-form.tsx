'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, AlertCircle, Copy, Check, LogIn } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import { toast } from 'sonner';

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

const demoAccounts = [
  { role: 'Admin', email: 'admin@demo.test', password: 'password123', label: 'Admin' },
  { role: 'Learner', email: 'aarati@demo.test', password: 'password123', label: 'Aarati' },
  { role: 'Learner', email: 'binod@demo.test', password: 'password123', label: 'Binod' },
  { role: 'Learner', email: 'chandra@demo.test', password: 'password123', label: 'Chandra' },
];

export function LoginForm({ fromPath }: { fromPath: string }) {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: { email: '', password: '', remember: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    const email = data.email.trim().toLowerCase();
    const password = data.password;

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!res || res.error) {
        setError('root', {
          message: 'That email and password didn\'t match. Try again.',
        });
        setLoading(false);
        return;
      }

      const match = demoAccounts.find((a) => a.email === email);
      const roleLabel = match ? ` as ${match.label}` : '';
      toast.success(`Welcome back! Signing you in${roleLabel}`);
      
      router.push(fromPath || '/');
      router.refresh();
    } catch (e) {
      setError('root', {
        message: 'Network error. Please try again.',
      });
      setLoading(false);
    }
  };

  const autofill = (account: typeof demoAccounts[0]) => {
    setValue('email', account.email);
    setValue('password', account.password);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  if (!mounted) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex items-center gap-3">
            <AppLogo size={48} />
            <div>
              <p className="text-2xl font-bold text-ink leading-tight">Shalom</p>
              <p className="text-xs text-muted" style={{ letterSpacing: '0.06em' }}>Hebrew learning platform</p>
            </div>
          </div>
        </div>
        <div className="card-base p-8 flex flex-col items-center justify-center min-h-[350px]">
          <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand strip */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="flex items-center gap-3">
          <AppLogo size={48} />
          <div>
            <p className="text-2xl font-bold text-ink leading-tight">Shalom</p>
            <p className="text-xs text-muted" style={{ letterSpacing: '0.06em' }}>Hebrew learning platform</p>
          </div>
        </div>
      </div>

      <div className="card-base p-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Welcome back</h1>
          <p className="text-sm text-muted mt-1">Sign in to your account and pick up where you left off.</p>
        </div>

        {/* Error */}
        {errors.root && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
            style={{ backgroundColor: 'hsl(0 70% 52% / 0.08)', color: 'var(--danger)', border: '1px solid hsl(0 70% 52% / 0.2)' }}
          >
            <AlertCircle size={16} className="shrink-0" />
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate suppressHydrationWarning>
          {/* Email */}
          <div className="flex flex-col gap-1.5" suppressHydrationWarning>
            <label className="text-eyebrow text-muted" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="input-base"
              placeholder="you@demo.test"
              suppressHydrationWarning
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
              })}
            />
            {errors.email && (
              <p className="text-xs font-medium" style={{ color: 'var(--danger)' }}>{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5" suppressHydrationWarning>
            <label className="text-eyebrow text-muted" htmlFor="password">Password</label>
            <div className="relative" suppressHydrationWarning>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                className="input-base pr-12"
                placeholder="••••••••"
                suppressHydrationWarning
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters' } })}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-medium" style={{ color: 'var(--danger)' }}>{errors.password.message}</p>
            )}
          </div>

          {/* Remember */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded accent-primary"
              {...register('remember')}
            />
            <span className="text-sm text-muted">Remember me</span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-12 text-base"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Signing in…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn size={18} />
                Sign in
              </span>
            )}
          </button>
        </form>

        {/* Demo accounts */}
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{ border: '1.5px dashed var(--border)', backgroundColor: 'hsl(40 38% 97% / 0.6)' }}
        >
          <p className="text-eyebrow text-muted">Demo accounts</p>
          <div className="flex flex-col gap-1">
            {demoAccounts.map((acc, i) => (
              <div
                key={`demo-acc-${i}`}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-surface transition-all duration-150 group"
                onClick={() => autofill(acc)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && autofill(acc)}
                aria-label={`Use ${acc.role} account`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: acc.role === 'Admin' ? 'hsl(170 28% 32% / 0.12)' : 'hsl(32 78% 56% / 0.12)',
                      color: acc.role === 'Admin' ? 'var(--primary)' : '#8b5e10',
                    }}
                  >
                    {acc.role}
                  </span>
                  <span className="text-xs font-mono text-ink truncate">{acc.email}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); copyToClipboard(acc.email, `email-${i}`); }}
                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-muted hover:text-ink opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Copy email"
                >
                  {copied === `email-${i}` ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted">All passwords: <span className="font-mono font-semibold text-ink">password123</span></p>
        </div>
      </div>
    </div>
  );
}
