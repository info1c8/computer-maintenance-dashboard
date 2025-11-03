import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { ru } from "date-fns/locale";

interface ScheduleEvent {
  id: string;
  title: string;
  date: Date;
  type: 'shift' | 'meeting' | 'task';
}

interface ScheduleCalendarProps {
  events: ScheduleEvent[];
  onDateClick?: (date: Date) => void;
}

export const ScheduleCalendar = ({ events, onDateClick }: ScheduleCalendarProps) => {
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Calendar" size={20} />
          {format(currentMonth, "LLLL yyyy", { locale: ru })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
          
          {daysInMonth.map(day => {
            const dayEvents = getEventsForDay(day);
            const today = isToday(day);
            
            return (
              <div
                key={day.toString()}
                onClick={() => onDateClick?.(day)}
                className={`min-h-[80px] p-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                  today ? 'bg-primary/5 border-primary' : ''
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${today ? 'text-primary' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div key={event.id} className="text-xs truncate">
                      <Badge variant="outline" className="w-full justify-start text-xs">
                        {event.title}
                      </Badge>
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayEvents.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
