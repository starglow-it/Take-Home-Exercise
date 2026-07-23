import type { ExpenseCategory } from "@/graphql/budget";
import { categoryConfig } from "@/lib/categories";
import { cn } from "@/lib/cn";

export function CategoryBadge({
  category,
}: {
  category: ExpenseCategory;
}) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.iconBackground,
        config.iconClass,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {config.label}
    </span>
  );
}

