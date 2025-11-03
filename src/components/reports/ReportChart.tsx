import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

interface ReportChartProps {
  title: string;
  icon?: string;
  data: Array<{ label: string; value: number; color?: string }>;
}

export const ReportChart = ({ title, icon = "BarChart3", data }: ReportChartProps) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Icon name={icon} size={18} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            
            return (
              <div key={index} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground">{item.value}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color || 'bg-primary'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          {data.length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Нет данных для отображения
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
