'use client';

// ============================================================
// PreOne — Login Page
// Beautiful preschool-themed login with brand gradient
// ============================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, GraduationCap, Loader2, Mail, Lock, ArrowLeft, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { CHART_PALETTE } from '@/lib/theme-tokens';

// ============================================================
// Types
// ============================================================

interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'TEACHER' | 'PARENT' | 'TASK_MASTER';
    schoolId?: string | null;
    branchId?: string | null;
    phone?: string | null;
    avatar?: string | null;
  };
}

// ============================================================
// Role-based redirect mapping
// ============================================================

const ROLE_DASHBOARD: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  TEACHER: '/teacher/dashboard',
  PARENT: '/parent/dashboard',
  TASK_MASTER: '/taskmaster/dashboard',
};

// ============================================================
// Login Page Component
// ============================================================

export default function LoginPage() {
  const router = useRouter();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password dialog state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [otpValue, setOtpValue] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // ============================================================
  // Login Handler
  // ============================================================

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Invalid credentials');
        return;
      }

      const { token, user } = data as LoginResponse;

      // Store token and user data in localStorage
      localStorage.setItem('preone_token', token);
      localStorage.setItem('preone_user', JSON.stringify(user));

      // Also store token in cookie so middleware can read it
      document.cookie = `preone_token=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;

      toast.success(`Welcome back, ${user.name}!`);

      // Redirect based on role
      const dashboardPath = ROLE_DASHBOARD[user.role] || '/login';
      router.push(dashboardPath);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // ============================================================
  // Forgot Password Handlers
  // ============================================================

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();

    if (!forgotEmail) {
      toast.error('Please enter your email');
      return;
    }

    setIsForgotLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      if (response.ok) {
        toast.success('OTP sent to your email (check console for demo)');
        setForgotStep('otp');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsForgotLoading(false);
    }
  }

  async function handleVerifyOTPAndReset(e: React.FormEvent) {
    e.preventDefault();

    if (otpValue.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setIsForgotLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          otp: otpValue,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password reset successful! Please login.');
        setForgotOpen(false);
        setForgotStep('email');
        setOtpValue('');
        setNewPassword('');
        setForgotEmail('');
      } else {
        toast.error(data.error || 'Failed to reset password');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsForgotLoading(false);
    }
  }

  function resetForgotDialog() {
    setForgotStep('email');
    setOtpValue('');
    setNewPassword('');
    setForgotEmail('');
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-login-gradient">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-200/30 dark:bg-purple-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-200/30 dark:bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-200/20 dark:bg-sky-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />

        {/* Space dots pattern */}
        <div className="absolute inset-0 space-dots opacity-30" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-gradient shadow-xl shadow-purple-500/25 mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            PreOne
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Operating System for Modern Preschools
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl shadow-purple-500/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl card-preone">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your PreOne account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@preone.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 rounded-xl border-purple-200 dark:border-purple-800/50 focus:border-purple-500 focus:ring-purple-500/20"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Dialog open={forgotOpen} onOpenChange={(open) => { setForgotOpen(open); if (!open) resetForgotDialog(); }}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium hover:underline transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </DialogTrigger>

                    {/* Forgot Password Dialog */}
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <KeyRound className="h-5 w-5" style={{ color: CHART_PALETTE.series[0] }} />
                          Reset Password
                        </DialogTitle>
                        <DialogDescription>
                          {forgotStep === 'email' && 'Enter your email to receive a verification code'}
                          {forgotStep === 'otp' && 'Enter the 6-digit code sent to your email'}
                          {forgotStep === 'reset' && 'Enter your new password'}
                        </DialogDescription>
                      </DialogHeader>

                      {/* Step 1: Email */}
                      {forgotStep === 'email' && (
                        <form onSubmit={handleSendOTP} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="forgot-email">Email Address</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="forgot-email"
                                type="email"
                                placeholder="Enter your email"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                className="pl-10"
                                disabled={isForgotLoading}
                              />
                            </div>
                          </div>
                          <Button
                            type="submit"
                            className="w-full btn-brand"
                            disabled={isForgotLoading}
                          >
                            {isForgotLoading ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending OTP...</>
                            ) : (
                              'Send Verification Code'
                            )}
                          </Button>
                        </form>
                      )}

                      {/* Step 2: OTP + New Password */}
                      {forgotStep === 'otp' && (
                        <form onSubmit={handleVerifyOTPAndReset} className="space-y-4">
                          <div className="space-y-2">
                            <Label>Verification Code</Label>
                            <div className="flex justify-center">
                              <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                                <InputOTPGroup>
                                  <InputOTPSlot index={0} />
                                  <InputOTPSlot index={1} />
                                  <InputOTPSlot index={2} />
                                  <InputOTPSlot index={3} />
                                  <InputOTPSlot index={4} />
                                  <InputOTPSlot index={5} />
                                </InputOTPGroup>
                              </InputOTP>
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                              Code sent to {forgotEmail} (check console for demo)
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="new-password"
                                type="password"
                                placeholder="Minimum 6 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="pl-10"
                                disabled={isForgotLoading}
                                minLength={6}
                              />
                            </div>
                          </div>

                          <Button
                            type="submit"
                            className="w-full btn-brand"
                            disabled={isForgotLoading || otpValue.length !== 6}
                          >
                            {isForgotLoading ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</>
                            ) : (
                              'Reset Password'
                            )}
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full"
                            onClick={() => setForgotStep('email')}
                          >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                          </Button>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 rounded-xl border-purple-200 dark:border-purple-800/50 focus:border-purple-500 focus:ring-purple-500/20"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold rounded-xl btn-brand shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 pt-4 border-t border-purple-100 dark:border-purple-800/30">
              <p className="text-xs text-muted-foreground text-center mb-3">Demo Credentials</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { role: 'Admin', email: 'admin@preone.com', password: 'admin123' },
                  { role: 'Teacher', email: 'kavitha.raman@littlestars.com', password: 'password123' },
                  { role: 'Parent', email: 'rajesh.sharma@email.com', password: 'password123' },
                ].map((cred) => (
                  <button
                    key={cred.role}
                    type="button"
                    onClick={() => {
                      setEmail(cred.email);
                      setPassword(cred.password);
                    }}
                    className="text-left p-2 rounded-lg bg-purple-50/50 dark:bg-purple-900/20 hover:bg-purple-100/70 dark:hover:bg-purple-900/30 transition-colors border border-purple-100/50 dark:border-purple-800/30"
                  >
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">{cred.role}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{cred.email}</p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          PreOne &copy; {new Date().getFullYear()} &mdash; Built with love for little learners
        </p>
      </div>
    </div>
  );
}
