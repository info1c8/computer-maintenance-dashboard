import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { DataTable, Column, Filter } from "@/components/ui/data-table";
import { ImportExportDialog } from "@/components/ImportExportDialog";
import { inventoryService } from "@/services/inventoryService";
import { InventoryItem } from "@/types";
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const InventorySection = () => {
  const [items, setItems] = useState<InventoryItem[]>(inventoryService.getAll());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'low' | 'out'>('all');
  const [activeView, setActiveView] = useState<"table" | "cards" | "analytics">("table");

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    sku: "",
    quantity: 0,
    minQuantity: 0,
    maxQuantity: 100,
    price: 0,
    costPrice: 0,
    supplier: "",
    location: "",
    description: "",
    unit: "шт",
    barcode: "",
    warranty: 0,
    tags: [] as string[]
  });

  const stats = useMemo(() => {
    const lowStock = items.filter(item => item.quantity > 0 && item.quantity <= item.minQuantity);
    const outOfStock = items.filter(item => item.quantity === 0);
    const inStock = items.filter(item => item.quantity > item.minQuantity);
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalCostValue = items.reduce((sum, item) => sum + ((item as any).costPrice || item.price) * item.quantity, 0);
    const potentialProfit = totalValue - totalCostValue;
    
    const categoryStats = items.reduce((acc, item) => {
      const cat = item.category;
      if (!acc[cat]) {
        acc[cat] = { count: 0, value: 0, quantity: 0 };
      }
      acc[cat].count++;
      acc[cat].value += item.price * item.quantity;
      acc[cat].quantity += item.quantity;
      return acc;
    }, {} as Record<string, { count: number; value: number; quantity: number }>);

    const supplierStats = items.reduce((acc, item) => {
      const sup = item.supplier || 'Без поставщика';
      if (!acc[sup]) {
        acc[sup] = { count: 0, value: 0, quantity: 0 };
      }
      acc[sup].count++;
      acc[sup].value += item.price * item.quantity;
      acc[sup].quantity += item.quantity;
      return acc;
    }, {} as Record<string, { count: number; value: number; quantity: number }>);

    const categoryChartData = Object.entries(categoryStats).map(([name, data]) => ({
      name,
      value: data.value,
      count: data.count,
      quantity: data.quantity
    }));

    const stockLevelData = [
      { name: 'В наличии', value: inStock.length, color: '#10b981' },
      { name: 'Низкий остаток', value: lowStock.length, color: '#f59e0b' },
      { name: 'Отсутствует', value: outOfStock.length, color: '#ef4444' }
    ];

    const topItems = [...items]
      .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
      .slice(0, 10);

    const avgPrice = items.length > 0 
      ? items.reduce((sum, item) => sum + item.price, 0) / items.length 
      : 0;

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const avgQuantity = items.length > 0 ? totalQuantity / items.length : 0;

    return {
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      inStock: inStock.length,
      totalValue,
      potentialProfit,
      categoryStats,
      supplierStats,
      criticalItems: lowStock.length + outOfStock.length,
      categoryChartData,
      stockLevelData,
      topItems,
      avgPrice,
      totalQuantity,
      avgQuantity
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    switch(viewMode) {
      case 'low':
        return items.filter(item => item.quantity > 0 && item.quantity <= item.minQuantity);
      case 'out':
        return items.filter(item => item.quantity === 0);
      default:
        return items;
    }
  }, [items, viewMode]);

  const categories = [...new Set(items.map(item => item.category))];
  const suppliers = [...new Set(items.map(item => item.supplier).filter(Boolean))];

  const handleCreate = () => {
    if (!formData.name || !formData.category) {
      toast.error("Заполните обязательные поля");
      return;
    }

    inventoryService.create({
      ...formData,
      lastRestocked: new Date()
    });
    setItems(inventoryService.getAll());
    setIsCreateOpen(false);
    resetForm();
    toast.success('Позиция добавлена');
  };

  const handleUpdate = () => {
    if (!editingItem) return;
    inventoryService.update(editingItem.id, formData);
    setItems(inventoryService.getAll());
    setEditingItem(null);
    resetForm();
    toast.success('Позиция обновлена');
  };

  const handleDelete = (id: string) => {
    if (confirm("Удалить позицию из инвентаря?")) {
      inventoryService.delete(id);
      setItems(inventoryService.getAll());
      toast.success('Позиция удалена');
    }
  };

  const handleQuickRestock = (item: InventoryItem) => {
    const toAdd = prompt(`Добавить к остатку "${item.name}". Текущий остаток: ${item.quantity} шт.`, "10");
    if (toAdd && !isNaN(Number(toAdd))) {
      inventoryService.update(item.id, { 
        quantity: item.quantity + Number(toAdd),
        lastRestocked: new Date()
      });
      setItems(inventoryService.getAll());
      toast.success(`Добавлено ${toAdd} шт.`);
    }
  };

  const handleBulkReorder = () => {
    const itemsToReorder = items.filter(item => item.quantity <= item.minQuantity);
    if (itemsToReorder.length === 0) {
      toast.info("Нет позиций для заказа");
      return;
    }
    
    const list = itemsToReorder.map(item => 
      `${item.name} (${item.sku}): заказать ${(item as any).maxQuantity - item.quantity} ${(item as any).unit || 'шт'}`
    ).join('\n');
    
    alert(`Позиции для заказа:\n\n${list}`);
    toast.success(`Подготовлен список для заказа (${itemsToReorder.length} позиций)`);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      sku: "",
      quantity: 0,
      minQuantity: 0,
      maxQuantity: 100,
      price: 0,
      costPrice: 0,
      supplier: "",
      location: "",
      description: "",
      unit: "шт",
      barcode: "",
      warranty: 0,
      tags: []
    });
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      sku: item.sku,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      maxQuantity: (item as any).maxQuantity || 100,
      price: item.price,
      costPrice: (item as any).costPrice || item.price,
      supplier: item.supplier || "",
      location: item.location || "",
      description: (item as any).description || "",
      unit: (item as any).unit || "шт",
      barcode: (item as any).barcode || "",
      warranty: (item as any).warranty || 0,
      tags: (item as any).tags || []
    });
  };

  const getStockStatus = (item: InventoryItem) => {
    const percentage = (item.quantity / item.minQuantity) * 100;
    if (item.quantity === 0) return { 
      variant: "destructive" as const, 
      label: "Отсутствует", 
      color: "bg-red-500",
      percentage: 0
    };
    if (item.quantity <= item.minQuantity) return { 
      variant: "secondary" as const, 
      label: "Низкий остаток", 
      color: "bg-yellow-500",
      percentage: Math.min(percentage, 100)
    };
    return { 
      variant: "outline" as const, 
      label: "В наличии", 
      color: "bg-green-500",
      percentage: 100
    };
  };

  const columns: Column<InventoryItem>[] = [
    { 
      key: 'name', 
      label: 'Наименование', 
      render: (item) => {
        const status = getStockStatus(item);
        return (
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${status.color}/10 flex items-center justify-center`}>
              <Icon name="Package" className={`h-5 w-5 ${status.color.replace('bg-', 'text-')}`} />
            </div>
            <div>
              <div className="font-medium">{item.name}</div>
              <div className="text-xs text-muted-foreground">{item.sku}</div>
            </div>
          </div>
        );
      },
      sortable: true
    },
    { 
      key: 'category', 
      label: 'Категория', 
      render: (item) => (
        <Badge variant="outline">{item.category}</Badge>
      ),
      sortable: true
    },
    { 
      key: 'quantity', 
      label: 'Остаток', 
      render: (item) => {
        const status = getStockStatus(item);
        return (
          <div className="space-y-1">
            <div className={`font-medium ${item.quantity <= item.minQuantity ? 'text-red-600' : ''}`}>
              {item.quantity} {(item as any).unit || 'шт'}
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden w-20">
              <div 
                className={`h-full ${status.color} transition-all`}
                style={{ width: `${status.percentage}%` }}
              />
            </div>
          </div>
        );
      },
      sortable: true,
      width: 'w-[120px]'
    },
    { 
      key: 'minQuantity', 
      label: 'Мин/Макс', 
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.minQuantity} / {(item as any).maxQuantity || '∞'}
        </span>
      ),
      sortable: true,
      width: 'w-[100px]'
    },
    { 
      key: 'price', 
      label: 'Цена', 
      render: (item) => {
        const costPrice = (item as any).costPrice || item.price;
        const margin = item.price - costPrice;
        const marginPercent = costPrice > 0 ? ((margin / costPrice) * 100).toFixed(0) : 0;
        return (
          <div>
            <div className="font-medium">₽{item.price.toLocaleString()}</div>
            <div className="text-xs text-green-600">+{marginPercent}%</div>
          </div>
        );
      },
      sortable: true,
      width: 'w-[120px]'
    },
    { 
      key: 'totalValue', 
      label: 'Сумма', 
      render: (item) => (
        <span className="font-semibold">₽{(item.price * item.quantity).toLocaleString()}</span>
      ),
      sortable: true,
      width: 'w-[120px]'
    },
    {
      key: 'actions',
      label: 'Действия',
      render: (item) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedItem(item)}
          >
            <Icon name="Eye" className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEdit(item)}
          >
            <Icon name="Edit" className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleQuickRestock(item)}
            className="text-green-600 hover:text-green-700"
          >
            <Icon name="Plus" className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item.id)}
            className="text-destructive hover:text-destructive"
          >
            <Icon name="Trash2" className="h-4 w-4" />
          </Button>
        </div>
      ),
      width: 'w-[160px]'
    }
  ];

  const filters: Filter<InventoryItem>[] = [
    {
      key: 'category',
      label: 'Категория',
      options: categories.map(cat => ({ label: cat, value: cat }))
    },
    {
      key: 'supplier',
      label: 'Поставщик',
      options: suppliers.map(sup => ({ label: sup, value: sup }))
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Инвентарь</h2>
          <p className="text-muted-foreground">Управление складскими запасами и товарами</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBulkReorder} className="gap-2">
            <Icon name="ShoppingCart" className="h-4 w-4" />
            Заказать ({stats.criticalItems})
          </Button>
          <ImportExportDialog 
            data={items} 
            onImport={(data) => {
              data.forEach(item => inventoryService.create(item));
              setItems(inventoryService.getAll());
            }}
            entity="inventory"
          />
          <Dialog open={isCreateOpen || !!editingItem} onOpenChange={(open) => {
            if (!open) {
              setIsCreateOpen(false);
              setEditingItem(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
                <Icon name="Plus" className="h-4 w-4" />
                Добавить позицию
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Редактировать позицию" : "Новая позиция"}</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="main" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="main">Основное</TabsTrigger>
                  <TabsTrigger value="pricing">Цены</TabsTrigger>
                  <TabsTrigger value="additional">Дополнительно</TabsTrigger>
                </TabsList>
                
                <TabsContent value="main" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Наименование *</Label>
                      <Input 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        placeholder="iPhone 12 Pro экран OLED" 
                      />
                    </div>
                    <div>
                      <Label>Категория *</Label>
                      <Input 
                        value={formData.category} 
                        onChange={(e) => setFormData({...formData, category: e.target.value})} 
                        placeholder="Комплектующие" 
                        list="categories"
                      />
                      <datalist id="categories">
                        {categories.map(cat => <option key={cat} value={cat} />)}
                      </datalist>
                    </div>
                    <div>
                      <Label>Артикул (SKU)</Label>
                      <Input 
                        value={formData.sku} 
                        onChange={(e) => setFormData({...formData, sku: e.target.value})} 
                        placeholder="IP12-OLED-001" 
                      />
                    </div>
                    <div>
                      <Label>Штрихкод</Label>
                      <Input 
                        value={formData.barcode} 
                        onChange={(e) => setFormData({...formData, barcode: e.target.value})} 
                        placeholder="1234567890123" 
                      />
                    </div>
                    <div>
                      <Label>Единица измерения</Label>
                      <Select value={formData.unit} onValueChange={(val) => setFormData({...formData, unit: val})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="шт">Штуки</SelectItem>
                          <SelectItem value="кг">Килограммы</SelectItem>
                          <SelectItem value="л">Литры</SelectItem>
                          <SelectItem value="м">Метры</SelectItem>
                          <SelectItem value="упак">Упаковки</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Количество</Label>
                      <Input 
                        type="number"
                        min="0"
                        value={formData.quantity} 
                        onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})} 
                      />
                    </div>
                    <div>
                      <Label>Минимум</Label>
                      <Input 
                        type="number"
                        min="0"
                        value={formData.minQuantity} 
                        onChange={(e) => setFormData({...formData, minQuantity: Number(e.target.value)})} 
                      />
                    </div>
                    <div>
                      <Label>Максимум</Label>
                      <Input 
                        type="number"
                        min="0"
                        value={formData.maxQuantity} 
                        onChange={(e) => setFormData({...formData, maxQuantity: Number(e.target.value)})} 
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Цена продажи</Label>
                      <Input 
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price} 
                        onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} 
                        placeholder="0.00" 
                      />
                    </div>
                    <div>
                      <Label>Себестоимость</Label>
                      <Input 
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.costPrice} 
                        onChange={(e) => setFormData({...formData, costPrice: Number(e.target.value)})} 
                        placeholder="0.00" 
                      />
                    </div>
                  </div>

                  {formData.price > 0 && formData.costPrice > 0 && (
                    <Card className="bg-muted">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Наценка</div>
                            <div className="text-lg font-bold text-green-600">
                              {((formData.price - formData.costPrice) / formData.costPrice * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Прибыль</div>
                            <div className="text-lg font-bold">
                              ₽{(formData.price - formData.costPrice).toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">На складе</div>
                            <div className="text-lg font-bold">
                              ₽{((formData.price - formData.costPrice) * formData.quantity).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="additional" className="space-y-4">
                  <div>
                    <Label>Поставщик</Label>
                    <Input 
                      value={formData.supplier} 
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})} 
                      placeholder="ООО РемСервис" 
                      list="suppliers"
                    />
                    <datalist id="suppliers">
                      {suppliers.map(sup => <option key={sup} value={sup} />)}
                    </datalist>
                  </div>

                  <div>
                    <Label>Местоположение</Label>
                    <Input 
                      value={formData.location} 
                      onChange={(e) => setFormData({...formData, location: e.target.value})} 
                      placeholder="Стеллаж A, полка 3" 
                    />
                  </div>

                  <div>
                    <Label>Гарантия (месяцев)</Label>
                    <Input 
                      type="number"
                      min="0"
                      value={formData.warranty} 
                      onChange={(e) => setFormData({...formData, warranty: Number(e.target.value)})} 
                      placeholder="12" 
                    />
                  </div>

                  <div>
                    <Label>Описание</Label>
                    <Textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})} 
                      placeholder="Дополнительная информация о товаре" 
                      rows={4}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setIsCreateOpen(false);
                  setEditingItem(null);
                  resetForm();
                }}>
                  Отмена
                </Button>
                <Button onClick={editingItem ? handleUpdate : handleCreate}>
                  {editingItem ? "Сохранить" : "Создать"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Всего позиций</CardTitle>
            <Icon name="Package" className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.totalQuantity} единиц</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Стоимость</CardTitle>
            <Icon name="DollarSign" className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₽{Math.round(stats.totalValue).toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">Прибыль: ₽{Math.round(stats.potentialProfit).toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Требует внимания</CardTitle>
            <Icon name="AlertTriangle" className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.criticalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Низкий остаток / нет в наличии</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Средняя цена</CardTitle>
            <Icon name="TrendingUp" className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₽{Math.round(stats.avgPrice).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">За единицу</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">Все ({items.length})</TabsTrigger>
            <TabsTrigger value="low">Низкий остаток ({stats.lowStock})</TabsTrigger>
            <TabsTrigger value="out">Отсутствует ({stats.outOfStock})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button
            variant={activeView === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("table")}
          >
            <Icon name="List" className="h-4 w-4 mr-2" />
            Таблица
          </Button>
          <Button
            variant={activeView === "cards" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("cards")}
          >
            <Icon name="LayoutGrid" className="h-4 w-4 mr-2" />
            Карточки
          </Button>
          <Button
            variant={activeView === "analytics" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("analytics")}
          >
            <Icon name="BarChart3" className="h-4 w-4 mr-2" />
            Аналитика
          </Button>
        </div>
      </div>

      {activeView === "table" && (
        <Card>
          <DataTable
            data={filteredItems}
            columns={columns}
            filters={filters}
            searchable
            searchPlaceholder="Поиск по названию, SKU..."
          />
        </Card>
      )}

      {activeView === "cards" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map(item => {
            const status = getStockStatus(item);
            const margin = item.price - ((item as any).costPrice || item.price);
            const marginPercent = ((item as any).costPrice || item.price) > 0 
              ? ((margin / ((item as any).costPrice || item.price)) * 100).toFixed(0) 
              : 0;

            return (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-lg ${status.color}/10 flex items-center justify-center`}>
                        <Icon name="Package" className={`h-6 w-6 ${status.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <CardDescription>{item.sku}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Категория</span>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Остаток</span>
                      <span className={`font-medium ${item.quantity <= item.minQuantity ? 'text-red-600' : ''}`}>
                        {item.quantity} / {item.minQuantity} {(item as any).unit || 'шт'}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${status.color} transition-all`}
                        style={{ width: `${status.percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <div className="text-2xl font-bold">₽{item.price.toLocaleString()}</div>
                      <div className="text-xs text-green-600">+{marginPercent}% наценка</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">На сумму</div>
                      <div className="font-semibold">₽{(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex gap-1 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)} className="flex-1">
                      <Icon name="Eye" className="h-4 w-4 mr-1" />
                      Просмотр
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                      <Icon name="Edit" className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleQuickRestock(item)} className="text-green-600">
                      <Icon name="Plus" className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeView === "analytics" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Распределение по категориям</CardTitle>
                <CardDescription>Стоимость товаров по категориям</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₽${Number(value).toLocaleString()}`} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Уровень запасов</CardTitle>
                <CardDescription>Распределение товаров по статусу</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.stockLevelData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.stockLevelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Топ-10 позиций по стоимости</CardTitle>
              <CardDescription>Самые дорогие товары на складе</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.topItems.map((item, index) => {
                  const totalValue = item.price * item.quantity;
                  const maxValue = stats.topItems[0].price * stats.topItems[0].quantity;
                  const percentage = (totalValue / maxValue) * 100;

                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{item.name}</span>
                          <span className="font-bold">₽{totalValue.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-16 text-right">
                            {item.quantity} {(item as any).unit || 'шт'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>По категориям</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.categoryStats).map(([cat, data]) => (
                    <div key={cat} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">{cat}</div>
                        <div className="text-sm text-muted-foreground">{data.count} позиций</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">₽{data.value.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">{data.quantity} шт</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>По поставщикам</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.supplierStats).map(([sup, data]) => (
                    <div key={sup} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">{sup}</div>
                        <div className="text-sm text-muted-foreground">{data.count} позиций</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">₽{data.value.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">{data.quantity} шт</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Общая информация</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Артикул:</span>
                        <span className="font-medium">{selectedItem.sku}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Категория:</span>
                        <Badge variant="outline">{selectedItem.category}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Штрихкод:</span>
                        <span className="font-medium">{(selectedItem as any).barcode || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Местоположение:</span>
                        <span className="font-medium">{selectedItem.location || '-'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Остатки</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Текущий остаток:</span>
                        <span className="font-bold">{selectedItem.quantity} {(selectedItem as any).unit || 'шт'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Минимум:</span>
                        <span>{selectedItem.minQuantity} {(selectedItem as any).unit || 'шт'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Максимум:</span>
                        <span>{(selectedItem as any).maxQuantity || '∞'} {(selectedItem as any).unit || 'шт'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Статус:</span>
                        <Badge variant={getStockStatus(selectedItem).variant}>
                          {getStockStatus(selectedItem).label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Цены</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Цена продажи:</span>
                        <span className="font-bold">₽{selectedItem.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Себестоимость:</span>
                        <span>₽{((selectedItem as any).costPrice || selectedItem.price).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Наценка:</span>
                        <span className="text-green-600 font-medium">
                          {(((selectedItem.price - ((selectedItem as any).costPrice || selectedItem.price)) / ((selectedItem as any).costPrice || selectedItem.price)) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Стоимость на складе:</span>
                        <span className="font-bold">₽{(selectedItem.price * selectedItem.quantity).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Дополнительно</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Поставщик:</span>
                        <span className="font-medium">{selectedItem.supplier || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Гарантия:</span>
                        <span>{(selectedItem as any).warranty || 0} мес.</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Последнее поступление:</span>
                        <span>{selectedItem.lastRestocked?.toLocaleDateString('ru-RU') || '-'}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {(selectedItem as any).description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Описание</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{(selectedItem as any).description}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2">
                  <Button onClick={() => {
                    openEdit(selectedItem);
                    setSelectedItem(null);
                  }} className="flex-1">
                    <Icon name="Edit" className="h-4 w-4 mr-2" />
                    Редактировать
                  </Button>
                  <Button variant="outline" onClick={() => handleQuickRestock(selectedItem)} className="flex-1">
                    <Icon name="Plus" className="h-4 w-4 mr-2" />
                    Пополнить
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventorySection;
