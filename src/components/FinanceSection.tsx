import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import { DataTable, Column, Filter } from "@/components/ui/data-table";
import { ImportExportDialog } from "@/components/ImportExportDialog";
import { financeService } from "@/services/financeService";
import { Transaction, TransactionType } from "@/types";
import { toast } from "sonner";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FinanceSection = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(financeService.getAll());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeView, setActiveView] = useState<"table" | "analytics" | "reports">("table");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState<"day" | "week" | "month" | "year">("month");

  const [formData, setFormData] = useState({
    type: "income" as TransactionType,
    category: "",
    amount: 0,
    description: "",
    date: new Date(),
    relatedRepairId: "",
    paymentMethod: "",
    tags: [] as string[],
    recurring: false,
    invoiceNumber: "",
    taxRate: 0
  });

  const categories = Array.from(new Set(transactions.map(t => t.category)));
  const paymentMethods = Array.from(new Set(transactions.map(t => t.paymentMethod).filter(Boolean))) as string[];

  const financeStats = useMemo(() => {
    let filteredTransactions = transactions;

    if (dateFrom) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.date >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.date <= new Date(dateTo)
      );
    }
    if (categoryFilter) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.category === categoryFilter
      );
    }

    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpense;

    const byCategory: { [key: string]: { income: number; expense: number } } = {};
    filteredTransactions.forEach(t => {
      if (!byCategory[t.category]) {
        byCategory[t.category] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        byCategory[t.category].income += t.amount;
      } else {
        byCategory[t.category].expense += t.amount;
      }
    });

    const byPaymentMethod: { [key: string]: number } = {};
    filteredTransactions.forEach(t => {
      const method = t.paymentMethod || 'Не указано';
      byPaymentMethod[method] = (byPaymentMethod[method] || 0) + t.amount;
    });

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recentTransactions = transactions.filter(t => t.date >= last30Days);
    
    const dailyData: { [key: string]: { income: number; expense: number; date: Date } } = {};
    recentTransactions.forEach(t => {
      const dateKey = t.date.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { income: 0, expense: 0, date: t.date };
      }
      if (t.type === 'income') {
        dailyData[dateKey].income += t.amount;
      } else {
        dailyData[dateKey].expense += t.amount;
      }
    });

    const chartData = Object.values(dailyData)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(d => ({
        date: d.date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        Доходы: d.income,
        Расходы: d.expense,
        Баланс: d.income - d.expense
      }));

    const categoryChartData = Object.entries(byCategory).map(([name, data]) => ({
      name,
      income: data.income,
      expense: data.expense,
      total: data.income + data.expense
    }));

    const paymentMethodData = Object.entries(byPaymentMethod).map(([name, value]) => ({
      name,
      value
    }));

    const avgTransactionAmount = filteredTransactions.length > 0 
      ? Math.round(filteredTransactions.reduce((sum, t) => sum + t.amount, 0) / filteredTransactions.length)
      : 0;

    const largestIncome = Math.max(...filteredTransactions.filter(t => t.type === 'income').map(t => t.amount), 0);
    const largestExpense = Math.max(...filteredTransactions.filter(t => t.type === 'expense').map(t => t.amount), 0);

    const monthlyData: { [key: string]: { income: number; expense: number; month: string } } = {};
    transactions.forEach(t => {
      const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { 
          income: 0, 
          expense: 0, 
          month: new Date(t.date.getFullYear(), t.date.getMonth()).toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })
        };
      }
      if (t.type === 'income') {
        monthlyData[monthKey].income += t.amount;
      } else {
        monthlyData[monthKey].expense += t.amount;
      }
    });

    const monthlyChartData = Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .map(d => ({
        month: d.month,
        Доходы: d.income,
        Расходы: d.expense,
        Прибыль: d.income - d.expense
      }));

    const profitMargin = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : '0';

    return {
      totalIncome,
      totalExpense,
      balance,
      byCategory,
      byPaymentMethod,
      chartData,
      categoryChartData,
      paymentMethodData,
      avgTransactionAmount,
      largestIncome,
      largestExpense,
      filteredCount: filteredTransactions.length,
      monthlyChartData,
      profitMargin
    };
  }, [transactions, dateFrom, dateTo, categoryFilter]);

  const handleCreate = () => {
    if (!formData.category || formData.amount <= 0) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    financeService.create(formData);
    setTransactions(financeService.getAll());
    setIsCreateOpen(false);
    resetForm();
    toast.success("Операция создана");
  };

  const handleUpdate = () => {
    if (!editingTransaction) return;
    
    if (!formData.category || formData.amount <= 0) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    financeService.update(editingTransaction.id, formData);
    setTransactions(financeService.getAll());
    setEditingTransaction(null);
    resetForm();
    toast.success("Операция обновлена");
  };

  const handleDelete = (id: string) => {
    if (confirm("Удалить операцию?")) {
      financeService.delete(id);
      setTransactions(financeService.getAll());
      toast.success("Операция удалена");
    }
  };

  const handleDuplicate = (transaction: Transaction) => {
    financeService.create({
      ...transaction,
      date: new Date()
    });
    setTransactions(financeService.getAll());
    toast.success("Операция дублирована");
  };

  const resetForm = () => {
    setFormData({
      type: "income",
      category: "",
      amount: 0,
      description: "",
      date: new Date(),
      relatedRepairId: "",
      paymentMethod: "",
      tags: [],
      recurring: false,
      invoiceNumber: "",
      taxRate: 0
    });
  };

  const openEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      description: transaction.description,
      date: transaction.date,
      relatedRepairId: transaction.relatedRepairId || "",
      paymentMethod: transaction.paymentMethod || "",
      tags: (transaction as any).tags || [],
      recurring: false,
      invoiceNumber: (transaction as any).invoiceNumber || "",
      taxRate: (transaction as any).taxRate || 0
    });
  };

  const columns: Column<Transaction>[] = [
    { 
      key: 'date', 
      label: 'Дата', 
      render: (transaction) => (
        <span className="text-sm whitespace-nowrap">{transaction.date.toLocaleDateString('ru-RU')}</span>
      ),
      sortable: true,
      width: 'w-[120px]'
    },
    { 
      key: 'type', 
      label: 'Тип', 
      render: (transaction) => (
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
            transaction.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'
          }`}>
            <Icon name={transaction.type === 'income' ? 'ArrowDownLeft' : 'ArrowUpRight'} 
                  className={`h-4 w-4 ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <span className="text-sm">
            {transaction.type === 'income' ? 'Доход' : 'Расход'}
          </span>
        </div>
      ),
      sortable: true,
      width: 'w-[140px]'
    },
    { 
      key: 'description', 
      label: 'Описание', 
      render: (transaction) => (
        <div>
          <div className="font-medium">{transaction.description}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
            {transaction.relatedRepairId && (
              <span className="flex items-center gap-1">
                <Icon name="Link" className="h-3 w-3" />
                {transaction.relatedRepairId}
              </span>
            )}
            {(transaction as any).tags && (transaction as any).tags.length > 0 && (
              <span className="flex items-center gap-1">
                {(transaction as any).tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </span>
            )}
          </div>
        </div>
      ),
      sortable: true
    },
    { 
      key: 'category', 
      label: 'Категория', 
      render: (transaction) => (
        <Badge variant="outline">{transaction.category}</Badge>
      ),
      sortable: true,
      width: 'w-[140px]'
    },
    { 
      key: 'paymentMethod', 
      label: 'Способ оплаты', 
      render: (transaction) => (
        <span className="text-sm text-muted-foreground">
          {transaction.paymentMethod || '-'}
        </span>
      ),
      width: 'w-[140px]'
    },
    { 
      key: 'amount', 
      label: 'Сумма', 
      render: (transaction) => (
        <div className={`font-bold text-right ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
          {transaction.type === 'income' ? '+' : '-'}₽{transaction.amount.toLocaleString()}
        </div>
      ),
      sortable: true,
      width: 'w-[140px]'
    },
    {
      key: 'actions',
      label: 'Действия',
      render: (transaction) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEdit(transaction)}
          >
            <Icon name="Edit" className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDuplicate(transaction)}
          >
            <Icon name="Copy" className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(transaction.id)}
            className="text-destructive hover:text-destructive"
          >
            <Icon name="Trash2" className="h-4 w-4" />
          </Button>
        </div>
      ),
      width: 'w-[140px]'
    }
  ];

  const filters: Filter[] = [
    {
      key: 'type',
      label: 'Тип',
      options: [
        { value: 'income', label: 'Доходы' },
        { value: 'expense', label: 'Расходы' }
      ]
    },
    ...(categories.length > 0 ? [{
      key: 'category',
      label: 'Категория',
      options: categories.map(c => ({ value: c, label: c }))
    }] : [])
  ];

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Финансы</h2>
          <p className="text-muted-foreground">Управление доходами и расходами</p>
        </div>
        <div className="flex gap-2">
          <ImportExportDialog 
            data={transactions} 
            onImport={(data) => {
              data.forEach(item => financeService.create(item));
              setTransactions(financeService.getAll());
            }}
            entity="finance"
          />
          <Dialog open={isCreateOpen || !!editingTransaction} onOpenChange={(open) => {
            if (!open) {
              setIsCreateOpen(false);
              setEditingTransaction(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
                <Icon name="Plus" className="h-4 w-4" />
                Новая операция
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTransaction ? "Редактировать операцию" : "Новая финансовая операция"}</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="main" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="main">Основное</TabsTrigger>
                  <TabsTrigger value="additional">Дополнительно</TabsTrigger>
                </TabsList>

                <TabsContent value="main" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Тип операции *</Label>
                      <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val as TransactionType})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">
                            <div className="flex items-center gap-2">
                              <Icon name="ArrowDownLeft" className="h-4 w-4 text-green-600" />
                              Доход
                            </div>
                          </SelectItem>
                          <SelectItem value="expense">
                            <div className="flex items-center gap-2">
                              <Icon name="ArrowUpRight" className="h-4 w-4 text-red-600" />
                              Расход
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Категория *</Label>
                      <Input 
                        value={formData.category} 
                        onChange={(e) => setFormData({...formData, category: e.target.value})} 
                        placeholder="Ремонт, Закупка, Зарплата..." 
                        list="categories"
                      />
                      <datalist id="categories">
                        {categories.map(cat => <option key={cat} value={cat} />)}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <Label>Сумма *</Label>
                    <Input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amount} 
                      onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} 
                      placeholder="0.00" 
                    />
                  </div>

                  <div>
                    <Label>Описание</Label>
                    <Textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})} 
                      placeholder="Подробное описание операции" 
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Дата</Label>
                      <Input 
                        type="date"
                        value={formData.date.toISOString().split('T')[0]} 
                        onChange={(e) => setFormData({...formData, date: new Date(e.target.value)})} 
                      />
                    </div>

                    <div>
                      <Label>Способ оплаты</Label>
                      <Input 
                        value={formData.paymentMethod} 
                        onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} 
                        placeholder="Наличные, Карта..." 
                        list="payment-methods"
                      />
                      <datalist id="payment-methods">
                        {paymentMethods.map(method => <option key={method} value={method} />)}
                        <option value="Наличные" />
                        <option value="Карта" />
                        <option value="Перевод" />
                        <option value="Онлайн" />
                      </datalist>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="additional" className="space-y-4">
                  <div>
                    <Label>Связанная заявка</Label>
                    <Input 
                      value={formData.relatedRepairId} 
                      onChange={(e) => setFormData({...formData, relatedRepairId: e.target.value})} 
                      placeholder="ID заявки на ремонт" 
                    />
                  </div>

                  <div>
                    <Label>Номер счета/накладной</Label>
                    <Input 
                      value={formData.invoiceNumber} 
                      onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})} 
                      placeholder="INV-2024-001" 
                    />
                  </div>

                  <div>
                    <Label>НДС (%)</Label>
                    <Input 
                      type="number"
                      min="0"
                      max="100"
                      value={formData.taxRate} 
                      onChange={(e) => setFormData({...formData, taxRate: Number(e.target.value)})} 
                      placeholder="20" 
                    />
                  </div>

                  {formData.taxRate > 0 && formData.amount > 0 && (
                    <Card className="bg-muted">
                      <CardContent className="p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Сумма без НДС:</span>
                          <span className="font-medium">₽{(formData.amount / (1 + formData.taxRate / 100)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>НДС {formData.taxRate}%:</span>
                          <span className="font-medium">₽{(formData.amount - (formData.amount / (1 + formData.taxRate / 100))).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-2">
                          <span>Итого:</span>
                          <span>₽{formData.amount.toFixed(2)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setIsCreateOpen(false);
                  setEditingTransaction(null);
                  resetForm();
                }}>
                  Отмена
                </Button>
                <Button onClick={editingTransaction ? handleUpdate : handleCreate}>
                  {editingTransaction ? "Сохранить" : "Создать"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Доходы</CardTitle>
            <Icon name="TrendingUp" className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">₽{financeStats.totalIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              За период
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Расходы</CardTitle>
            <Icon name="TrendingDown" className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">₽{financeStats.totalExpense.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              За период
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Прибыль</CardTitle>
            <Icon name="DollarSign" className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${financeStats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {financeStats.balance >= 0 ? '+' : ''}₽{financeStats.balance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Маржа: {financeStats.profitMargin}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
            <Icon name="Receipt" className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₽{financeStats.avgTransactionAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {financeStats.filteredCount} операций
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-4">
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
            variant={activeView === "analytics" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("analytics")}
          >
            <Icon name="BarChart3" className="h-4 w-4 mr-2" />
            Аналитика
          </Button>
          <Button
            variant={activeView === "reports" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("reports")}
          >
            <Icon name="FileText" className="h-4 w-4 mr-2" />
            Отчёты
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Input 
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[150px]"
            placeholder="От"
          />
          <span className="text-muted-foreground">—</span>
          <Input 
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[150px]"
            placeholder="До"
          />
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>
              <Icon name="X" className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {activeView === "table" && (
        <Card>
          <DataTable
            data={transactions}
            columns={columns}
            filters={filters}
            searchable
            searchPlaceholder="Поиск по описанию..."
          />
        </Card>
      )}

      {activeView === "analytics" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Динамика за месяц</CardTitle>
              <CardDescription>Ежедневные доходы и расходы</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={financeStats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₽${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Area type="monotone" dataKey="Доходы" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="Расходы" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>По категориям</CardTitle>
                <CardDescription>Доходы и расходы по категориям</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={financeStats.categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₽${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="income" name="Доходы" fill="#10b981" />
                    <Bar dataKey="expense" name="Расходы" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Способы оплаты</CardTitle>
                <CardDescription>Распределение по методам оплаты</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={financeStats.paymentMethodData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ₽${entry.value.toLocaleString()}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {financeStats.paymentMethodData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₽${Number(value).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Годовая динамика</CardTitle>
              <CardDescription>Помесячная статистика за последние 12 месяцев</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={financeStats.monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₽${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="Доходы" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="Расходы" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="Прибыль" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === "reports" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Крупнейший доход</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ₽{financeStats.largestIncome.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Крупнейший расход</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  ₽{financeStats.largestExpense.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Рентабельность</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${Number(financeStats.profitMargin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financeStats.profitMargin}%
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Детали по категориям</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(financeStats.byCategory).map(([cat, data]) => (
                    <div key={cat} className="p-3 bg-muted rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{cat}</span>
                        <span className={`font-bold ${data.income - data.expense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {data.income - data.expense >= 0 ? '+' : ''}₽{(data.income - data.expense).toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-green-600">
                          Доходы: ₽{data.income.toLocaleString()}
                        </div>
                        <div className="text-red-600">
                          Расходы: ₽{data.expense.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Сводка</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="text-sm text-green-800">Всего доходов</div>
                      <div className="text-2xl font-bold text-green-600">₽{financeStats.totalIncome.toLocaleString()}</div>
                    </div>
                    <Icon name="TrendingUp" className="h-10 w-10 text-green-500" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <div className="text-sm text-red-800">Всего расходов</div>
                      <div className="text-2xl font-bold text-red-600">₽{financeStats.totalExpense.toLocaleString()}</div>
                    </div>
                    <Icon name="TrendingDown" className="h-10 w-10 text-red-500" />
                  </div>

                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    financeStats.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'
                  }`}>
                    <div>
                      <div className={`text-sm ${financeStats.balance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                        Чистая прибыль
                      </div>
                      <div className={`text-2xl font-bold ${financeStats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {financeStats.balance >= 0 ? '+' : ''}₽{financeStats.balance.toLocaleString()}
                      </div>
                    </div>
                    <Icon name="DollarSign" className={`h-10 w-10 ${financeStats.balance >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Ключевые показатели</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Средний чек:</span>
                      <span className="font-medium">₽{financeStats.avgTransactionAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Всего операций:</span>
                      <span className="font-medium">{transactions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Маржа прибыли:</span>
                      <span className={`font-medium ${Number(financeStats.profitMargin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {financeStats.profitMargin}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceSection;
