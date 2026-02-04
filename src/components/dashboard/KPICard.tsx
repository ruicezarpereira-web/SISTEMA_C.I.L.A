import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'warning' | 'danger' | 'success' | 'info';
  onClick?: () => void;
}

const variantStyles = {
  default: {
    icon: "bg-primary/10 text-primary",
    card: "hover:border-primary/30",
  },
  warning: {
    icon: "bg-warning/10 text-warning",
    card: "hover:border-warning/30",
  },
  danger: {
    icon: "bg-destructive/10 text-destructive",
    card: "hover:border-destructive/30",
  },
  success: {
    icon: "bg-success/10 text-success",
    card: "hover:border-success/30",
  },
  info: {
    icon: "bg-info/10 text-info",
    card: "hover:border-info/30",
  },
};

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  onClick,
}: KPICardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "kpi-card cursor-pointer border-2 border-transparent",
        styles.card,
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className={cn("rounded-xl p-3", styles.icon)}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}
          >
            <span>{trend.isPositive ? "+" : ""}{trend.value}%</span>
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <div className="text-3xl font-bold text-foreground">{value}</div>
        <div className="text-sm font-medium text-muted-foreground mt-1">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-muted-foreground/70 mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
