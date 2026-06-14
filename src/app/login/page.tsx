'use client';

// ============================================================
// PreOne — Login Page
// Beautiful cosmic-themed login with Email+Password & OTP tabs
// Uses NextAuth signIn for credential-based authentication
// ============================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Loader2,
  Mail,
  Lock,
  Phone,
  KeyRound,
  GraduationCap,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import Link from 'next/link';
import { motion } from 'framer-motion';

// ============================================================
// Role-based redirect mapping
// ============================================================

const ROLE_DASHBOARD: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  TASK_MASTER: '/admin/crm',
  TEACHER: '/teacher/dashboard',
  PARENT: '/parent/dashboard',
};

const TOKEN_KEY = 'preone_token';
const USER_KEY = 'preone_user';

// Persist the auth token where the rest of the app reads it:
// - localStorage: Bearer token for the parent/teacher fetch wrappers + API calls
// - cookie: read by the middleware + server layouts for page-route auth
function persistSession(token: string, user: unknown) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
}

// ============================================================
// Login Page Component
// ============================================================

export default function LoginPage() {
  const router = useRouter();

  // ── Email+Password state ──
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ── OTP state ──
  const [phone, setPhone] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'verify'>('phone');
  const [isOtpLoading, setIsOtpLoading] = useState(false);

  // ============================================================
  // Email+Password Login
  // ============================================================

  async function handleCredentialLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Invalid email or password');
        return;
      }

      persistSession(data.token, data.user);
      toast.success('Welcome back!');

      const role = data.user?.role as string;
      const dashboardPath = ROLE_DASHBOARD[role] || '/admin/dashboard';
      router.push(dashboardPath);
      router.refresh();
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // ============================================================
  // OTP Login
  // ============================================================

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();

    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsOtpLoading(true);

    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose: 'login' }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to send OTP');
        return;
      }

      toast.success('OTP sent to your phone (check console for demo)');
      setOtpStep('verify');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsOtpLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();

    if (otpValue.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setIsOtpLoading(true);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otpValue, purpose: 'login' }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Invalid or expired OTP');
        return;
      }

      persistSession(data.token, data.user);
      toast.success('Welcome back!');

      const role = data.user?.role as string;
      const dashboardPath = ROLE_DASHBOARD[role] || '/admin/dashboard';
      router.push(dashboardPath);
      router.refresh();
    } catch (error) {
      console.error('OTP login error:', error);
      toast.error('Something went wrong');
    } finally {
      setIsOtpLoading(false);
    }
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-login-gradient">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-200/30 dark:bg-purple-500/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-20 right-20 w-96 h-96 bg-pink-200/30 dark:bg-pink-500/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-200/20 dark:bg-sky-500/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '4s' }}
        />
        <div className="absolute inset-0 space-dots opacity-30" />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
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
            <CardTitle className="text-2xl font-bold text-center">
              Welcome back
            </CardTitle>
            <CardDescription className="text-center">
              Sign in to your PreOne account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="email" className="flex-1 gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="otp" className="flex-1 gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  OTP
                </TabsTrigger>
              </TabsList>

              {/* ── Email + Password Tab ── */}
              <TabsContent value="email">
                <form onSubmit={handleCredentialLogin} className="space-y-4">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email / Username
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="text"
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
                      <Link
                        href="/forgot-password"
                        className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium hover:underline transition-colors"
                      >
                        Forgot Password?
                      </Link>
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
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
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
              </TabsContent>

              {/* ── OTP Tab ── */}
              <TabsContent value="otp">
                {otpStep === 'phone' ? (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Enter your phone number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10 h-11 rounded-xl border-purple-200 dark:border-purple-800/50 focus:border-purple-500 focus:ring-purple-500/20"
                          disabled={isOtpLoading}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 text-base font-semibold rounded-xl btn-brand shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200"
                      disabled={isOtpLoading}
                    >
                      {isOtpLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        'Send OTP'
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Verification Code
                      </Label>
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={otpValue}
                          onChange={setOtpValue}
                        >
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
                        Code sent to {phone} (check console for demo)
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 text-base font-semibold rounded-xl btn-brand shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200"
                      disabled={isOtpLoading || otpValue.length !== 6}
                    >
                      {isOtpLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify & Sign In'
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setOtpStep('phone');
                        setOtpValue('');
                      }}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>

            {/* Demo Credentials */}
            <div className="mt-6 pt-4 border-t border-purple-100 dark:border-purple-800/30">
              <p className="text-xs text-muted-foreground text-center mb-3">
                Demo Credentials
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    role: 'Admin',
                    email: 'admin@blossom.edu',
                    password: 'Admin@123',
                  },
                  {
                    role: 'Teacher',
                    email: 'priya@blossom.edu',
                    password: 'Teacher@123',
                  },
                  {
                    role: 'Parent',
                    email: 'raj@family.com',
                    password: 'Parent@123',
                  },
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
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                      {cred.role}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {cred.email}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Register Link */}
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:underline transition-colors"
            >
              Register your school
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          PreOne &copy; {new Date().getFullYear()} &mdash; Built with love for
          little learners
        </p>
      </motion.div>
    </div>
  );
}
