import Link from "next/link";

import { APP_NAME } from "@/constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Login page — foundation only. Auth form wiring lands with the auth feature.
 */
export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm shadow-neon">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-black">
          {APP_NAME}
        </CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" variant="neon" disabled>
          Sign in
        </Button>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="ml-1 text-primary hover:underline">
          Register
        </Link>
      </CardFooter>
    </Card>
  );
}
