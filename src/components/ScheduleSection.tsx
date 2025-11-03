import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { scheduleService } from "@/services/scheduleService";
import { technicianService } from "@/services/technicianService";
import { repairService } from "@/services/repairService";
import { Schedule } from "@/types";
import { toast } from "sonner";

import { ScheduleStatsCards } from "./schedule/ScheduleStatsCards";
import { ScheduleForm } from "./schedule/ScheduleForm";
import { WeekView } from "./schedule/WeekView";
import { ListView } from "./schedule/ListView";

const ScheduleSection = () => {
  const [schedules, setSchedules] = useState<Schedule[]>(scheduleService.getAll());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [viewMode, setViewMode] = useState<"week" | "month" | "list">("week");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterTechnicianId, setFilterTechnicianId] = useState<string>("");

  const technicians = technicianService.getAll();
  const repairs = repairService.getAll();

  const [formData, setFormData] = useState({
    technicianId: "",
    date: new Date(),
    startTime: "09:00",
    endTime: "18:00",
    breakStart: "13:00",
    breakEnd: "14:00",
    notes: "",
    isRecurring: false,
    recurringDays: [] as number[]
  });

  const groupSchedulesByDate = () => {
    const grouped: { [key: string]: Schedule[] } = {};
    let filteredSchedules = schedules;

    if (filterTechnicianId) {
      filteredSchedules = schedules.filter(s => s.technicianId === filterTechnicianId);
    }

    filteredSchedules.forEach(schedule => {
      const dateKey = schedule.date.toLocaleDateString('ru-RU');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(schedule);
    });
    return grouped;
  };

  const getWeekSchedules = () => {
    const weekStart = new Date(selectedDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    
    const weekSchedules = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const daySchedules = schedules.filter(s => 
        s.date.toDateString() === date.toDateString() &&
        (!filterTechnicianId || s.technicianId === filterTechnicianId)
      );
      weekSchedules.push({ date, schedules: daySchedules });
    }
    return weekSchedules;
  };

  const getScheduleStats = useMemo(() => {
    const totalHours = schedules.reduce((sum, schedule) => {
      const [startH, startM] = schedule.startTime.split(':').map(Number);
      const [endH, endM] = schedule.endTime.split(':').map(Number);
      const hours = (endH * 60 + endM - startH * 60 - startM) / 60;
      
      if (schedule.breakStart && schedule.breakEnd) {
        const [breakStartH, breakStartM] = schedule.breakStart.split(':').map(Number);
        const [breakEndH, breakEndM] = schedule.breakEnd.split(':').map(Number);
        const breakHours = (breakEndH * 60 + breakEndM - breakStartH * 60 - breakStartM) / 60;
        return sum + hours - breakHours;
      }
      return sum + hours;
    }, 0);

    const avgHoursPerDay = schedules.length > 0 ? totalHours / schedules.length : 0;
    
    const techWorkload: { [key: string]: number } = {};
    schedules.forEach(schedule => {
      if (!techWorkload[schedule.technicianName]) {
        techWorkload[schedule.technicianName] = 0;
      }
      techWorkload[schedule.technicianName]++;
    });

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      avgHoursPerDay: Math.round(avgHoursPerDay * 10) / 10,
      mostBusyTechnician: Object.keys(techWorkload).sort((a, b) => techWorkload[b] - techWorkload[a])[0] || '-',
      techWorkload
    };
  }, [schedules]);

  const getTechnicianRepairsForDate = (techId: string, date: Date) => {
    return repairs.filter(r => 
      r.technicianId === techId && 
      r.scheduledDate && 
      new Date(r.scheduledDate).toDateString() === date.toDateString()
    );
  };

  const groupedSchedules = groupSchedulesByDate();

  const handleCreate = () => {
    const technician = technicians.find(t => t.id === formData.technicianId);
    if (!technician) {
      toast.error("Выберите техника");
      return;
    }

    if (formData.isRecurring && formData.recurringDays.length > 0) {
      const nextMonth = new Date(formData.date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      let created = 0;
      for (let d = new Date(formData.date); d <= nextMonth; d.setDate(d.getDate() + 1)) {
        if (formData.recurringDays.includes(d.getDay())) {
          scheduleService.create({
            ...formData,
            date: new Date(d),
            technicianName: technician.name
          });
          created++;
        }
      }
      toast.success(`Создано ${created} смен`);
    } else {
      scheduleService.create({
        ...formData,
        technicianName: technician.name
      });
      toast.success("Смена создана");
    }

    setSchedules(scheduleService.getAll());
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingSchedule) return;
    
    const technician = technicians.find(t => t.id === formData.technicianId);
    if (!technician) {
      toast.error("Выберите техника");
      return;
    }

    scheduleService.update(editingSchedule.id, {
      ...formData,
      technicianName: technician.name
    });
    setSchedules(scheduleService.getAll());
    setEditingSchedule(null);
    resetForm();
    toast.success("Смена обновлена");
  };

  const handleDelete = (id: string) => {
    if (confirm("Удалить смену?")) {
      scheduleService.delete(id);
      setSchedules(scheduleService.getAll());
      toast.success("Смена удалена");
    }
  };

  const handleDuplicate = (schedule: Schedule) => {
    const newDate = new Date(schedule.date);
    newDate.setDate(newDate.getDate() + 1);
    
    scheduleService.create({
      ...schedule,
      date: newDate
    });
    setSchedules(scheduleService.getAll());
    toast.success("Смена дублирована на следующий день");
  };

  const resetForm = () => {
    setFormData({
      technicianId: "",
      date: new Date(),
      startTime: "09:00",
      endTime: "18:00",
      breakStart: "13:00",
      breakEnd: "14:00",
      notes: "",
      isRecurring: false,
      recurringDays: []
    });
  };

  const openEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      technicianId: schedule.technicianId,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      breakStart: schedule.breakStart || "13:00",
      breakEnd: schedule.breakEnd || "14:00",
      notes: schedule.notes || "",
      isRecurring: false,
      recurringDays: []
    });
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">График работы</h2>
          <p className="text-muted-foreground">Планирование смен и рабочего времени техников</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setEditingSchedule(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Icon name="Plus" className="h-4 w-4" />
                Добавить смену
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSchedule ? "Редактировать смену" : "Новая смена"}</DialogTitle>
              </DialogHeader>
              <ScheduleForm
                formData={formData}
                setFormData={setFormData}
                technicians={technicians}
                editingSchedule={editingSchedule}
                onSubmit={editingSchedule ? handleUpdate : handleCreate}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ScheduleStatsCards
        totalSchedules={schedules.length}
        stats={getScheduleStats}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            onClick={() => setViewMode("week")}
            size="sm"
          >
            <Icon name="CalendarDays" className="h-4 w-4 mr-2" />
            Неделя
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
            size="sm"
          >
            <Icon name="List" className="h-4 w-4 mr-2" />
            Список
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterTechnicianId} onValueChange={setFilterTechnicianId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Все техники" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Все техники</SelectItem>
              {technicians.map(tech => (
                <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {viewMode === "week" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() - 7);
                  setSelectedDate(newDate);
                }}
              >
                <Icon name="ChevronLeft" className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {selectedDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() + 7);
                  setSelectedDate(newDate);
                }}
              >
                <Icon name="ChevronRight" className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {viewMode === "week" && (
        <WeekView
          weekSchedules={getWeekSchedules()}
          getTechnicianRepairsForDate={getTechnicianRepairsForDate}
          onEdit={openEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      )}

      {viewMode === "list" && (
        <ListView
          groupedSchedules={groupedSchedules}
          getTechnicianRepairsForDate={getTechnicianRepairsForDate}
          onEdit={openEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      )}
    </div>
  );
};

export default ScheduleSection;
