import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { Technician } from "@/types";
import { useMemo } from "react";

interface TechnicianStatsProps {
  technicians: Technician[];
}

export const TechnicianStats = ({ technicians }: TechnicianStatsProps) => {
  const stats = useMemo(() => {
    const total = technicians.length;
    const available = technicians.filter(t => t.status === 'available').length;
    const busy = technicians.filter(t => t.status === 'busy').length;
    const offline = technicians.filter(t => t.status === 'offline').length;
    
    const totalRepairs = technicians.reduce((sum, t) => sum + t.completedRepairs, 0);
    const avgRating = total > 0 
      ? technicians.reduce((sum, t) => sum + t.rating, 0) / total 
      : 0;
    
    const totalWorkload = technicians.reduce((sum, t) => sum + (t.currentWorkload || 0), 0);
    const totalCapacity = technicians.reduce((sum, t) => sum + (t.maxWorkload || 5), 0);
    const capacityPercent = totalCapacity > 0 ? (totalWorkload / totalCapacity) * 100 : 0;

    return { total, available, busy, offline, totalRepairs, avgRating, capacityPercent };
  }, [technicians]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="Users" size={16} />
            Всего мастеров
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground mt-1">
            На смене: {stats.available + stats.busy}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="CheckCircle" size={16} />
            Свободны
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.available}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Заняты: {stats.busy}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="Wrench" size={16} />
            Выполнено
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.totalRepairs}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Всего заявок
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="Star" size={16} />
            Средний рейтинг
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.avgRating.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Загрузка: {Math.round(stats.capacityPercent)}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
