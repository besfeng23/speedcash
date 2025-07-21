
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string | number | ReactNode;
  icon: LucideIcon;
  details?: string | ReactNode;
}

export default function KpiCard({ title, value, icon: Icon, details }: KpiCardProps) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-body text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="font-headline text-3xl font-bold text-foreground">{value}</div>
        {details && <div className="font-body text-xs text-muted-foreground pt-1">{details}</div>}
      </CardContent>
    </Card>
  );
}
