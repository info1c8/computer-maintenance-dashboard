import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { ImportExportDialog } from "@/components/ImportExportDialog";
import { clientService } from "@/services/clientService";
import { repairService } from "@/services/repairService";
import { Client } from "@/types";
import { toast } from "sonner";

import { ClientCard } from "./clients/ClientCard";
import { ClientStats } from "./clients/ClientStats";
import { ClientForm } from "./clients/ClientForm";
import { ClientDetails } from "./clients/ClientDetails";

const ClientsSection = () => {
  const [clients, setClients] = useState<Client[]>(clientService.getAll());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'vip' | 'regular' | 'new'>('all');
  const [sortBy, setSortBy] = useState<string>('name-asc');

  const repairs = repairService.getAll();

  const getClientSegment = (client: Client) => {
    if (client.totalSpent > 50000 || client.totalOrders > 10) return 'vip';
    if (client.totalOrders > 3) return 'regular';
    return 'new';
  };

  const filteredAndSortedClients = useMemo(() => {
    let result = clients;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        c.email.toLowerCase().includes(query) ||
        (c.address && c.address.toLowerCase().includes(query))
      );
    }

    if (segmentFilter !== 'all') {
      result = result.filter(c => getClientSegment(c) === segmentFilter);
    }

    const [sortField, sortOrder] = sortBy.split('-');
    result = [...result].sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          return sortOrder === 'asc' 
            ? aVal.localeCompare(bVal) 
            : bVal.localeCompare(aVal);
        case 'orders':
          aVal = a.totalOrders;
          bVal = b.totalOrders;
          break;
        case 'spent':
          aVal = a.totalSpent;
          bVal = b.totalSpent;
          break;
        case 'created':
          aVal = new Date(a.createdAt || 0).getTime();
          bVal = new Date(b.createdAt || 0).getTime();
          break;
        default:
          return 0;
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [clients, searchQuery, segmentFilter, sortBy]);

  const handleCreate = (data: any) => {
    clientService.create(data);
    setClients(clientService.getAll());
    setIsCreateOpen(false);
    toast.success('Клиент добавлен');
  };

  const handleUpdate = (data: any) => {
    if (!editingClient) return;
    clientService.update(editingClient.id, data);
    setClients(clientService.getAll());
    setEditingClient(null);
    toast.success('Клиент обновлён');
  };

  const handleDelete = (id: string) => {
    if (confirm("Удалить клиента? История заказов сохранится.")) {
      clientService.delete(id);
      setClients(clientService.getAll());
      setSelectedClient(null);
      toast.success('Клиент удалён');
    }
  };

  const getClientRepairs = (clientId: string) => {
    return repairs.filter(r => r.clientId === clientId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Icon name="Users" size={32} />
            Клиенты
          </h2>
          <p className="text-muted-foreground">
            База клиентов и история взаимодействий
          </p>
        </div>
        
        <div className="flex gap-2">
          <ImportExportDialog 
            data={clients} 
            onImport={(data) => {
              data.forEach(item => clientService.create(item));
              setClients(clientService.getAll());
            }}
            entity="clients"
          />
          <Button onClick={() => setIsCreateOpen(true)} size="lg">
            <Icon name="UserPlus" size={18} className="mr-2" />
            Добавить клиента
          </Button>
        </div>
      </div>

      <ClientStats clients={clients} />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Поиск по имени, телефону, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={segmentFilter} onValueChange={(v) => setSegmentFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Сегмент" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все сегменты</SelectItem>
            <SelectItem value="vip">VIP клиенты</SelectItem>
            <SelectItem value="regular">Постоянные</SelectItem>
            <SelectItem value="new">Новые</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">По имени А-Я</SelectItem>
            <SelectItem value="name-desc">По имени Я-А</SelectItem>
            <SelectItem value="orders-desc">По заказам ↓</SelectItem>
            <SelectItem value="spent-desc">По доходу ↓</SelectItem>
            <SelectItem value="created-desc">Сначала новые</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedClients.map(client => (
          <ClientCard
            key={client.id}
            client={client}
            onView={(c) => setSelectedClient(c)}
            onEdit={(c) => setEditingClient(c)}
            onDelete={handleDelete}
            repairCount={getClientRepairs(client.id).length}
          />
        ))}
      </div>

      {filteredAndSortedClients.length === 0 && (
        <div className="text-center py-12">
          <Icon name="UserX" size={64} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Клиенты не найдены</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || segmentFilter !== 'all'
              ? "Попробуйте изменить фильтры"
              : "Добавьте первого клиента"}
          </p>
        </div>
      )}

      <ClientForm
        open={isCreateOpen || !!editingClient}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingClient(null);
          }
        }}
        client={editingClient}
        onSubmit={editingClient ? handleUpdate : handleCreate}
        onCancel={() => {
          setIsCreateOpen(false);
          setEditingClient(null);
        }}
      />

      <ClientDetails
        open={!!selectedClient}
        onOpenChange={(open) => !open && setSelectedClient(null)}
        client={selectedClient}
        onEdit={() => {
          if (selectedClient) {
            setEditingClient(selectedClient);
            setSelectedClient(null);
          }
        }}
        repairs={selectedClient ? getClientRepairs(selectedClient.id) : []}
      />
    </div>
  );
};

export default ClientsSection;
