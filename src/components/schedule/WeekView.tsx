import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { Schedule, Repair } from "@/types";

interface WeekViewProps {
  weekSchedules: { date: Date; schedules: Schedule[] }[];
  getTechnicianRepairsForDate: (techId: string, date: Date) => Repair[];
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
  onDuplicate: (schedule: Schedule) => void;
}

export const WeekView = ({
  weekSchedules,
  getTechnicianRepairsForDate,
  onEdit,
  onDelete,
  onDuplicate
}: WeekViewProps) => {
  return (
    <div className="grid grid-cols-7 gap-2">
      {weekSchedules.map(({ date, schedules }) => {
        const isToday = date.toDateString() === new Date().toDateString();
        const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
        const dayNum = date.getDate();
        
        return (
          <Card key={date.toISOString()} className={isToday ? 'border-primary' : ''}>
            <CardHeader className="p-3">
              <CardTitle className="text-sm">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground uppercase">{dayName}</span>
                  <span className={`text-2xl font-bold ${isToday ? 'text-primary' : ''}`}>{dayNum}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-2">
              {schedules.map(schedule => {
                const repairs = getTechnicianRepairsForDate(schedule.technicianId, date);
                
                return (
                  <div key={schedule.id} className="p-2 bg-muted rounded text-xs space-y-1">
                    <div className="font-medium truncate">{schedule.technicianName}</div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Icon name="Clock" className="h-3 w-3" />
                      {schedule.startTime} - {schedule.endTime}
                    </div>
                    {repairs.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {repairs.length} заявок
                      </Badge>
                    )}
                    <div className="flex gap-1 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(schedule)}
                        className="h-6 w-6 p-0"
                      >
                        <Icon name="Edit" className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDuplicate(schedule)}
                        className="h-6 w-6 p-0"
                      >
                        <Icon name="Copy" className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(schedule.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Icon name="Trash2" className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {schedules.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-xs">
                  Нет смен
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
