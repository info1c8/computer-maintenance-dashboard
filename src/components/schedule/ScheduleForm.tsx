import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Technician, Schedule } from "@/types";

interface ScheduleFormData {
  technicianId: string;
  date: Date;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
  notes: string;
  isRecurring: boolean;
  recurringDays: number[];
}

interface ScheduleFormProps {
  formData: ScheduleFormData;
  setFormData: (data: ScheduleFormData) => void;
  technicians: Technician[];
  editingSchedule: Schedule | null;
  onSubmit: () => void;
}

export const ScheduleForm = ({
  formData,
  setFormData,
  technicians,
  editingSchedule,
  onSubmit
}: ScheduleFormProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Техник</Label>
        <Select value={formData.technicianId} onValueChange={(val) => setFormData({...formData, technicianId: val})}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите техника" />
          </SelectTrigger>
          <SelectContent>
            {technicians.map(tech => (
              <SelectItem key={tech.id} value={tech.id}>
                {tech.name} - {(tech as any).specialty || 'Техник'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Дата</Label>
        <Input 
          type="date"
          value={formData.date.toISOString().split('T')[0]} 
          onChange={(e) => setFormData({...formData, date: new Date(e.target.value)})} 
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Начало смены</Label>
          <Input 
            type="time"
            value={formData.startTime} 
            onChange={(e) => setFormData({...formData, startTime: e.target.value})} 
          />
        </div>
        <div>
          <Label>Конец смены</Label>
          <Input 
            type="time"
            value={formData.endTime} 
            onChange={(e) => setFormData({...formData, endTime: e.target.value})} 
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Начало перерыва</Label>
          <Input 
            type="time"
            value={formData.breakStart} 
            onChange={(e) => setFormData({...formData, breakStart: e.target.value})} 
          />
        </div>
        <div>
          <Label>Конец перерыва</Label>
          <Input 
            type="time"
            value={formData.breakEnd} 
            onChange={(e) => setFormData({...formData, breakEnd: e.target.value})} 
          />
        </div>
      </div>

      {!editingSchedule && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              checked={formData.isRecurring}
              onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
              className="rounded"
            />
            <Label htmlFor="recurring">Повторяющееся расписание</Label>
          </div>
          
          {formData.isRecurring && (
            <div className="flex gap-2 flex-wrap">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
                <Button
                  key={day}
                  type="button"
                  size="sm"
                  variant={formData.recurringDays.includes(index + 1) ? "default" : "outline"}
                  onClick={() => {
                    const days = formData.recurringDays.includes(index + 1)
                      ? formData.recurringDays.filter(d => d !== index + 1)
                      : [...formData.recurringDays, index + 1];
                    setFormData({...formData, recurringDays: days});
                  }}
                >
                  {day}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div>
        <Label>Примечания</Label>
        <Textarea 
          value={formData.notes} 
          onChange={(e) => setFormData({...formData, notes: e.target.value})} 
          placeholder="Дополнительная информация о смене" 
          rows={3}
        />
      </div>
      
      <Button onClick={onSubmit} className="w-full">
        {editingSchedule ? "Сохранить изменения" : "Создать смену"}
      </Button>
    </div>
  );
};
