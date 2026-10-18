import { useState } from 'react';
import { Link } from 'react-router';
import AuthLayout, { PasswordVisibilityIcon } from './AuthLayout.jsx';

const inputClassName =
  'h-12 w-full rounded-lg border border-[#3A3348] bg-[#14141B] px-4 text-sm text-white outline-none transition-colors duration-200 placeholder:text-[#71717A] hover:border-[#5A4D70] focus-visible:border-[#8B5CF6] focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/30 aria-invalid:border-[#F87171] aria-invalid:focus-visible:border-[#F87171] aria-invalid:focus-visible:ring-[#F87171]/20';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      nextErrors.email = 'Enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Enter your password.';
    }

    setErrors(nextErrors);
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);
    setErrors((currentErrors) => ({ ...currentErrors, email: undefined }));
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);
    setErrors((currentErrors) => ({ ...currentErrors, password: undefined }));
  }

  return (
    <AuthLayout
      footer={
        <>
          Don&apos;t Have An Account?{' '}
          <Link
            className="font-semibold text-[#A78BFA] underline-offset-4 hover:text-white hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A78BFA]"
            to="/signup"
          >
            Register Now.
          </Link>
        </>
      }
      subtitle="Enter your email and password to access your account."
      title="Welcome Back"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            className="block text-sm font-medium text-[#E4E4E7]"
            htmlFor="login-email"
          >
            Email
          </label>
          <input
            autoComplete="email"
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            aria-invalid={Boolean(errors.email)}
            className={inputClassName}
            id="login-email"
            name="email"
            onChange={handleEmailChange}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
          {errors.email && (
            <p className="text-xs text-[#F87171]" id="login-email-error">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            className="block text-sm font-medium text-[#E4E4E7]"
            htmlFor="login-password"
          >
            Password
          </label>
          <div className="relative">
            <input
              autoComplete="current-password"
              aria-describedby={
                errors.password ? 'login-password-error' : undefined
              }
              aria-invalid={Boolean(errors.password)}
              className={`${inputClassName} pr-12`}
              id="login-password"
              name="password"
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              type={showPassword ? 'text' : 'password'}
              value={password}
            />
            <button
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 grid w-12 place-items-center text-[#A1A1AA] transition-colors hover:text-[#A78BFA] focus-visible:rounded-r-lg focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#A78BFA]"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              <PasswordVisibilityIcon visible={showPassword} />
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-[#F87171]" id="login-password-error">
              {errors.password}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 pt-0.5">
          <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-[#A1A1AA]">
            <input
              checked={rememberMe}
              className="size-4 cursor-pointer rounded border-[#2A2635] accent-[#8B5CF6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A78BFA]"
              onChange={(event) => setRememberMe(event.target.checked)}
              type="checkbox"
            />
            <span>Remember Me</span>
          </label>
          <a
            className="text-sm font-medium text-[#A78BFA] underline-offset-4 hover:text-white hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A78BFA]"
            href="#forgot-password"
          >
            Forgot Your Password?
          </a>
        </div>

        <button
          className="flex h-12 w-full items-center justify-center rounded-lg border border-[#A78BFA]/30 bg-[#8B5CF6] text-sm font-semibold text-white shadow-[0_6px_22px_rgba(139,92,246,0.18)] transition-all duration-200 hover:border-[#C4B5FD]/60 hover:bg-[#7C3AED] hover:shadow-[0_8px_24px_rgba(139,92,246,0.28)] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#A78BFA] motion-reduce:transition-none"
          type="submit"
        >
          Log In
        </button>
      </form>
    </AuthLayout>
  );
}

export default Login;
