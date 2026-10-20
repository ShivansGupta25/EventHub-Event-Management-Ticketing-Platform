import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import AuthLayout, { PasswordVisibilityIcon } from './AuthLayout.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../auth/useAuth.js';

const inputClassName =
  'h-10 w-full rounded-lg border border-[#3A3348] bg-[#14141B] px-4 text-sm text-white outline-none transition-colors duration-200 placeholder:text-[#71717A] hover:border-[#5A4D70] focus-visible:border-[#8B5CF6] focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/30 aria-invalid:border-[#F87171] aria-invalid:focus-visible:border-[#F87171] aria-invalid:focus-visible:ring-[#F87171]/20';

function validateForm(values) {
  const nextErrors = {};
  const trimmedName = values.fullName.trim();
  const trimmedEmail = values.email.trim();

  if (!trimmedName) {
    nextErrors.fullName = 'Enter your full name.';
  } else if (trimmedName.length > 100) {
    nextErrors.fullName = 'Name must be 100 characters or fewer.';
  }

  if (!trimmedEmail) {
    nextErrors.email = 'Enter your email address.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    nextErrors.email = 'Enter a valid email address.';
  }

  if (!values.password) {
    nextErrors.password = 'Create a password.';
  } else if (values.password.length < 8) {
    nextErrors.password = 'Use at least 8 characters.';
  } else if (values.password.length > 72) {
    nextErrors.password = 'Password must be 72 characters or fewer.';
  }

  if (!values.confirmPassword) {
    nextErrors.confirmPassword = 'Confirm your password.';
  } else if (values.confirmPassword !== values.password) {
    nextErrors.confirmPassword = 'Passwords do not match.';
  }

  if (!values.acceptTerms) {
    nextErrors.acceptTerms = 'You must agree before creating an account.';
  }

  return nextErrors;
}

function Signup() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [formValues, setFormValues] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  function handleChange(event) {
    const { checked, name, type, value } = event.target;

    const nextValues = {
      ...formValues,
      [name]: type === 'checkbox' ? checked : value,
    };

    setFormValues(nextValues);
    setStatusMessage('');

    if (hasSubmitted) {
      setErrors(validateForm(nextValues));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setHasSubmitted(true);
    setStatusMessage('');

    const nextErrors = validateForm(formValues);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await api('/auth/register', {
        method: 'POST',
        body: {
          name: formValues.fullName.trim(),
          email: formValues.email.trim(),
          password: formValues.password,
        },
      });

      // Support either { data: user } or a directly returned user object.
      const user = result?.data ?? result;

      setUser(user);
      navigate('/');
    } catch (error) {
      const fieldErrors = error?.fields ?? {};
      const mappedErrors = {};

      if (fieldErrors.name) {
        mappedErrors.fullName = fieldErrors.name;
      }

      if (fieldErrors.email) {
        mappedErrors.email = fieldErrors.email;
      }

      if (fieldErrors.password) {
        mappedErrors.password = fieldErrors.password;
      }

      setErrors((currentErrors) => ({
        ...currentErrors,
        ...mappedErrors,
      }));

      setStatusMessage(
        Object.keys(mappedErrors).length > 0
          ? ''
          : error?.message || 'Account creation failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      footer={
        <>
          Already Have An Account?{' '}
          <Link
            className="font-semibold text-[#A78BFA] underline-offset-4 hover:text-white hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A78BFA]"
            to="/login"
          >
            Log In.
          </Link>
        </>
      }
      subtitle="Enter your details to create your EventHub account."
      title="Create Account"
    >
      <form className="space-y-2.5" noValidate onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label
            className="block text-sm font-medium text-[#E4E4E7]"
            htmlFor="signup-name"
          >
            Full Name
          </label>

          <input
            autoComplete="name"
            aria-describedby={errors.fullName ? 'signup-name-error' : undefined}
            aria-invalid={Boolean(errors.fullName)}
            className={inputClassName}
            id="signup-name"
            name="fullName"
            onChange={handleChange}
            placeholder="Enter your full name"
            type="text"
            value={formValues.fullName}
          />

          {errors.fullName && (
            <p className="text-xs text-[#F87171]" id="signup-name-error">
              {errors.fullName}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label
            className="block text-sm font-medium text-[#E4E4E7]"
            htmlFor="signup-email"
          >
            Email
          </label>

          <input
            autoComplete="email"
            aria-describedby={errors.email ? 'signup-email-error' : undefined}
            aria-invalid={Boolean(errors.email)}
            className={inputClassName}
            id="signup-email"
            name="email"
            onChange={handleChange}
            placeholder="you@example.com"
            type="email"
            value={formValues.email}
          />

          {errors.email && (
            <p className="text-xs text-[#F87171]" id="signup-email-error">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label
            className="block text-sm font-medium text-[#E4E4E7]"
            htmlFor="signup-password"
          >
            Password
          </label>

          <div className="relative">
            <input
              autoComplete="new-password"
              aria-describedby={
                errors.password ? 'signup-password-error' : undefined
              }
              aria-invalid={Boolean(errors.password)}
              className={`${inputClassName} pr-12`}
              id="signup-password"
              name="password"
              onChange={handleChange}
              placeholder="Create a password"
              type={showPassword ? 'text' : 'password'}
              value={formValues.password}
            />

            <button
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center text-[#A1A1AA] transition-colors hover:text-[#A78BFA] focus-visible:rounded-r-lg focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#A78BFA]"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              <PasswordVisibilityIcon visible={showPassword} />
            </button>
          </div>

          {errors.password && (
            <p className="text-xs text-[#F87171]" id="signup-password-error">
              {errors.password}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label
            className="block text-sm font-medium text-[#E4E4E7]"
            htmlFor="signup-confirm-password"
          >
            Confirm Password
          </label>

          <div className="relative">
            <input
              autoComplete="new-password"
              aria-describedby={
                errors.confirmPassword
                  ? 'signup-confirm-password-error'
                  : undefined
              }
              aria-invalid={Boolean(errors.confirmPassword)}
              className={`${inputClassName} pr-12`}
              id="signup-confirm-password"
              name="confirmPassword"
              onChange={handleChange}
              placeholder="Confirm your password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formValues.confirmPassword}
            />

            <button
              aria-label={
                showConfirmPassword ? 'Hide password' : 'Show password'
              }
              aria-pressed={showConfirmPassword}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center text-[#A1A1AA] transition-colors hover:text-[#A78BFA] focus-visible:rounded-r-lg focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#A78BFA]"
              onClick={() => setShowConfirmPassword((visible) => !visible)}
              type="button"
            >
              <PasswordVisibilityIcon visible={showConfirmPassword} />
            </button>
          </div>

          {errors.confirmPassword && (
            <p
              className="text-xs text-[#F87171]"
              id="signup-confirm-password-error"
            >
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <div className="space-y-1 pt-0.5">
          <label
            className="flex cursor-pointer items-start gap-2.5 text-xs leading-5 text-[#A1A1AA]"
            htmlFor="signup-terms"
          >
            <input
              aria-describedby={
                errors.acceptTerms ? 'signup-terms-error' : undefined
              }
              aria-invalid={Boolean(errors.acceptTerms)}
              checked={formValues.acceptTerms}
              className="mt-1 size-4 shrink-0 cursor-pointer accent-[#8B5CF6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A78BFA]"
              id="signup-terms"
              name="acceptTerms"
              onChange={handleChange}
              type="checkbox"
            />

            <span>
              I agree to the{' '}
              <a
                className="font-medium text-[#A78BFA] underline-offset-2 hover:text-white hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A78BFA]"
                href="#terms-of-service"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                className="font-medium text-[#A78BFA] underline-offset-2 hover:text-white hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A78BFA]"
                href="#privacy-policy"
              >
                Privacy Policy
              </a>
              .
            </span>
          </label>

          {errors.acceptTerms && (
            <p
              className="pl-[26px] text-xs text-[#F87171]"
              id="signup-terms-error"
            >
              {errors.acceptTerms}
            </p>
          )}
        </div>

        <button
          className="flex h-11 w-full items-center justify-center rounded-lg border border-[#A78BFA]/30 bg-[#8B5CF6] text-sm font-semibold text-white shadow-[0_6px_22px_rgba(139,92,246,0.18)] transition-all duration-200 hover:border-[#C4B5FD]/60 hover:bg-[#7C3AED] hover:shadow-[0_8px_24px_rgba(139,92,246,0.28)] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#A78BFA] motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </button>

        {statusMessage && (
          <p
            aria-live="polite"
            className="text-center text-xs leading-5 text-[#F87171]"
            role="alert"
          >
            {statusMessage}
          </p>
        )}
      </form>
    </AuthLayout>
  );
}

export default Signup;
