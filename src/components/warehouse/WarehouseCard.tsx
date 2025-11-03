import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Icon from "@/components/ui/icon";
import { InventoryItem } from "@/types";

interface WarehouseCardProps {
  item: InventoryItem;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (id: string) => void;
  onAddStock?: (id: string) => void;
}

export const WarehouseCard = ({ item, onEdit, onDelete, onAddStock }: WarehouseCardProps) => {
  const stockPercent = item.maxQuantity > 0 ? (item.quantity / item.maxQuantity) * 100 : 0;
  const isLowStock = item.quantity <= item.minQuantity;
  const isCritical = item.quantity === 0;

  return (
    <Card className={`hover:shadow-lg transition-all ${isCritical ? 'border-red-300 bg-red-50/30' : isLowStock ? 'border-yellow-300 bg-yellow-50/30' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate mb-1">{item.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{item.category}</p>
          </div>
          {isCritical ? (
            <Badge variant="destructive" className="flex-shrink-0">
              <Icon name="AlertTriangle" size={12} className="mr-1" />
              Нет в наличии
            </Badge>
          ) : isLowStock ? (
            <Badge variant="outline" className="flex-shrink-0 border-yellow-500 text-yellow-700">
              <Icon name="AlertCircle" size={12} className="mr-1" />
              Мало
            </Badge>
          ) : (
            <Badge variant="outline" className="flex-shrink-0 border-green-500 text-green-700">
              <Icon name="CheckCircle" size={12} className="mr-1" />
              В наличии
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-blue-50">
            <div className="text-xl font-bold text-blue-600">{item.quantity}</div>
            <div className="text-xs text-muted-foreground">В наличии</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-orange-50">
            <div className="text-xl font-bold text-orange-600">{item.minQuantity}</div>
            <div className="text-xs text-muted-foreground">Минимум</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-purple-50">
            <div className="text-xl font-bold text-purple-600">{item.maxQuantity}</div>
            <div className="text-xs text-muted-foreground">Максимум</div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Заполненность склада</span>
            <span className="font-medium">{Math.round(stockPercent)}%</span>
          </div>
          <Progress 
            value={stockPercent} 
            className={`h-2 ${isCritical ? '[&>div]:bg-red-500' : isLowStock ? '[&>div]:bg-yellow-500' : ''}`}
          />
        </div>

        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Icon name="DollarSign" size={14} />
            <span>{item.price.toLocaleString()} ₽</span>
          </div>
          {item.supplier && (
            <div className="flex items-center gap-1.5 text-muted-foreground truncate max-w-[120px]">
              <Icon name="Truck" size={14} />
              <span className="truncate">{item.supplier}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {onAddStock && (
            <Button size="sm" variant="default" className="flex-1" onClick={() => onAddStock(item.id)}>
              <Icon name="Plus" size={14} className="mr-1" />
              Добавить
            </Button>
          )}
          {onEdit && (
            <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
              <Icon name="Edit" size={14} />
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="outline" onClick={() => onDelete(item.id)}>
              <Icon name="Trash2" size={14} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
