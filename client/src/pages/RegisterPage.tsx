import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '../components/common/Input';
import { PasswordInput } from '../components/common/PasswordInput';
import { Button } from '../components/common/Button';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bio, setBio] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    acceptTerms?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      acceptTerms?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Please provide a valid email format (e.g. name@university.edu)';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmation password is required';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptTerms) {
      newErrors.acceptTerms = 'You must acknowledge the Draft Privacy Terms to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        bio: bio.trim() || undefined,
      });

      setSuccessMessage('Account registered successfully! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 600);
    } catch (err: any) {
      setServerError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Centered Plum Rose Card */}
        <div className="bg-white rounded-3xl p-8 md:p-10 border border-plum-200 shadow-plum-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <Logo size="md" asLink={false} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-plum-900 brand-font">Join DropZone</h1>
            <p className="text-xs text-plum-600">
              Create your privacy-conscious identity for local micro-communities
            </p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl border bg-rose-50 border-rose-200 text-rose-900 text-xs leading-relaxed animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">Registration Problem</p>
                <p className="text-rose-700 mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl border bg-emerald-50 border-emerald-200 text-emerald-900 text-xs leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="font-semibold">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Full Name or Handle"
              placeholder="Elena Rostova"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              error={errors.name}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="elena@university.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
              helperText="Used only for account session security. Never displayed publicly."
              required
            />

            <PasswordInput
              label="Password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              required
            />

            <PasswordInput
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword)
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              error={errors.confirmPassword}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-plum-700">
                Short Bio (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. CS student, builder, or commuter"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-white border border-plum-200 text-plum-900 placeholder-plum-400 text-xs rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 shadow-sm"
              />
            </div>

            {/* Accept Terms Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 text-xs text-plum-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    if (errors.acceptTerms)
                      setErrors((prev) => ({ ...prev, acceptTerms: undefined }));
                  }}
                  className="w-4 h-4 rounded border-plum-300 text-rose-500 focus:ring-rose-400 mt-0.5"
                />
                <span className="leading-relaxed">
                  I agree to DropZone's{' '}
                  <Link to="/privacy" className="text-rose-600 underline font-medium hover:text-rose-700">
                    Draft Privacy Policy
                  </Link>{' '}
                  and understand precise GPS coordinates are never stored or broadcast.
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs text-rose-600 mt-1 font-medium">• {errors.acceptTerms}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create DropZone Account
            </Button>
          </form>

          <div className="pt-4 border-t border-plum-100 text-center text-xs text-plum-500">
            <span>Already have an account? </span>
            <Link to="/login" className="font-semibold text-rose-600 hover:text-rose-700 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
