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
 * Register page — foundation only. Auth form wiring lands with the auth feature.
 */
export default function RegisterPage() {
  return (
    <Card className="w-full max-w-sm shadow-neon">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-black">{APP_NAME}</CardTitle>
        <CardDescription>Create your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" variant="neon" disabled>
          Create account
        </Button>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="ml-1 text-primary hover:underline">
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
