import { CircleAlert } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Alert({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900",
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

