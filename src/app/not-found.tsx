import Link from "next/link";

import { PageShell } from "@/components/common/page-shell";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageShell>
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-6xl font-black neon-text">404</p>
        <h1 className="text-xl font-bold">Page not found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Button asChild variant="neon">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </PageShell>
  );
}
