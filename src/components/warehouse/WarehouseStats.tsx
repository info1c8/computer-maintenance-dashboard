import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { InventoryItem } from "@/types";
import { useMemo } from "react";

interface WarehouseStatsProps {
  items: InventoryItem[];
}

export const WarehouseStats = ({ items }: WarehouseStatsProps) => {
  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const lowStock = items.filter(item => item.quantity <= item.minQuantity).length;
    const outOfStock = items.filter(item => item.quantity === 0).length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    
    const categories: Record<string, number> = {};
    items.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
    });

    return { totalItems, totalValue, lowStock, outOfStock, totalQuantity, categories };
  }, [items]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="Package" size={16} />
            Всего позиций
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalItems}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Количество: {stats.totalQuantity} шт
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="DollarSign" size={16} />
            Стоимость склада
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.totalValue.toLocaleString()} ₽</div>
          <p className="text-xs text-muted-foreground mt-1">
            Общая стоимость
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="AlertCircle" size={16} />
            Мало товара
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Требуют пополнения
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="AlertTriangle" size={16} />
            Нет в наличии
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Критический уровень
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
