import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Welcome to Focal
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Sign in to manage your tasks and boost productivity
          </p>
        </div>
        <SignIn
          forceRedirectUrl="/dashboard"
          signUpUrl="/sign-up"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg",
            },
          }}
        />
      </div>
    </div>
  );
}
