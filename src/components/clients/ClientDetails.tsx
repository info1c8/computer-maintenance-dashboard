import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Icon from "@/components/ui/icon";
import { Client } from "@/types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ClientDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onEdit?: () => void;
  repairs?: Array<{ id: string; deviceType: string; status: string; createdAt: string }>;
}

export const ClientDetails = ({ open, onOpenChange, client, onEdit, repairs = [] }: ClientDetailsProps) => {
  if (!client) return null;

  const initials = client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const segment = client.totalSpent > 50000 || client.totalOrders > 10 
    ? { label: 'VIP', color: 'bg-yellow-100 text-yellow-700' }
    : client.totalOrders > 3
    ? { label: 'Постоянный', color: 'bg-blue-100 text-blue-700' }
    : { label: 'Новый', color: 'bg-gray-100 text-gray-700' };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl mb-2">{client.name}</DialogTitle>
                <Badge className={`${segment.color} border`}>
                  {segment.label}
                </Badge>
              </div>
            </div>
            {onEdit && (
              <Button onClick={onEdit} variant="outline">
                <Icon name="Edit" size={16} className="mr-2" />
                Редактировать
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="grid gap-6 mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Заказов
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{client.totalOrders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Потрачено
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{client.totalSpent.toLocaleString()} ₽</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ремонтов
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{repairs.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="User" size={18} />
                Контактная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Icon name="Phone" size={18} className="text-muted-foreground" />
                <span className="font-medium">{client.phone}</span>
              </div>
              {client.email && (
                <div className="flex items-center gap-3">
                  <Icon name="Mail" size={18} className="text-muted-foreground" />
                  <span className="font-medium">{client.email}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-3">
                  <Icon name="MapPin" size={18} className="text-muted-foreground mt-0.5" />
                  <span className="font-medium">{client.address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {((client as any).company || (client as any).taxId) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Building2" size={18} />
                  Бизнес-информация
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(client as any).company && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Компания</p>
                    <p className="font-medium">{(client as any).company}</p>
                  </div>
                )}
                {(client as any).taxId && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">ИНН</p>
                      <p className="font-medium">{(client as any).taxId}</p>
                    </div>
                  </>
                )}
                {(client as any).discountPercent > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Скидка</p>
                      <p className="font-medium text-green-600">{(client as any).discountPercent}%</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="FileText" size={18} />
                  Заметки
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{client.notes}</p>
              </CardContent>
            </Card>
          )}

          {repairs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="History" size={18} />
                  История ремонтов ({repairs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {repairs.slice(0, 5).map((repair) => (
                    <div key={repair.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Icon name="Wrench" size={16} className="text-muted-foreground" />
                        <span className="font-medium">{repair.deviceType}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(repair.createdAt), "d MMM yyyy", { locale: ru })}
                      </div>
                    </div>
                  ))}
                  {repairs.length > 5 && (
                    <div className="text-center pt-2">
                      <p className="text-sm text-muted-foreground">
                        И ещё {repairs.length - 5} ремонтов
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {client.createdAt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Calendar" size={18} />
                  Дата регистрации
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">
                  {format(new Date(client.createdAt), "d MMMM yyyy, HH:mm", { locale: ru })}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
