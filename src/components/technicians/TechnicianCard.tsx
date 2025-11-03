import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import Icon from "@/components/ui/icon";
import { Technician } from "@/types";

interface TechnicianCardProps {
  technician: Technician;
  onEdit?: (technician: Technician) => void;
  onView?: (technician: Technician) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
}

const statusConfig = {
  available: { label: 'Свободен', color: 'bg-green-100 text-green-700 border-green-300', icon: 'CheckCircle' },
  busy: { label: 'Занят', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: 'Clock' },
  offline: { label: 'Не на смене', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: 'XCircle' }
};

export const TechnicianCard = ({ technician, onEdit, onView, onDelete, onStatusChange }: TechnicianCardProps) => {
  const status = statusConfig[technician.status as keyof typeof statusConfig] || statusConfig.offline;
  const initials = technician.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const workload = technician.currentWorkload || 0;
  const capacity = technician.maxWorkload || 5;
  const workloadPercent = (workload / capacity) * 100;

  return (
    <Card className="hover:shadow-lg transition-all group">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-14 w-14 border-2 border-primary/20">
            <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-600 font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{technician.name}</h3>
              <Badge className={`${status.color} border flex-shrink-0 flex items-center gap-1`}>
                <Icon name={status.icon} size={12} />
                {status.label}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-1 mt-2">
              {technician.specialization.slice(0, 3).map((spec, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {spec}
                </Badge>
              ))}
              {technician.specialization.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{technician.specialization.length - 3}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-blue-50">
            <div className="text-xl font-bold text-blue-600">{technician.completedRepairs}</div>
            <div className="text-xs text-muted-foreground">Заявок</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-yellow-50">
            <div className="text-xl font-bold text-yellow-600 flex items-center justify-center gap-1">
              <Icon name="Star" size={16} className="fill-yellow-500 text-yellow-500" />
              {technician.rating.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Рейтинг</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-purple-50">
            <div className="text-xl font-bold text-purple-600">{workload}/{capacity}</div>
            <div className="text-xs text-muted-foreground">Нагрузка</div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Загруженность</span>
            <span className="font-medium">{Math.round(workloadPercent)}%</span>
          </div>
          <Progress value={workloadPercent} className="h-2" />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon name="Phone" size={14} />
          <span>{technician.phone}</span>
        </div>

        <div className="flex gap-2 pt-2 border-t">
          {onStatusChange && technician.status !== 'available' && (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => onStatusChange(technician.id, 'available')}
            >
              <Icon name="CheckCircle" size={14} className="mr-1" />
              Свободен
            </Button>
          )}
          {onStatusChange && technician.status !== 'busy' && (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => onStatusChange(technician.id, 'busy')}
            >
              <Icon name="Clock" size={14} className="mr-1" />
              Занят
            </Button>
          )}
          {onView && (
            <Button size="sm" variant="outline" onClick={() => onView(technician)}>
              <Icon name="Eye" size={14} />
            </Button>
          )}
          {onEdit && (
            <Button size="sm" variant="outline" onClick={() => onEdit(technician)}>
              <Icon name="Edit" size={14} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
