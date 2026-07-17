/**
 * (auth) route group — minimal chrome for login/register screens.
 * No header/footer chrome to keep focus on the auth form.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 pb-10">
      {children}
    </div>
  );
}
