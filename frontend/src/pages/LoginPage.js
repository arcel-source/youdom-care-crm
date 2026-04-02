import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function LoginPage() {
  const { isAuthenticated, isLoading, loginWithGoogle, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('main'); // 'main' | 'email' | 'otp'
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <LoadingSpinner size="lg" />
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
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
      {/* Left hero */}
      <div className="hidden lg:flex flex-col justify-center items-center flex-1 bg-gradient-to-br from-indigo-700 to-indigo-900 text-white p-12">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-3xl">YC</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Youdom Care</h1>
          <p className="text-indigo-200 text-lg leading-relaxed mb-8">
            La plateforme CRM dédiée aux services d'aide à domicile. Gérez vos bénéficiaires, intervenants et planning en toute simplicité.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { label: 'Bénéficiaires', value: '500+' },
              { label: 'Intervenants', value: '120+' },
              { label: 'Heures/mois', value: '8 000+' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-indigo-300 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex flex-col justify-center items-center w-full lg:w-[460px] xl:w-[520px] p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-2xl">YC</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Youdom Care</h1>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Connexion</h2>
            <p className="text-gray-500 text-sm">Accédez à votre espace de gestion</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {mode === 'main' && (
            <div className="space-y-4">
              {/* Google login */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                  </g>
                </svg>
                Se connecter avec Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs text-gray-400 bg-white px-4">
                  ou par email
                </div>
              </div>

              <button
                onClick={() => setMode('email')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-indigo-200 text-indigo-600 rounded-xl font-medium hover:bg-indigo-50 transition-colors"
              >
                Connexion par email + code OTP
              </button>
            </div>
          )}

          {mode === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input
                label="Adresse email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@youdomcare.fr"
                required
                autoFocus
              />
              <Button type="submit" fullWidth loading={sending} size="lg">
                Recevoir mon code
              </Button>
              <button
                type="button"
                onClick={() => setMode('main')}
                className="w-full text-sm text-gray-500 hover:text-gray-700 mt-2"
              >
                ← Retour
              </button>
            </form>
          )}

          {mode === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                Code envoyé à <strong>{email}</strong>. Vérifiez votre boîte mail.
              </div>
              <Input
                label="Code de vérification"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
                autoFocus
              />
              <Button type="submit" fullWidth loading={verifying} size="lg">
                Vérifier et se connecter
              </Button>
              <div className="flex justify-between text-sm">
                <button type="button" onClick={() => { setMode('email'); setOtpCode(''); }} className="text-gray-500 hover:text-gray-700">
                  ← Changer d'email
                </button>
                <button type="button" onClick={handleSendOtp} className="text-indigo-600 hover:text-indigo-700">
                  Renvoyer le code
                </button>
              </div>
            </form>
          )}

          <p className="text-xs text-center text-gray-400 mt-8">
            En vous connectant, vous acceptez nos{' '}
            <a href="#cgu" className="text-indigo-500 hover:underline">CGU</a>
            {' '}et notre{' '}
            <a href="#privacy" className="text-indigo-500 hover:underline">politique de confidentialité</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
