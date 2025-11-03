import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { Client } from "@/types";
import { useMemo } from "react";

interface ClientStatsProps {
  clients: Client[];
}

export const ClientStats = ({ clients }: ClientStatsProps) => {
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const vipClients = clients.filter(c => c.totalSpent > 50000 || c.totalOrders > 10).length;
    const newClients = clients.filter(c => c.totalOrders <= 1).length;
    const totalRevenue = clients.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgSpend = totalClients > 0 ? Math.round(totalRevenue / totalClients) : 0;
    const activeClients = clients.filter(c => c.totalOrders > 0).length;
    const withEmail = clients.filter(c => c.email).length;

    const topClients = [...clients]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return {
      totalClients,
      vipClients,
      newClients,
      totalRevenue,
      avgSpend,
      activeClients,
      withEmail,
      topClients
    };
  }, [clients]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="Users" size={16} />
            Всего клиентов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalClients}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.activeClients} активных
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="Crown" size={16} />
            VIP клиенты
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.vipClients}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.totalClients > 0 ? Math.round((stats.vipClients / stats.totalClients) * 100) : 0}% от общего числа
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="TrendingUp" size={16} />
            Общий доход
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.totalRevenue.toLocaleString()} ₽</div>
          <p className="text-xs text-muted-foreground mt-1">
            ≈ {stats.avgSpend.toLocaleString()} ₽ на клиента
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="UserPlus" size={16} />
            Новые клиенты
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.newClients}</div>
          <p className="text-xs text-muted-foreground mt-1">
            С email: {stats.withEmail}
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Icon name="Award" size={18} />
            Топ-5 клиентов по доходу
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.topClients.map((client, index) => (
              <div key={client.id} className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-orange-600 text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{client.name}</div>
                  <div className="text-sm text-muted-foreground">{client.totalOrders} заказов</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{client.totalSpent.toLocaleString()} ₽</div>
                  <div className="text-xs text-muted-foreground">
                    {client.phone}
                  </div>
                </div>
              </div>
            ))}
            {stats.topClients.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Нет данных
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
