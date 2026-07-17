import * as React from "react";

import { cn } from "@/lib/utils";

function Container({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-screen-sm px-4 sm:max-w-screen-md md:max-w-screen-lg lg:max-w-screen-xl",
        className,
      )}
      {...props}
    />
  );
}

export { Container };
