import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

interface ScheduleStatsCardsProps {
  totalSchedules: number;
  stats: {
    totalHours: number;
    avgHoursPerDay: number;
    mostBusyTechnician: string;
  };
}

export const ScheduleStatsCards = ({ totalSchedules, stats }: ScheduleStatsCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Всего смен</CardTitle>
          <Icon name="Calendar" className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalSchedules}</div>
          <p className="text-xs text-muted-foreground mt-1">Запланировано</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Часов работы</CardTitle>
          <Icon name="Clock" className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalHours}ч</div>
          <p className="text-xs text-muted-foreground mt-1">Всего часов</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Средняя смена</CardTitle>
          <Icon name="TrendingUp" className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.avgHoursPerDay}ч</div>
          <p className="text-xs text-muted-foreground mt-1">В день</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Самый занятый</CardTitle>
          <Icon name="Users" className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold truncate">{stats.mostBusyTechnician}</div>
          <p className="text-xs text-muted-foreground mt-1">Техник</p>
        </CardContent>
      </Card>
    </div>
  );
};
