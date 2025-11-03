import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Icon from "@/components/ui/icon";
import { Client } from "@/types";

interface ClientCardProps {
  client: Client;
  onEdit?: (client: Client) => void;
  onView?: (client: Client) => void;
  onDelete?: (id: string) => void;
  repairCount?: number;
}

const getSegment = (client: Client) => {
  if (client.totalSpent > 50000 || client.totalOrders > 10) return { label: 'VIP', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' };
  if (client.totalOrders > 3) return { label: 'Постоянный', color: 'bg-blue-100 text-blue-700 border-blue-300' };
  return { label: 'Новый', color: 'bg-gray-100 text-gray-700 border-gray-300' };
};

export const ClientCard = ({ client, onEdit, onView, onDelete, repairCount = 0 }: ClientCardProps) => {
  const segment = getSegment(client);
  const initials = client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Card className="hover:shadow-lg transition-all group">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-14 w-14 border-2 border-primary/20">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{client.name}</h3>
              <Badge className={`${segment.color} border flex-shrink-0`}>
                {segment.label}
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Icon name="Phone" size={14} />
                <span>{client.phone}</span>
              </div>
              {client.email && (
                <div className="flex items-center gap-1.5 truncate">
                  <Icon name="Mail" size={14} />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 pt-3 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{client.totalOrders}</div>
            <div className="text-xs text-muted-foreground">Заказов</div>
          </div>
          <div className="text-center border-x">
            <div className="text-2xl font-bold text-green-600">{client.totalSpent.toLocaleString()} ₽</div>
            <div className="text-xs text-muted-foreground">Потрачено</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{repairCount}</div>
            <div className="text-xs text-muted-foreground">Ремонтов</div>
          </div>
        </div>

        <div className="flex gap-2">
          {onView && (
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onView(client)}>
              <Icon name="Eye" size={14} className="mr-1" />
              Детали
            </Button>
          )}
          {onEdit && (
            <Button size="sm" variant="outline" onClick={() => onEdit(client)}>
              <Icon name="Edit" size={14} />
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="outline" onClick={() => onDelete(client.id)}>
              <Icon name="Trash2" size={14} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
