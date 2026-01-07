"use client";

import { signIn } from "next-auth/react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 10.2c3.6 0 6.2 1.6 7.6 2.9l5.2-5.2C33.6 5 29.2 3 24 3 14.8 3 6.9 8.3 3.3 16.1l6.7 5.2C12 14.9 17.5 10.2 24 10.2z"/>
      <path fill="#4285F4" d="M45 24.5c0-1.6-.1-2.8-.4-4H24v7.7h12c-.2 2-1.4 5-4 7l6.2 4.8C42.5 36 45 30.8 45 24.5z"/>
      <path fill="#FBBC05" d="M10 28.7c-.5-1.4-.9-2.9-.9-4.7s.3-3.3.9-4.7l-6.7-5.2C1.8 17.1 1 20.5 1 24s.8 6.9 2.3 9.9l6.7-5.2z"/>
      <path fill="#34A853" d="M24 45c5.2 0 9.6-1.7 12.8-4.7l-6.2-4.8c-1.7 1.2-4 2-6.6 2-6.5 0-12-4.7-14-11.1l-6.7 5.2C6.9 39.7 14.8 45 24 45z"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .5C5.73.5.75 5.64.75 12c0 5.1 3.19 9.41 7.62 10.94.56.11.77-.25.77-.55v-2.1c-3.1.69-3.75-1.34-3.75-1.34-.5-1.3-1.23-1.64-1.23-1.64-1-.7.08-.69.08-.69 1.1.08 1.68 1.15 1.68 1.15.99 1.72 2.6 1.22 3.23.93.1-.73.39-1.22.71-1.5-2.48-.29-5.09-1.27-5.09-5.64 0-1.25.44-2.27 1.16-3.07-.12-.29-.5-1.45.11-3.02 0 0 .95-.31 3.11 1.17.9-.26 1.87-.39 2.84-.4.97.01 1.94.14 2.84.4 2.16-1.48 3.11-1.17 3.11-1.17.61 1.57.23 2.73.11 3.02.72.8 1.16 1.82 1.16 3.07 0 4.38-2.61 5.35-5.1 5.64.4.36.75 1.06.75 2.13v3.15c0 .3.21.66.78.55 4.43-1.53 7.61-5.84 7.61-10.94C23.25 5.64 18.27.5 12 .5z"
      />
    </svg>
  );
}

export default function SignInButtons({ callbackUrl }: { callbackUrl: string }) {
  return (
    <div className="space-y-3">
      <button
        onClick={() => signIn("google", { callbackUrl })}
        className="w-full rounded-xl border border-white/10 bg-white text-black hover:brightness-[0.98] transition px-4 py-3 flex items-center justify-center gap-3"
      >
        <GoogleIcon />
        <span className="text-sm font-medium">Continue with Google</span>
      </button>

      <button
        onClick={() => signIn("github", { callbackUrl })}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition px-4 py-3 flex items-center justify-center gap-3"
      >
        <GitHubIcon />
        <span className="text-sm font-medium">Continue with GitHub</span>
      </button>
    </div>
  );
}
