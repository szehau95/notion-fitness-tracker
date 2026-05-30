import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, Lock, User, ArrowRight, Eye, EyeOff, Sun, Moon } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onRegister: (email: string, password: string, displayName: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  onPhoneLogin: (phone: string) => Promise<{ success: boolean; error?: string }>;
  theme?: 'dark' | 'light';
  onThemeToggle?: () => void;
}

function isPhoneNumber(value: string) {
  return /^[+\d][\d\s\-().]{4,}$/.test(value.trim());
}

export function AuthScreen({ onLogin, onRegister, onPhoneLogin, theme = 'dark', onThemeToggle }: AuthScreenProps) {
  const isLight = theme === 'light';

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Sign-in fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register fields
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountNotFound, setAccountNotFound] = useState(false);

  const detectedPhone = isPhoneNumber(identifier);

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    setError('');
    setAccountNotFound(false);
    if (m === 'register' && identifier && !detectedPhone) {
      setRegEmail(identifier);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAccountNotFound(false);
    setLoading(true);

    let result;
    if (mode === 'login') {
      if (detectedPhone) {
        result = await onPhoneLogin(identifier.trim());
      } else {
        result = await onLogin(identifier.trim(), password);
      }
    } else {
      if (!displayName.trim()) { setError('Please enter your name.'); setLoading(false); return; }
      if (regPassword !== regConfirm) { setError('Passwords do not match.'); setLoading(false); return; }
      result = await onRegister(regEmail.trim(), regPassword, displayName.trim(), regPhone.trim() || undefined);
    }

    if (!result.success) {
      const errMsg = result.error || 'Something went wrong.';
      setError(errMsg);
      if (errMsg.toLowerCase().includes('no account') || errMsg.toLowerCase().includes('not found')) {
        setAccountNotFound(true);
      }
    }
    setLoading(false);
  };

  // ─── Theme-aware styles ───────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = isLight
    ? {
        width: '100%',
        padding: '12px 12px 12px 40px',
        background: '#FDF5F2',
        border: '1px solid #E8D4CC',
        borderRadius: '12px',
        color: '#2D2420',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }
    : {
        width: '100%',
        padding: '12px 12px 12px 40px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      };

  const labelStyle: React.CSSProperties = isLight
    ? {
        display: 'block',
        fontSize: '11px',
        fontWeight: 600,
        color: '#9B7870',
        marginBottom: '6px',
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
      }
    : {
        display: 'block',
        fontSize: '12px',
        fontWeight: 500,
        color: 'rgba(255,255,255,0.45)',
        marginBottom: '6px',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      };

  const iconColor = isLight ? '#C2968E' : 'rgba(255,255,255,0.3)';

  const inputFocusBorder = isLight ? '#C27B6E' : 'rgba(16,185,129,0.6)';
  const inputBlurBorder  = isLight ? '#E8D4CC' : 'rgba(255,255,255,0.1)';

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{
        background: isLight
          ? 'linear-gradient(160deg, #FDF8F5 0%, #FDF0EC 60%, #FAE8F0 100%)'
          : 'linear-gradient(160deg, #0D0A0F 0%, #0A0A12 50%, #0F0A0A 100%)',
      }}
    >
      {/* Background orb */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full"
          style={{
            background: isLight ? 'radial-gradient(circle, #C27B6E, transparent 70%)' : 'radial-gradient(circle, #10B981, transparent 70%)',
            opacity: isLight ? 0.10 : 0.07,
          }}
        />
        {isLight && (
          <div
            className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full"
            style={{ background: 'radial-gradient(circle, #A06090, transparent 70%)', opacity: 0.07 }}
          />
        )}
      </div>

      {/* Theme toggle — top right */}
      {onThemeToggle && (
        <button
          onClick={onThemeToggle}
          title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
          className="fixed top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
          style={isLight
            ? { background: '#F5EAE6', color: '#C27B6E', border: '1px solid #E8D4CC' }
            : { background: 'rgba(255,255,255,0.1)', color: '#a1a1aa' }
          }
        >
          {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
      )}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl mb-1"
            style={isLight
              ? { background: 'linear-gradient(135deg, #F5EAE6, #FAE0D8)', border: '1px solid #E8C4BC', boxShadow: '0 4px 16px rgba(194,123,110,0.15)' }
              : { background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))', border: '1px solid rgba(16,185,129,0.25)' }
            }
          >
            <span style={{ fontSize: '26px', lineHeight: 1 }}>✦</span>
          </div>
          <h1
            className="mt-3 text-2xl tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 400, color: isLight ? '#2D2420' : '#fff' }}
          >
            Notion <span style={{ color: isLight ? '#C27B6E' : '#10B981' }}>Tracker</span>
          </h1>
          <p className="mt-1 text-xs" style={{ color: isLight ? '#A0918E' : 'rgba(255,255,255,0.35)' }}>
            Your fitness command center
          </p>
        </div>

        {/* Tab switcher */}
        <div
          className="mb-6 flex rounded-2xl p-1"
          style={isLight
            ? { background: '#F5EAE6', border: '1px solid #E8D4CC' }
            : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }
          }
        >
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-all duration-200"
              style={mode === m
                ? isLight
                  ? { background: '#FFFFFF', color: '#C27B6E', border: '1px solid #E8C4BC', boxShadow: '0 2px 8px rgba(194,123,110,0.12)' }
                  : { background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }
                : isLight
                  ? { color: '#A0918E', border: '1px solid transparent' }
                  : { color: 'rgba(255,255,255,0.35)', border: '1px solid transparent' }
              }
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-6"
          style={isLight
            ? { background: '#FFFFFF', border: '1px solid #F0E4DC', boxShadow: '0 4px 24px rgba(194,123,110,0.08)' }
            : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }
          }
        >
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* ── SIGN IN ── */}
              {mode === 'login' && (
                <>
                  <div>
                    <label style={labelStyle}>Email or Phone</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: iconColor }}>
                        {detectedPhone
                          ? <Phone style={{ width: 15, height: 15, display: 'inline' }} />
                          : <Mail style={{ width: 15, height: 15, display: 'inline' }} />}
                      </span>
                      <input
                        value={identifier}
                        onChange={(e) => { setIdentifier(e.target.value); setAccountNotFound(false); setError(''); }}
                        placeholder="you@example.com"
                        style={inputStyle}
                        required
                        autoComplete="email"
                        onFocus={(e) => (e.target.style.borderColor = inputFocusBorder)}
                        onBlur={(e) => (e.target.style.borderColor = inputBlurBorder)}
                      />
                    </div>
                    {detectedPhone && (
                      <p className="mt-1 text-xs" style={{ color: isLight ? '#C27B6E' : '#10B981' }}>Phone number detected — no password needed</p>
                    )}
                  </div>

                  {!detectedPhone && (
                    <div>
                      <label style={labelStyle}>Password</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: iconColor }}>
                          <Lock style={{ width: 15, height: 15 }} />
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Your password"
                          style={{ ...inputStyle, paddingRight: '40px' }}
                          required={!detectedPhone}
                          autoComplete="current-password"
                          onFocus={(e) => (e.target.style.borderColor = inputFocusBorder)}
                          onBlur={(e) => (e.target.style.borderColor = inputBlurBorder)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          style={{ color: iconColor, background: 'none', border: 'none', cursor: 'pointer', minHeight: 0, minWidth: 0, padding: 0 }}
                        >
                          {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── SIGN UP ── */}
              {mode === 'register' && (
                <>
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: iconColor }}>
                        <User style={{ width: 15, height: 15 }} />
                      </span>
                      <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name"
                        style={inputStyle}
                        required
                        autoComplete="name"
                        onFocus={(e) => (e.target.style.borderColor = inputFocusBorder)}
                        onBlur={(e) => (e.target.style.borderColor = inputBlurBorder)}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Email</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: iconColor }}>
                        <Mail style={{ width: 15, height: 15 }} />
                      </span>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="you@example.com"
                        style={inputStyle}
                        required
                        autoComplete="username"
                        onFocus={(e) => (e.target.style.borderColor = inputFocusBorder)}
                        onBlur={(e) => (e.target.style.borderColor = inputBlurBorder)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={labelStyle}>Password</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: iconColor }}>
                          <Lock style={{ width: 15, height: 15 }} />
                        </span>
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min 6 chars"
                          style={{ ...inputStyle, paddingRight: '36px' }}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          onFocus={(e) => (e.target.style.borderColor = inputFocusBorder)}
                          onBlur={(e) => (e.target.style.borderColor = inputBlurBorder)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: iconColor, background: 'none', border: 'none', cursor: 'pointer', minHeight: 0, minWidth: 0, padding: 0 }}
                        >
                          {showRegPassword ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Confirm</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: iconColor }}>
                          <Lock style={{ width: 15, height: 15 }} />
                        </span>
                        <input
                          type={showRegConfirm ? 'text' : 'password'}
                          value={regConfirm}
                          onChange={(e) => setRegConfirm(e.target.value)}
                          placeholder="Re-enter"
                          style={{ ...inputStyle, paddingRight: '36px' }}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          onFocus={(e) => (e.target.style.borderColor = inputFocusBorder)}
                          onBlur={(e) => (e.target.style.borderColor = inputBlurBorder)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirm(!showRegConfirm)}
                          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: iconColor, background: 'none', border: 'none', cursor: 'pointer', minHeight: 0, minWidth: 0, padding: 0 }}
                        >
                          {showRegConfirm ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Phone{' '}
                      <span style={{ color: isLight ? '#C2B0AE' : 'rgba(255,255,255,0.2)', textTransform: 'none', letterSpacing: 0 }}>
                        (optional)
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: iconColor }}>
                        <Phone style={{ width: 15, height: 15 }} />
                      </span>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+60123456789"
                        style={inputStyle}
                        onFocus={(e) => (e.target.style.borderColor = inputFocusBorder)}
                        onBlur={(e) => (e.target.style.borderColor = inputBlurBorder)}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Error + re-register nudge */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-3"
                  style={isLight
                    ? { background: '#FEF2F2', border: '1px solid #FECACA' }
                    : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }
                  }
                >
                  <p className="text-sm" style={{ color: isLight ? '#B91C1C' : '#FCA5A5' }}>{error}</p>
                  {accountNotFound && (
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="mt-2 text-xs font-medium hover:underline underline-offset-2"
                      style={{ color: isLight ? '#C27B6E' : '#10B981', background: 'none', border: 'none', cursor: 'pointer', minHeight: 0, minWidth: 0, padding: 0 }}
                    >
                      → Create a new account with this email
                    </button>
                  )}
                </motion.div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                style={{
                  background: loading ? 'rgba(16,185,129,0.5)' : isLight ? 'linear-gradient(135deg, #C27B6E, #A06090)' : 'linear-gradient(135deg, #10B981, #059669)',
                  boxShadow: isLight ? '0 4px 20px rgba(194,123,110,0.35)' : '0 4px 20px rgba(16,185,129,0.35)',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
                  {!loading && <ArrowRight style={{ width: 15, height: 15 }} />}
                </span>
              </button>
            </motion.form>
          </AnimatePresence>
        </div>

        {/* Bottom switch */}
        <p className="mt-5 text-center text-xs" style={{ color: isLight ? '#A0918E' : 'rgba(255,255,255,0.25)' }}>
          {mode === 'login' ? (
            <span>
              New here?{' '}
              <button
                onClick={() => switchMode('register')}
                style={{ color: isLight ? '#C27B6E' : '#10B981', background: 'none', border: 'none', cursor: 'pointer', minHeight: 0, minWidth: 0, padding: 0 }}
                className="font-medium"
              >
                Create an account
              </button>
            </span>
          ) : (
            <span>
              Already have one?{' '}
              <button
                onClick={() => switchMode('login')}
                style={{ color: isLight ? '#C27B6E' : '#10B981', background: 'none', border: 'none', cursor: 'pointer', minHeight: 0, minWidth: 0, padding: 0 }}
                className="font-medium"
              >
                Sign in
              </button>
            </span>
          )}
        </p>

        <p className="mt-3 text-center text-xs" style={{ color: isLight ? '#C2B0AE' : 'rgba(255,255,255,0.15)' }}>
          By using Notion Tracker, you agree to track your gains responsibly.
        </p>
      </motion.div>
    </div>
  );
}
