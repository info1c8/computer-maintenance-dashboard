import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { Schedule, Repair } from "@/types";

interface ListViewProps {
  groupedSchedules: { [key: string]: Schedule[] };
  getTechnicianRepairsForDate: (techId: string, date: Date) => Repair[];
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
  onDuplicate: (schedule: Schedule) => void;
}

export const ListView = ({
  groupedSchedules,
  getTechnicianRepairsForDate,
  onEdit,
  onDelete,
  onDuplicate
}: ListViewProps) => {
  const sortedDates = Object.keys(groupedSchedules).sort((a, b) => {
    const dateA = groupedSchedules[a][0].date;
    const dateB = groupedSchedules[b][0].date;
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-4">
      {sortedDates.map(dateKey => {
        const daySchedules = groupedSchedules[dateKey];
        const date = daySchedules[0].date;
        const isToday = date.toDateString() === new Date().toDateString();
        
        return (
          <div key={dateKey}>
            <div className={`flex items-center gap-2 mb-2 ${isToday ? 'text-primary' : ''}`}>
              <Icon name="Calendar" className="h-4 w-4" />
              <h3 className="font-semibold">
                {date.toLocaleDateString('ru-RU', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              {isToday && <Badge>Сегодня</Badge>}
            </div>
            
            <div className="space-y-2">
              {daySchedules.map(schedule => {
                const repairs = getTechnicianRepairsForDate(schedule.technicianId, date);
                const workHours = (() => {
                  const [startH, startM] = schedule.startTime.split(':').map(Number);
                  const [endH, endM] = schedule.endTime.split(':').map(Number);
                  let hours = (endH * 60 + endM - startH * 60 - startM) / 60;
                  
                  if (schedule.breakStart && schedule.breakEnd) {
                    const [breakStartH, breakStartM] = schedule.breakStart.split(':').map(Number);
                    const [breakEndH, breakEndM] = schedule.breakEnd.split(':').map(Number);
                    const breakHours = (breakEndH * 60 + breakEndM - breakStartH * 60 - breakStartM) / 60;
                    hours -= breakHours;
                  }
                  return Math.round(hours * 10) / 10;
                })();
                
                return (
                  <Card key={schedule.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{schedule.technicianName}</h4>
                            <Badge variant="outline">{workHours}ч</Badge>
                            {repairs.length > 0 && (
                              <Badge variant="secondary">
                                {repairs.length} {repairs.length === 1 ? 'заявка' : 'заявок'}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Icon name="Clock" className="h-3 w-3" />
                              Смена: {schedule.startTime} - {schedule.endTime}
                            </div>
                            {schedule.breakStart && schedule.breakEnd && (
                              <div className="flex items-center gap-1">
                                <Icon name="Coffee" className="h-3 w-3" />
                                Перерыв: {schedule.breakStart} - {schedule.breakEnd}
                              </div>
                            )}
                          </div>
                          
                          {schedule.notes && (
                            <p className="text-sm mt-2 text-muted-foreground">{schedule.notes}</p>
                          )}
                          
                          {repairs.length > 0 && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <div className="font-medium mb-1">Запланированные заявки:</div>
                              {repairs.map(repair => (
                                <div key={repair.id} className="ml-2">
                                  • {repair.deviceType} {repair.deviceModel} - {repair.clientName}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(schedule)}
                          >
                            <Icon name="Edit" className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDuplicate(schedule)}
                          >
                            <Icon name="Copy" className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(schedule.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Icon name="Trash2" className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
      
      {sortedDates.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Icon name="Calendar" className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Нет запланированных смен</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
