import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Heart, Shield, Clock, Users, Star, ArrowRight } from 'lucide-react';

// Animated health particles background
function HealthIllustration() {
  const icons = [Heart, Shield, Clock, Users, Star];
  const positions = [
    { top: '10%', left: '15%', delay: '0s', size: 20 },
    { top: '25%', left: '75%', delay: '0.5s', size: 16 },
    { top: '50%', left: '10%', delay: '1s', size: 18 },
    { top: '70%', left: '80%', delay: '1.5s', size: 14 },
    { top: '85%', left: '25%', delay: '2s', size: 16 },
    { top: '40%', left: '55%', delay: '0.8s', size: 12 },
    { top: '60%', left: '40%', delay: '1.2s', size: 18 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {positions.map((pos, i) => {
        const Icon = icons[i % icons.length];
        return (
          <div
            key={i}
            className="absolute opacity-20 animate-float"
            style={{
              top: pos.top,
              left: pos.left,
              animationDelay: pos.delay,
              animationDuration: `${3 + (i * 0.5)}s`,
            }}
          >
            <Icon size={pos.size} className="text-white" />
          </div>
        );
      })}
    </div>
  );
}

const STATS = [
  { label: 'Bénéficiaires suivis', value: '500+' },
  { label: 'Intervenants actifs', value: '120+' },
  { label: 'Heures/mois gérées', value: '8 000+' },
];

export default function LoginPage() {
  const { isAuthenticated, isLoading, loginWithGoogle, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('main');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 100%)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-3 border-teal-400 border-t-transparent rounded-full animate-spin" style={{ borderWidth: '3px' }} />
          <p className="text-teal-300 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  const handleGoogleLogin = () => {
    setError('');
    loginWithGoogle();
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) { setError('Veuillez saisir votre adresse email.'); return; }
    setSending(true);
    setError('');
    const result = await sendOtp(email);
    setSending(false);
    if (result.success) {
      setMode('otp');
    } else {
      setError(result.error);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) { setError('Veuillez saisir le code reçu.'); return; }
    setVerifying(true);
    setError('');
    const result = await verifyOtp(email, otpCode);
    setVerifying(false);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Hero panel */}
      <div
        className="hidden lg:flex flex-col justify-between flex-1 p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 50%, #0f172a 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 8s ease infinite',
        }}
      >
        <HealthIllustration />

        {/* Top: logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
            <Heart size={20} className="text-teal-400 fill-teal-400/30" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">Youdom Care</span>
            <p className="text-teal-400 text-xs">CRM Pro</p>
          </div>
        </div>

        {/* Center: headline */}
        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 mb-6">
            <Star size={12} className="text-teal-400 fill-teal-400" />
            <span className="text-teal-300 text-xs font-medium">Plateforme #1 aide à domicile</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            Gérez votre
            <span className="block text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(90deg, #2dd4bf, #34d399)' }}>
              activité de soin
            </span>
            avec précision.
          </h1>

          <p className="text-slate-400 text-lg leading-relaxed">
            Du suivi des bénéficiaires à la facturation, en passant par la planification des interventions — tout est centralisé.
          </p>

          {/* Feature bullets */}
          <div className="mt-8 space-y-3">
            {[
              { icon: Users, text: 'Suivi complet des bénéficiaires et familles' },
              { icon: Clock, text: 'Planning et interventions en temps réel' },
              { icon: Shield, text: 'Conformité APA, PCH et facturation automatique' },
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.text} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon size={12} className="text-teal-400" />
                  </div>
                  <span className="text-slate-300 text-sm">{feat.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom: stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-2xl border"
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Login panel */}
      <div className="flex flex-col justify-center items-center w-full lg:w-[480px] xl:w-[520px] bg-white p-8 relative">
        {/* Subtle pattern */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #e2e8f0 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
              <Heart size={24} className="text-white fill-white/30" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Youdom Care</h1>
            <p className="text-slate-400 text-sm">CRM Aide à Domicile</p>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {mode === 'otp' ? 'Vérification' : 'Connexion'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {mode === 'main' && 'Accédez à votre espace de gestion'}
              {mode === 'email' && 'Entrez votre adresse email professionnelle'}
              {mode === 'otp' && `Code envoyé à ${email}`}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              {error}
            </div>
          )}

          {/* Mode: main */}
          {mode === 'main' && (
            <div className="space-y-3 animate-fadeIn">
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl text-slate-700 font-medium hover:border-teal-300 hover:bg-teal-50/50 transition-all shadow-sm"
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                  </g>
                </svg>
                Se connecter avec Google
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-xs text-slate-400 font-medium">ou par email</span>
                </div>
              </div>

              <button
                onClick={() => setMode('email')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 border-2 border-teal-200 text-teal-700 bg-teal-50/50 rounded-xl font-medium hover:bg-teal-50 hover:border-teal-300 transition-all"
              >
                Connexion par email + code OTP
                <ArrowRight size={15} />
              </button>
            </div>
          )}

          {/* Mode: email */}
          {mode === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4 animate-fadeIn">
              <Input
                label="Adresse email professionnelle"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@youdomcare.fr"
                required
                autoFocus
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>Recevoir mon code <ArrowRight size={15} /></>
                )}
              </button>
              <button type="button" onClick={() => setMode('main')} className="w-full text-sm text-slate-400 hover:text-slate-600 text-center transition-colors">
                ← Retour
              </button>
            </form>
          )}

          {/* Mode: OTP */}
          {mode === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-sm text-teal-800 flex items-start gap-2">
                <span className="text-lg leading-none">📬</span>
                <span>Code envoyé à <strong>{email}</strong>. Vérifiez votre boîte mail.</span>
              </div>
              <Input
                label="Code de vérification (6 chiffres)"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                required
                autoFocus
              />
              <button
                type="submit"
                disabled={verifying}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
              >
                {verifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>Vérifier et se connecter <ArrowRight size={15} /></>
                )}
              </button>
              <div className="flex justify-between text-sm">
                <button type="button" onClick={() => { setMode('email'); setOtpCode(''); }}
                  className="text-slate-400 hover:text-slate-600 transition-colors">
                  ← Changer d'email
                </button>
                <button type="button" onClick={handleSendOtp}
                  className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
                  Renvoyer le code
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <p className="text-xs text-center text-slate-400 mt-10 leading-relaxed">
            En vous connectant, vous acceptez nos{' '}
            <a href="#cgu" className="text-teal-600 hover:underline">CGU</a>
            {' '}et notre{' '}
            <a href="#privacy" className="text-teal-600 hover:underline">politique de confidentialité</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
