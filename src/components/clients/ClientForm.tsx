import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import { Client } from "@/types";

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const ClientForm = ({ open, onOpenChange, client, onSubmit, onCancel }: ClientFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    company: "",
    taxId: "",
    discountPercent: 0
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address || "",
        notes: client.notes || "",
        company: (client as any).company || "",
        taxId: (client as any).taxId || "",
        discountPercent: (client as any).discountPercent || 0
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
        company: "",
        taxId: "",
        discountPercent: 0
      });
    }
  }, [client]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name={client ? "Edit" : "UserPlus"} size={20} />
            {client ? "Редактировать клиента" : "Добавить клиента"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="main" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="main">Основное</TabsTrigger>
              <TabsTrigger value="business">Бизнес</TabsTrigger>
              <TabsTrigger value="additional">Дополнительно</TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <Icon name="User" size={14} className="inline mr-1" />
                  ФИО *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Icon name="Phone" size={14} className="inline mr-1" />
                    Телефон *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+7 (999) 123-45-67"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Icon name="Mail" size={14} className="inline mr-1" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="client@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  <Icon name="MapPin" size={14} className="inline mr-1" />
                  Адрес
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="г. Москва, ул. Ленина, д. 1"
                />
              </div>
            </TabsContent>

            <TabsContent value="business" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="company">
                  <Icon name="Building2" size={14} className="inline mr-1" />
                  Компания
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  placeholder="ООО Рога и Копыта"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">
                  <Icon name="Hash" size={14} className="inline mr-1" />
                  ИНН
                </Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => updateField('taxId', e.target.value)}
                  placeholder="1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountPercent">
                  <Icon name="Percent" size={14} className="inline mr-1" />
                  Процент скидки
                </Label>
                <Input
                  id="discountPercent"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountPercent}
                  onChange={(e) => updateField('discountPercent', Number(e.target.value))}
                />
              </div>
            </TabsContent>

            <TabsContent value="additional" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="notes">
                  <Icon name="FileText" size={14} className="inline mr-1" />
                  Заметки
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Дополнительная информация о клиенте..."
                  rows={6}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              <Icon name="X" size={16} className="mr-2" />
              Отмена
            </Button>
            <Button type="submit">
              <Icon name={client ? "Save" : "Plus"} size={16} className="mr-2" />
              {client ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
