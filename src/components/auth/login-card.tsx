'use client';

// ============================================================
// PreOne — Login Card
// Glassmorphism card (dark) / solid card (light) with:
//   - Email/OTP tab switcher (Framer Motion sliding indicator)
//   - Email + password fields (with show/hide)
//   - 6-box OTP input (auto-advance + backspace + paste)
//   - Remember me (persist email to localStorage) + Forgot password
//   - "Launch Into PreOne" primary button (135deg purple→blue gradient)
//   - Demo accounts 2×2 grid (role-coded brand colors)
//   - Secure-login footer
//
// Authenticates against:
//   - Email tab → POST /api/auth/login  { email, password }
//   - OTP tab   → POST /api/auth/otp/verify  { phone: email, code, purpose: 'login' }
//
// Token is persisted in BOTH localStorage (Bearer header for client
// fetch helpers) AND the `preone_token` cookie (read by middleware
// for page-route auth). Keep both in sync — see CLAUDE.md.
// ============================================================

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Crown,
  Eye,
  EyeOff,
  GraduationCap,
  Heart,
  ListChecks,
  Loader2,
  Lock,
  Mail,
  Rocket,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

// ── Role-based redirect mapping ──
const ROLE_DASHBOARD: Record<string, string> = {
  ADMIN: '/admin',
  TASK_MASTER: '/admin/crm',
  TEACHER: '/teacher',
  PARENT: '/parent/dashboard',
};

const TOKEN_KEY = 'preone_token';
const USER_KEY = 'preone_user';
const REMEMBER_EMAIL_KEY = 'preone_remember_email';

function persistSession(token: string, user: unknown) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
}

// ── Demo accounts (role-coded brand colors — identical in both themes) ──
interface DemoAccount {
  role: string;
  email: string;
  password: string;
  bg: string;
  Icon: typeof Crown;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'Admin', email: 'admin@blossom.edu', password: 'demo123', bg: '#6B46C1', Icon: Crown },
  { role: 'Teacher', email: 'teacher@blossom.edu', password: 'demo123', bg: '#3B82F6', Icon: GraduationCap },
  { role: 'Parent', email: 'parent@blossom.edu', password: 'demo123', bg: '#EC4899', Icon: Heart },
  { role: 'Task Master', email: 'tasks@blossom.edu', password: 'demo123', bg: '#F59E0B', Icon: ListChecks },
];

type Tab = 'email' | 'otp';
type FieldErrors = { email?: string; password?: string; otp?: string };

export function LoginCard() {
  const router = useRouter();

  // ── Form state ──
  const [tab, setTab] = useState<Tab>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  // ── OTP send state ──
  // The OTP tab is a two-step flow: user clicks "Send code" → backend
  // emails (or SMSes) the code → user types it → clicks "Verify & Launch".
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── OTP refs (one per box, for auto-advance + backspace nav) ──
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  // ── Prefill remembered email on mount ──
  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  // ── Esc clears the currently-focused field ──
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key !== 'Escape') return;
      const active = document.activeElement as HTMLElement | null;
      if (!active) return;
      if (active === emailInputRef.current) {
        setEmail('');
        return;
      }
      if (active === passwordInputRef.current) {
        setPassword('');
        return;
      }
      // OTP input?
      const otpIndex = otpRefs.current.findIndex((el) => el === active);
      if (otpIndex >= 0) {
        setOtp((prev) => {
          const next = [...prev];
          next[otpIndex] = '';
          return next;
        });
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── OTP box handlers ──
  function handleOtpChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    // Take the last typed character so paste-into-single-box still works.
    const char = raw.length > 0 ? raw.charAt(raw.length - 1) : '';
    if (char !== '' && !/^\d$/.test(char)) return; // digits only

    setOtp((prev) => {
      const next = [...prev];
      next[index] = char;
      return next;
    });
    setErrors((prev) => ({ ...prev, otp: undefined }));

    // Auto-advance on type
    if (char !== '' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      // If current box is empty AND there's a previous box, move focus back
      // and clear that previous box.
      if (otp[index] === '' && index > 0) {
        e.preventDefault();
        otpRefs.current[index - 1]?.focus();
        setOtp((prev) => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const digits = pasted.replace(/\D/g, '').slice(0, 6).split('');
    if (digits.length === 0) return;
    setOtp((prev) => {
      const next = [...prev];
      digits.forEach((d, i) => {
        if (i < 6) next[i] = d;
      });
      return next;
    });
    setErrors((prev) => ({ ...prev, otp: undefined }));
    // Focus the box after the last pasted digit (or last box)
    const focusIndex = Math.min(digits.length, 5);
    otpRefs.current[focusIndex]?.focus();
  }

  // ── Validation ──
  function validate(): boolean {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = 'Email is required';
    if (tab === 'email') {
      if (!password) next.password = 'Password is required';
    } else {
      if (!otpSent) next.otp = 'Click "Send code" to receive a verification code first';
      else if (otp.join('').length !== 6) next.otp = 'Enter the 6-digit code';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ── Resend cooldown ticker (counts down 30 → 0) ──
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ── Send OTP to the email/phone the user typed ──
  async function handleSendOtp() {
    if (!email.trim()) {
      setErrors((prev) => ({ ...prev, email: 'Enter your email first' }));
      emailInputRef.current?.focus();
      return;
    }
    if (otpSending || resendCooldown > 0) return;

    setOtpSending(true);
    setErrors((prev) => ({ ...prev, otp: undefined }));
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, purpose: 'login' }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to send OTP');
        return;
      }
      setOtpSent(true);
      setResendCooldown(30);
      // Dev convenience: surface the code so the tester doesn't need to
      // check the server console.
      if (data.devOtpCode) {
        toast.success(`OTP sent (dev code: ${data.devOtpCode})`, {
          description: data.deliveredTo ?? undefined,
        });
      } else {
        toast.success('OTP sent', { description: data.deliveredTo ?? undefined });
      }
      // Focus the first OTP box so the user can start typing immediately.
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      console.error('OTP send error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setOtpSending(false);
    }
  }

  // ── Reset OTP-tab state when switching tabs ──
  function handleTabChange(next: Tab) {
    if (next === tab) return;
    setTab(next);
    if (next !== 'otp') {
      // Leaving OTP tab — clear OTP state so coming back starts fresh.
      setOtp(['', '', '', '', '', '']);
      setOtpSent(false);
      setResendCooldown(0);
      setErrors({});
    } else {
      // Entering OTP tab — clear password field (not used here) but keep email.
      setErrors({});
    }
  }

  // ── Submit ──
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    // Persist remembered email (never password)
    if (rememberMe) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }

    try {
      const endpoint = tab === 'email' ? '/api/auth/login' : '/api/auth/otp/verify';
      const body =
        tab === 'email'
          ? { email, password }
          : { identifier: email, code: otp.join(''), purpose: 'login' };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Invalid credentials');
        return;
      }

      persistSession(data.token, data.user);
      toast.success('Welcome back!');

      const role = data.user?.role as string;
      const dashboardPath = ROLE_DASHBOARD[role] || '/admin/dashboard';
      router.push(dashboardPath);
      router.refresh();
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Demo account click — prefill + auto-submit after 400ms ──
  function handleDemoClick(account: DemoAccount) {
    setEmail(account.email);
    setPassword(account.password);
    setOtp(['', '', '', '', '', '']);
    setOtpSent(false);
    setResendCooldown(0);
    setErrors({});
    // Ensure we're on the email tab (demo accounts use password auth)
    handleTabChange('email');
    setTimeout(() => {
      // Submit programmatically by calling handleSubmit with a synthetic event.
      // We re-validate inline so the prefilled values are picked up.
      (async () => {
        setIsLoading(true);
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: account.email, password: account.password }),
          });
          const data = await res.json();
          if (!res.ok) {
            toast.error(data.error || `Demo ${account.role} login failed`);
            return;
          }
          persistSession(data.token, data.user);
          toast.success(`Welcome back! (${account.role} demo)`);
          const role = data.user?.role as string;
          router.push(ROLE_DASHBOARD[role] || '/admin/dashboard');
          router.refresh();
        } catch (err) {
          console.error('Demo login error:', err);
          toast.error('Something went wrong. Please try again.');
        } finally {
          setIsLoading(false);
        }
      })();
    }, 400);
  }

  const otpComplete = otp.join('').length === 6;
  const buttonLabel =
    tab === 'email'
      ? isLoading
        ? 'Launching…'
        : 'Launch Into PreOne'
      : isLoading
        ? 'Launching…'
        : 'Verify & Launch';

  // ============================================================
  // Render
  // ============================================================
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24, mass: 0.8, delay: 0.1 }}
      className="
        login-theme-transition
        login-card-glass
        w-full max-w-[440px]
        rounded-2xl md:rounded-[20px]
        p-4 sm:p-5 md:p-8 md:px-10
      "
      role="form"
      aria-label="PreOne login form"
    >
      {/* ── 3.1 Logo + Welcome ── */}
      {/* Mobile: skip the in-card logo (brand area already shows it).
          Desktop (md+): show the logo + welcome heading. */}
      <div className="text-center">
        <div className="hidden md:flex md:items-center md:justify-center">
          <Image
            src="/preonelogo.png"
            alt="PreOne logo"
            width={72}
            height={72}
            priority
            className="h-16 w-16 md:h-[72px] md:w-[72px] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
          />
        </div>

        <h2
          className="
            mt-0 md:mt-4
            text-[20px] sm:text-[22px] md:text-[24px] leading-[1.2] font-bold
            text-login-text
          "
        >
          Welcome back
        </h2>
        <p
          className="
            mt-1 text-[12px] sm:text-[13px] md:text-[14px] leading-[1.5] font-normal
            text-login-muted
          "
        >
          Sign in to your PreOne account
        </p>
      </div>

      {/* ── 3.2 Tab switcher — Email / OTP ── */}
      <div
        role="tablist"
        aria-label="Login method"
        className="
          mt-5 md:mt-6 flex h-10 w-full items-center gap-1 rounded-[10px]
          bg-login-tab-bg p-1
        "
      >
        {(['email', 'otp'] as const).map((t) => {
          const isActive = tab === t;
          const Icon = t === 'email' ? Mail : Smartphone;
          const label = t === 'email' ? 'Email' : 'OTP';
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(t)}
              className="
                relative flex h-8 flex-1 items-center justify-center gap-1.5
                rounded-[8px] text-[13px] font-medium
                text-login-muted transition-colors
                hover:bg-brand-purple/10
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-login-focus
                focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
              "
            >
              {isActive && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute inset-0 rounded-[8px] bg-login-tab-active"
                  transition={{ type: 'spring', stiffness: 400, damping: 32, duration: 0.24 }}
                />
              )}
              <span
                className={`
                  relative z-10 flex items-center gap-1.5
                  ${isActive ? 'text-white' : ''}
                `}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 3.3 Form ── */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 md:mt-6 md:space-y-4" noValidate suppressHydrationWarning>
        {/* Email / Username */}
        <div>
          <label
            htmlFor="login-email"
            className="
              mb-1.5 block text-[13px] md:text-[14px] font-medium
              text-login-label
            "
          >
            Email / Username
          </label>
          <div
            className={`
              login-input-focus flex h-11 md:h-11 items-center gap-2.5
              rounded-xl md:rounded-[8px] border
              px-3.5 transition-all
              bg-login-input border-login-input-border
              ${errors.email ? '!border-login-error' : ''}
            `}
          >
            <Mail
              className="h-[18px] w-[18px] shrink-0 text-login-icon"
              aria-hidden="true"
            />
            <input
              ref={emailInputRef}
              id="login-email"
              type="text"
              inputMode="email"
              autoComplete="email"
              placeholder="you@school.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              disabled={isLoading}
              aria-invalid={!!errors.email}
              aria-label="Email or username"
              suppressHydrationWarning
              className="
                h-full w-full bg-transparent text-[14px] text-login-text
                placeholder:text-login-subtle
                focus:outline-none
                disabled:opacity-60
              "
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-[12px] text-login-error">{errors.email}</p>
          )}
        </div>

        {/* Password (Email tab) OR OTP (OTP tab) */}
        {tab === 'email' ? (
          <div>
            <label
              htmlFor="login-password"
              className="
                mb-1.5 block text-[13px] md:text-[14px] font-medium
                text-login-label
              "
            >
              Password
            </label>
            <div
              className={`
                login-input-focus flex h-11 md:h-11 items-center gap-2.5
                rounded-xl md:rounded-[8px] border
                px-3.5 transition-all
                bg-login-input border-login-input-border
                ${errors.password ? '!border-login-error' : ''}
              `}
            >
              <Lock
                className="h-[18px] w-[18px] shrink-0 text-login-icon-muted"
                aria-hidden="true"
              />
              <input
                ref={passwordInputRef}
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                disabled={isLoading}
                aria-invalid={!!errors.password}
                aria-label="Password"
                suppressHydrationWarning
                className="
                  h-full w-full bg-transparent text-[14px] text-login-text
                  placeholder:text-login-subtle
                  focus:outline-none
                  disabled:opacity-60
                "
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                suppressHydrationWarning
                className="
                  text-login-icon-muted transition-opacity hover:opacity-80
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-login-focus focus-visible:rounded
                "
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-[12px] text-login-error">{errors.password}</p>
            )}
          </div>
        ) : (
          <div>
            {/* Label row with Send-code button */}
            <div className="mb-1.5 flex items-center justify-between">
              <label
                className="
                  block text-[13px] md:text-[14px] font-medium
                  text-login-label
                "
              >
                Verification Code
              </label>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpSending || resendCooldown > 0 || isLoading}
                className="
                  flex items-center gap-1 text-[13px] font-medium
                  text-login-link hover:underline
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-login-focus focus-visible:rounded
                  disabled:opacity-60 disabled:no-underline disabled:cursor-not-allowed
                "
              >
                {otpSending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Sending…
                  </>
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : otpSent ? (
                  'Resend code'
                ) : (
                  'Send code'
                )}
              </button>
            </div>

            <div
              className={`
                flex justify-between gap-2
                ${errors.otp ? 'rounded-[8px]' : ''}
              `}
              onPaste={handleOtpPaste}
            >
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  disabled={isLoading || !otpSent}
                  aria-label={`OTP digit ${i + 1}`}
                  className={`
                    h-10 w-10 sm:h-11 sm:w-11 rounded-xl md:rounded-[8px] border text-center
                    font-mono text-[16px] font-medium
                    text-login-text
                    transition-all
                    bg-login-input border-login-input-border
                    focus:border-login-focus focus:outline-none
                    focus:ring-[3px] focus:ring-login-focus/18
                    ${errors.otp ? '!border-login-error' : ''}
                    disabled:opacity-60
                  `}
                />
              ))}
            </div>
            {errors.otp && (
              <p className="mt-1 text-[12px] text-login-error">{errors.otp}</p>
            )}
            {otpSent && !errors.otp && (
              <p
                className="
                  mt-1 text-[12px]
                  text-login-subtle
                "
              >
                Enter the 6-digit code we sent to your email.
              </p>
            )}
          </div>
        )}

        {/* Remember me + Forgot password (email tab only) */}
        {tab === 'email' && (
          <div className="flex items-center justify-between gap-4 pt-1">
            <label className="flex cursor-pointer items-center gap-2">
              <span className="relative inline-flex h-4 w-4 items-center justify-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  className={`
                    inline-block h-4 w-4 rounded-[4px] border transition-all
                    border-login-input-border bg-login-input
                    peer-checked:login-checkbox-checked
                    peer-focus-visible:ring-2 peer-focus-visible:ring-login-focus
                    peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-transparent
                  `}
                />
                {rememberMe && (
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    className="absolute h-3 w-3 text-white"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 8.5L6.5 12L13 4.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span
                className="
                  text-[12px] md:text-[13px]
                  text-login-label
                "
              >
                Remember me
              </span>
            </label>
            <Link
              href="/forgot-password"
              className="
                text-[12px] md:text-[13px] font-medium
                text-login-link hover:underline
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-login-focus focus-visible:rounded
                py-1.5
              "
            >
              Forgot Password?
            </Link>
          </div>
        )}

        {/* ── 3.4 Primary button ── */}
        <button
          type="submit"
          disabled={
            isLoading ||
            (tab === 'otp' && (!otpSent || !otpComplete))
          }
          suppressHydrationWarning
          className="
            btn-launch mt-4 md:mt-5 flex h-11 sm:h-[52px] md:h-12 w-full
            items-center justify-center gap-2
            rounded-xl md:rounded-[8px]
            text-[14px] sm:text-[16px] text-white font-bold
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-login-focus focus-visible:ring-offset-2
            focus-visible:ring-offset-transparent
          "
        >
          {isLoading ? (
            <>
              <Loader2 className="h-[18px] w-[18px] animate-spin" />
              {buttonLabel}
            </>
          ) : (
            <>
              {buttonLabel}
              <Rocket className="h-[18px] w-[18px]" />
            </>
          )}
        </button>
      </form>

      {/* ── 3.5 Divider ── */}
      <div className="mt-4 md:mt-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-login-divider" />
        <span
          className="
            text-[11px] md:text-[12px] uppercase tracking-[0.06em]
            text-login-subtle
          "
        >
          or try a demo account
        </span>
        <div className="h-px flex-1 bg-login-divider" />
      </div>

      {/* ── 3.6 Demo accounts — 2×2 grid (kept on mobile) ── */}
      <div className="mt-3.5 md:mt-4 grid grid-cols-2 gap-2">
        {DEMO_ACCOUNTS.map(({ role, email: demoEmail, bg, Icon }) => (
          <button
            key={role}
            type="button"
            onClick={() => handleDemoClick({ role, email: demoEmail, password: 'demo123', bg, Icon })}
            disabled={isLoading}
            title={`Sign in as ${role} — ${demoEmail}`}
            suppressHydrationWarning
            className="
              login-demo-cell
              flex h-12 sm:h-14 items-center gap-2 sm:gap-2.5 rounded-xl md:rounded-[8px]
              p-2 sm:p-2.5 md:p-3 text-left
              transition-[filter] duration-150
              hover:brightness-110
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-white focus-visible:ring-offset-2
              focus-visible:ring-offset-transparent
              disabled:opacity-60
            "
            style={{ background: bg }}
            aria-label={`Sign in as demo ${role}`}
          >
            <span
              className="
                flex h-7 w-7 shrink-0 items-center justify-center rounded-md
                bg-white/15
              "
            >
              <Icon className="h-4 w-4 md:h-[18px] md:w-[18px] text-white" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[12px] md:text-[13px] font-bold leading-tight text-white">
                {role}
              </span>
              <span
                className="
                  truncate font-mono text-[10px] md:text-[11px] font-normal leading-tight
                  text-white/80
                "
              >
                {demoEmail}
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* ── 3.7 Footer — secure login (inside card on mobile) ── */}
      <div
        className="
          mt-5 md:mt-6 flex items-center justify-center gap-1.5 text-center
          text-[11px] md:text-[12px]
          text-login-muted
        "
      >
        <ShieldCheck className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0 text-login-link" />
        <span>Secure Login • Your data is protected with enterprise-grade security</span>
      </div>
    </motion.div>
  );
}
