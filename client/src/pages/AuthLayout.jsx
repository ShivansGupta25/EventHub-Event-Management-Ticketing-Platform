import { useState } from 'react';
import concertImage from '../assets/eventhub-concert.jpg';

function EventHubMark() {
  return (
    <span
      className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#A78BFA]/25 bg-[#8B5CF6]/10 text-[#A78BFA]"
      aria-hidden="true"
    >
      <svg className="size-[22px]" fill="none" viewBox="0 0 24 24">
        <rect
          x="3.75"
          y="5.5"
          width="16.5"
          height="15"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M8 3.75v3.5M16 3.75v3.5M4 10h16"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="m9.4 15 1.7 1.7 3.7-3.8"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function PasswordVisibilityIcon({ visible }) {
  return visible ? (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path
        d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.7 4.6 9.5 6-.3.6-1.2 1.8-2.5 2.9M6.2 6.2C3.9 7.7 2.6 9.8 2.5 11c.8 1.4 4.3 6 9.5 6 1 0 2-.2 2.8-.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function AuthLayout({ children, footer, subtitle, title }) {
  const [failedTitle, setFailedTitle] = useState('');
  const imageFailed = failedTitle === title;

  return (
    <div className="min-h-dvh w-full bg-[#09090B] text-white lg:h-dvh lg:min-h-0">
      <div className="flex min-h-dvh w-full bg-[#0B0B10] lg:h-full lg:min-h-0 lg:overflow-hidden">
        <section className="flex min-h-dvh w-full flex-col bg-[#0B0B10] px-6 py-6 sm:px-10 sm:py-7 lg:h-full lg:min-h-0 lg:w-[49%] lg:px-12 lg:py-4 xl:px-[7.2%]">
          <header className="flex items-center gap-3">
            <EventHubMark />
            <span className="text-[20px] font-bold tracking-[-0.6px] text-white">
              EventHub
            </span>
          </header>

          <div className="flex flex-1 items-center justify-center py-5 lg:min-h-0 lg:py-3">
            <div className="w-full max-w-[470px] rounded-[20px] bg-gradient-to-br from-[#A78BFA]/75 via-[#6D28D9]/55 to-[#8B5CF6]/70 p-[1.5px] shadow-[0_0_0_1px_rgba(139,92,246,0.12),0_12px_36px_rgba(109,40,217,0.18)]">
              <div className="rounded-[18px] bg-[#101016] px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:px-5 lg:py-4">
                <div className="mb-5 lg:mb-4">
                  <h1 className="text-[32px] font-semibold leading-tight tracking-[-1.1px] text-white sm:text-[36px]">
                    {title}
                  </h1>
                  <p className="mt-2 text-[15px] leading-6 text-[#A1A1AA]">
                    {subtitle}
                  </p>
                </div>
                {children}
                <div className="mt-5 text-center text-sm text-[#A1A1AA]">
                  {footer}
                </div>
              </div>
            </div>
          </div>

          <footer className="flex items-center justify-between gap-3 pt-4 text-[11px] text-[#A1A1AA] sm:text-xs">
            <span>
              © {new Date().getFullYear()} EventHub. All rights reserved.
            </span>
            <a
              className="shrink-0 text-[#A78BFA] underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A78BFA]"
              href="#privacy-policy"
            >
              Privacy Policy
            </a>
          </footer>
        </section>

        <aside className="hidden min-h-0 flex-1 bg-[repeating-linear-gradient(135deg,#323238_0px,#323238_1px,#09090B_1px,#09090B_9px)] p-7 lg:block">
          <div className="relative h-full min-h-0 w-full overflow-hidden rounded-none bg-[radial-gradient(ellipse_at_45%_35%,#7C3AED_0%,#18102E_48%,#09090B_100%)] text-white">
            {!imageFailed && (
              <img
                alt="Concert crowd with raised hands watching a purple-lit live stage"
                className="absolute inset-0 size-full object-cover object-center"
                onError={() => setFailedTitle(title)}
                src={concertImage}
              />
            )}
            {imageFailed && (
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(139,92,246,0.65),transparent_34%),radial-gradient(ellipse_at_50%_75%,rgba(124,58,237,0.28),transparent_58%),linear-gradient(145deg,#181020,#09090B_55%,#130d24)]"
              />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#09090B]/85 via-[#09090B]/35 to-[#181020]/20"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-tr from-[#7C3AED]/25 via-transparent to-[#8B5CF6]/20 mix-blend-multiply"
            />
            <div className="absolute inset-x-0 bottom-0 z-10 p-8 pb-10 sm:p-10 sm:pb-12 xl:px-14 xl:pb-16">
              <p className="mb-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/85 sm:text-xs">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-violet-300 shadow-[0_0_14px_rgba(196,181,253,0.9)]"
                />
                Discover your next experience
              </p>
              <h2 className="max-w-[580px] text-3xl font-semibold leading-[1.08] tracking-[-1.2px] text-white sm:text-4xl xl:text-[52px]">
                Every Event. One Destination.
              </h2>
              <p className="mt-4 max-w-[510px] text-sm leading-6 text-white/85 sm:text-base sm:leading-7">
                Discover incredible experiences, book your tickets, and make
                memories that last a lifetime.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default AuthLayout;
