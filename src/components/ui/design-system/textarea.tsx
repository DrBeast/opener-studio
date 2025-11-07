import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "flex min-h-[100px] w-full rounded-lg border px-3 py-2 text-sm leading-6 transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 shadow-inner",
  {
    variants: {
      tone: {
        white:
          "bg-background text-foreground border-border focus-visible:border-primary",
        muted:
          "bg-[hsl(var(--secondary))] text-foreground border-border focus-visible:border-primary",
      },
    },
    defaultVariants: {
      tone: "white",
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

export const DsTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, tone, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(textareaVariants({ tone }), className)}
        {...props}
      />
    );
  }
);
DsTextarea.displayName = "DsTextarea";
