import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount?: number;
  isSystem?: boolean;
}

interface RoleCardProps {
  role: Role;
  allPermissions: Permission[];
  onEdit?: (role: Role) => void;
  onDelete?: (id: string) => void;
}

export const RoleCard = ({ role, allPermissions, onEdit, onDelete }: RoleCardProps) => {
  const assignedPermissions = allPermissions.filter(p => role.permissions.includes(p.id));
  
  return (
    <Card className="hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{role.name}</h3>
              {role.isSystem && (
                <Badge variant="outline" className="flex-shrink-0">
                  <Icon name="Lock" size={12} className="mr-1" />
                  Системная
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{role.description}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
          <div className="flex items-center gap-2">
            <Icon name="Shield" size={18} className="text-primary" />
            <span className="text-sm font-medium">Прав доступа</span>
          </div>
          <Badge variant="secondary">{assignedPermissions.length}</Badge>
        </div>

        {role.userCount !== undefined && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2">
              <Icon name="Users" size={18} className="text-blue-600" />
              <span className="text-sm font-medium">Пользователей</span>
            </div>
            <Badge variant="secondary">{role.userCount}</Badge>
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Основные права:</p>
          <div className="flex flex-wrap gap-1">
            {assignedPermissions.slice(0, 3).map(perm => (
              <Badge key={perm.id} variant="outline" className="text-xs">
                {perm.name}
              </Badge>
            ))}
            {assignedPermissions.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{assignedPermissions.length - 3}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t">
          {onEdit && (
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(role)}>
              <Icon name="Edit" size={14} className="mr-1" />
              Редактировать
            </Button>
          )}
          {onDelete && !role.isSystem && (
            <Button size="sm" variant="outline" onClick={() => onDelete(role.id)}>
              <Icon name="Trash2" size={14} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
