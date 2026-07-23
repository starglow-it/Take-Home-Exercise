import {
  CarFront,
  Clapperboard,
  HeartPulse,
  Home,
  Shapes,
  ShoppingBag,
  Utensils,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ExpenseCategory } from "@/graphql/budget";

interface CategoryConfig {
  label: string;
  icon: LucideIcon;
  iconClass: string;
  iconBackground: string;
  progressClass: string;
}

export const categoryConfig: Record<ExpenseCategory, CategoryConfig> = {
  HOUSING: {
    label: "Housing",
    icon: Home,
    iconClass: "text-violet-700",
    iconBackground: "bg-violet-50",
    progressClass: "bg-violet-500",
  },
  FOOD: {
    label: "Food",
    icon: Utensils,
    iconClass: "text-amber-700",
    iconBackground: "bg-amber-50",
    progressClass: "bg-amber-500",
  },
  TRANSPORTATION: {
    label: "Transportation",
    icon: CarFront,
    iconClass: "text-sky-700",
    iconBackground: "bg-sky-50",
    progressClass: "bg-sky-500",
  },
  UTILITIES: {
    label: "Utilities",
    icon: Zap,
    iconClass: "text-orange-700",
    iconBackground: "bg-orange-50",
    progressClass: "bg-orange-500",
  },
  ENTERTAINMENT: {
    label: "Entertainment",
    icon: Clapperboard,
    iconClass: "text-pink-700",
    iconBackground: "bg-pink-50",
    progressClass: "bg-pink-500",
  },
  HEALTH: {
    label: "Health",
    icon: HeartPulse,
    iconClass: "text-rose-700",
    iconBackground: "bg-rose-50",
    progressClass: "bg-rose-500",
  },
  SHOPPING: {
    label: "Shopping",
    icon: ShoppingBag,
    iconClass: "text-emerald-700",
    iconBackground: "bg-emerald-50",
    progressClass: "bg-emerald-500",
  },
  OTHER: {
    label: "Other",
    icon: Shapes,
    iconClass: "text-slate-700",
    iconBackground: "bg-slate-100",
    progressClass: "bg-slate-500",
  },
};

