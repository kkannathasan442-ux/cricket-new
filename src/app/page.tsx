import Link from "next/link";

import { APP_NAME, APP_TAGLINE } from "@/constants";
import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";

const FEATURES = [
  { title: "Live Scoring", desc: "Real-time ball-by-ball scoring." },
  { title: "Tournaments", desc: "Automated fixtures & points." },
  { title: "Player Stats", desc: "Lifetime stats that never reset." },
  { title: "Public View", desc: "Anyone can follow live matches." },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">
        <Container className="py-12">
          <section className="flex flex-col items-center text-center">
            <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Realtime · Mobile-first · Free
            </span>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              {APP_NAME}
            </h1>
            <p className="mt-3 max-w-md text-muted-foreground">{APP_TAGLINE}</p>
            <div className="mt-6 flex gap-3">
              <Button asChild variant="neon">
                <Link href="/matches">Watch Live</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin">Admin</Link>
              </Button>
            </div>
          </section>

          <section className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                  <CardDescription>{f.desc}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            ))}
          </section>
        </Container>
      </main>
      <MobileBottomNav />
    </div>
  );
}
