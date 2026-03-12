/**
 * Permission Management Component
 * Manage custom roles and granular permissions
 */

"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Shield,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Users,
  Lock,
  Building,
} from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface CustomRole {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Array<{
    id: string;
    permissionId: string;
    granted: boolean;
    permission: Permission;
  }>;
}

interface PropertyAccess {
  id: string;
  userId: string;
  propertyId: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageReservations: boolean;
  canManageReports: boolean;
  canManageSettings: boolean;
  property: {
    id: string;
    name: string;
    type: string | null;
  };
}

export default function PermissionManagement() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [propertyAccessList, setPropertyAccessList] = useState<
    PropertyAccess[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load permissions
      const permRes = await fetch("/api/permissions");
      const permData = await permRes.json();
      if (permData.permissions) {
        setPermissions(permData.permissions);
      }

      // Load roles
      const rolesRes = await fetch("/api/roles");
      const rolesData = await rolesRes.json();
      if (rolesData.roles) {
        setRoles(rolesData.roles);
      }

      // Load property access
      const accessRes = await fetch("/api/property-access");
      const accessData = await accessRes.json();
      if (accessData.accessList) {
        setPropertyAccessList(accessData.accessList);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Napaka pri nalaganju podatkov");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error("Ime role je obvezno");
      return;
    }

    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoleName,
          description: newRoleDescription,
          permissionIds: selectedPermissions,
        }),
      });

      const data = await res.json();

      if (data.role) {
        setRoles([...roles, data.role]);
        setNewRoleName("");
        setNewRoleDescription("");
        setSelectedPermissions([]);
        setShowCreateRole(false);
        toast.success("Role uspešno ustvarjena");
      } else {
        toast.error(data.error || "Napaka pri ustvarjanju role");
      }
    } catch (error) {
      console.error("Create role error:", error);
      toast.error("Napaka pri ustvarjanju role");
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Nalaganje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🔐 Permission Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upravljajte custom role in granular permissions za vaš team.
        </p>
      </div>

      {/* Custom Roles */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Custom Role
          </h2>
          <button
            onClick={() => setShowCreateRole(!showCreateRole)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Role
          </button>
        </div>

        {/* Create Role Form */}
        {showCreateRole && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
            <h3 className="text-md font-semibold mb-3">Ustvari Novo Role</h3>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ime Role *
                </label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="npr. Front Desk Manager"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Opis
                </label>
                <textarea
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Kratek opis role..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Permission Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Izberi Permissions
              </label>

              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div
                  key={category}
                  className="mb-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 capitalize">
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {perms.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">
                          {perm.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreateRole}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Ustvari Role
              </button>
              <button
                onClick={() => {
                  setShowCreateRole(false);
                  setNewRoleName("");
                  setNewRoleDescription("");
                  setSelectedPermissions([]);
                }}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium"
              >
                Prekliči
              </button>
            </div>
          </div>
        )}

        {/* Roles List */}
        <div className="space-y-3">
          {roles.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Še nimate custom rolov. Ustvarite novo role zgoraj.
            </p>
          ) : (
            roles.map((role) => (
              <div
                key={role.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                      {role.name}
                    </h3>
                    {role.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {role.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      {role.permissions.length} permissions
                    </span>
                    {!role.isSystem && (
                      <button className="text-red-600 hover:text-red-700 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {role.permissions.map((rp) => (
                    <span
                      key={rp.id}
                      className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                    >
                      {rp.permission.name}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Property Access */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Building className="w-5 h-5" />
          Property Access Control
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Property
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  View
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Edit
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Delete
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reservations
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reports
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Settings
                </th>
              </tr>
            </thead>
            <tbody>
              {propertyAccessList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-sm text-gray-500">
                    Še nimate nastavljenega property accessa.
                  </td>
                </tr>
              ) : (
                propertyAccessList.map((access) => (
                  <tr
                    key={access.id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {access.property.name}
                      <span className="text-xs text-gray-500 ml-2">
                        ({access.property.type})
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      {access.canView ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-600 mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {access.canEdit ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-600 mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {access.canDelete ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-600 mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {access.canManageReservations ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-600 mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {access.canManageReports ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-600 mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {access.canManageSettings ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Default Permissions Reference */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 Default Permissions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <strong>ADMIN:</strong> Vsi permissions avtomatsko
          </div>
          <div>
            <strong>EDITOR:</strong> canView, canEdit na večini resource-ov
          </div>
          <div>
            <strong>VIEWER:</strong> Samo canView permissions
          </div>
          <div>
            <strong>Custom Roles:</strong> Po meri izbrani permissions zgoraj
          </div>
        </div>
      </div>
    </div>
  );
}
