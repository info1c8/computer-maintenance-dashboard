import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { useMemo } from "react";

interface FinanceStatsProps {
  transactions: any[];
  timeRange?: 'today' | 'week' | 'month';
}

export const FinanceStats = ({ transactions, timeRange = 'today' }: FinanceStatsProps) => {
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const filterDate = timeRange === 'today' ? todayStart : timeRange === 'week' ? weekStart : monthStart;
    const filtered = transactions.filter(t => new Date(t.date) >= filterDate);

    const income = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const profit = income - expense;
    const profitMargin = income > 0 ? (profit / income) * 100 : 0;

    return { income, expense, profit, profitMargin, count: filtered.length };
  }, [transactions, timeRange]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="TrendingUp" size={16} />
            Доход
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.income.toLocaleString()} ₽</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="TrendingDown" size={16} />
            Расход
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.expense.toLocaleString()} ₽</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="DollarSign" size={16} />
            Прибыль
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.profit.toLocaleString()} ₽
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="Percent" size={16} />
            Маржа
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.profitMargin.toFixed(1)}%</div>
        </CardContent>
      </Card>
    </div>
  );
};
