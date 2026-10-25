import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert, ArrowLeft } from 'lucide-react';

interface AdminLoginGateProps {
  onAuthenticated: () => void;
  onCancel: () => void;
  dealer?: {
    name?: string;
    slug?: string;
  };
  title?: string;
  subtitle?: string;
  cancelLabel?: string;
}

const LOCKOUT_KEY_COUNT = 'rxm_admin_fail_count';
const LOCKOUT_KEY_TIMESTAMP = 'rxm_admin_lockout_until';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 de secunde

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({
  onAuthenticated,
  onCancel,
  dealer,
  title,
  subtitle,
  cancelLabel
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verificare persistență lockout în sessionStorage (rezistă la refresh/reîncărcare pagină)
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(() => {
    try {
      const until = Number(sessionStorage.getItem(LOCKOUT_KEY_TIMESTAMP) || '0');
      const now = Date.now();
      if (until > now) {
        return Math.ceil((until - now) / 1000);
      }
    } catch {}
    return 0;
  });

  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      return Number(sessionStorage.getItem(LOCKOUT_KEY_COUNT) || '0');
    } catch {
      return 0;
    }
  });

  // Cronometru activ pentru deblocare progresivă la depășirea tentativelor
  React.useEffect(() => {
    if (lockoutRemaining <= 0) return;

    const timer = setInterval(() => {
      setLockoutRemaining(prev => {
        if (prev <= 1) {
          try {
            sessionStorage.removeItem(LOCKOUT_KEY_TIMESTAMP);
            sessionStorage.removeItem(LOCKOUT_KEY_COUNT);
          } catch {}
          setFailedAttempts(0);
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (lockoutRemaining > 0) {
      setError(`Acces blocat temporar din motive de securitate. Reîncercați în ${lockoutRemaining} secunde.`);
      return;
    }

    if (!password.trim()) {
      setError('Vă rugăm să introduceți parola de administrator.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    (async () => {
      try {
        const trimmed = password.trim();
        const targetTenant = dealer?.slug || (typeof window !== 'undefined' && window.location.hostname.toLowerCase().includes('parcos.ro') ? 'parcos' : 'rxm');
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: trimmed, tenantId: targetTenant }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok && data.success && data.token) {
          try {
            sessionStorage.removeItem(LOCKOUT_KEY_COUNT);
            sessionStorage.removeItem(LOCKOUT_KEY_TIMESTAMP);
            if (data.role === 'superadmin' || targetTenant === 'parcos') {
              sessionStorage.setItem('parcos_superadmin_key', data.token);
              localStorage.setItem('parcos_superadmin_key', data.token);
              sessionStorage.setItem('parcos_admin_authenticated', 'true');
            }
            sessionStorage.setItem('rxm_admin_authenticated', 'true');
            sessionStorage.setItem('rxm_admin_session_token', data.token);
          } catch {}
          onAuthenticated();
        } else {
          const nextCount = failedAttempts + 1;
          setFailedAttempts(nextCount);
          try {
            sessionStorage.setItem(LOCKOUT_KEY_COUNT, nextCount.toString());
          } catch {}

          if (nextCount >= MAX_ATTEMPTS) {
            const until = Date.now() + LOCKOUT_DURATION_MS;
            try {
              sessionStorage.setItem(LOCKOUT_KEY_TIMESTAMP, until.toString());
            } catch {}
            setLockoutRemaining(Math.ceil(LOCKOUT_DURATION_MS / 1000));
            setError('Prea multe încercări eșuate (5/5). Accesul este blocat temporar pentru 30 de secunde.');
          } else {
            setError(data.error || `Parolă incorectă. Încercare ${nextCount}/${MAX_ATTEMPTS}. Accesul este rezervat exclusiv administratorilor autorizați.`);
          }
        }
      } catch (err) {
        console.error('Eroare autentificare admin:', err);
        setError('Eroare de comunicare cu serverul de securitate. Reîncercați.');
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#121215] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl relative overflow-hidden">
        
        {/* Glow de fundal discret amber */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/05 rounded-full blur-3xl pointer-events-none" />

        {/* Antet Modal */}
        <div className="text-center mb-6 relative">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner shadow-amber-500/20">
            <Lock className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider mb-2">
            <span>Zonă Securizată • {dealer?.name || 'ParcOS Platform'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {title || (dealer?.slug && dealer.slug !== 'parcos' ? 'Portal Gestiune Flotă' : 'ParcOS SuperAdmin Hub')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-xs mx-auto">
            {subtitle || 'Accesul este restricționat administratorilor autorizați. Introduceți parola pentru a debloca portalul.'}
          </p>
        </div>

        {/* Formular Parolă */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Parolă Administrator
            </label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                disabled={isSubmitting || lockoutRemaining > 0}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                autoFocus
                placeholder={lockoutRemaining > 0 ? `Blocat temporar (${lockoutRemaining}s)...` : "Introduceți parola..."}
                className="w-full bg-[#18181b] border border-white/15 focus:border-amber-400 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all placeholder:text-zinc-600 font-mono tracking-wider pr-11 shadow-inner shadow-black/40 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled={lockoutRemaining > 0}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label={showPassword ? "Ascunde parola" : "Afișează parola"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mesaj de Eroare sau Avertisment Blocare */}
          {error && (
            <div className={`p-3 rounded-xl ${lockoutRemaining > 0 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-red-500/10 border-red-500/30 text-red-400'} border text-xs flex items-start gap-2 animate-shake`}>
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Buton Submit */}
          <button
            type="submit"
            disabled={isSubmitting || lockoutRemaining > 0}
            className="w-full min-h-[46px] rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 active:scale-[0.98] text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale touch-manipulation cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>
              {lockoutRemaining > 0 
                ? `Blocat din motive de securitate (${lockoutRemaining}s)` 
                : (isSubmitting ? 'Se verifică accesul...' : 'Autentificare în Panou')}
            </span>
          </button>

          {/* Buton Înapoi */}
          <button
            type="button"
            onClick={onCancel}
            className="w-full min-h-[42px] rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] text-zinc-300 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all border border-white/10 touch-manipulation cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{cancelLabel || (dealer?.slug === 'parcos' ? 'Înapoi pe ParcOS.ro' : 'Înapoi la Showroom-ul Public')}</span>
          </button>
        </form>

        {/* Footer info securitate */}
        <div className="mt-6 pt-4 border-t border-white/05 text-center text-[10.5px] text-zinc-400">
          Sesiunea expiră automat la închiderea tab-ului browserului.
        </div>

      </div>
    </div>
  );
};