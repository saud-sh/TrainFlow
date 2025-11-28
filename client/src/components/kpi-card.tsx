import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  variant?: "default" | "warning" | "success" | "danger";
}

export function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
}: KPICardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="h-3 w-3" />;
    if (trend.value < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.value > 0) return "text-chart-2";
    if (trend.value < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "warning":
        return "border-l-4 border-l-yellow-500";
      case "success":
        return "border-l-4 border-l-chart-2";
      case "danger":
        return "border-l-4 border-l-destructive";
      default:
        return "";
    }
  };

  return (
    <Card className={`${getVariantStyles()} hover-elevate`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground/50">{icon}</div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight" data-testid={`kpi-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </div>
        <div className="flex items-center justify-between mt-1">
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>
                {trend.value > 0 ? "+" : ""}
                {trend.value}% {trend.label}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
