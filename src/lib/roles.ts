import type { UserRole } from '@/types/api';

export type NormalizedRole = 'admin' | 'manager' | 'user' | 'readonly' | 'operator';

export const normalizeRole = (role: UserRole | string): NormalizedRole => {
  if (role === 'ADMIN' || role === 'admin') return 'admin';
  if (role === 'manager') return 'manager';
  if (role === 'readonly') return 'readonly';
  if (role === 'OPERATOR') return 'operator';
  return 'user';
};

export const isAdminRole = (role: UserRole | string) => normalizeRole(role) === 'admin';
export const isReadOnlyRole = (role: UserRole | string) => normalizeRole(role) === 'readonly';

export const roleLabel = (role: UserRole | string): string => {
  const normalized = normalizeRole(role);
  if (normalized === 'admin') return 'Administrador';
  if (normalized === 'manager') return 'Gestor';
  if (normalized === 'readonly') return 'Somente leitura';
  if (normalized === 'operator') return 'Operador';
  return 'Usuário';
};

export const roleToApi = (role: UserRole | string): 'admin' | 'manager' | 'user' | 'readonly' => {
  const normalized = normalizeRole(role);
  if (normalized === 'admin') return 'admin';
  if (normalized === 'manager') return 'manager';
  if (normalized === 'readonly') return 'readonly';
  return 'user';
};
