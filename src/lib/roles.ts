import type { UserRole } from '@/types/api';

export const normalizeRole = (role: UserRole | string): 'admin' | 'manager' | 'user' | 'operator' => {
  if (role === 'ADMIN' || role === 'admin') return 'admin';
  if (role === 'manager') return 'manager';
  if (role === 'OPERATOR') return 'operator';
  return 'user';
};

export const roleLabel = (role: UserRole | string): string => {
  const normalized = normalizeRole(role);
  if (normalized === 'admin') return 'Administrador';
  if (normalized === 'manager') return 'Gestor';
  if (normalized === 'operator') return 'Operador';
  return 'Usuário';
};

export const roleToApi = (role: UserRole | string): 'admin' | 'manager' | 'user' => {
  const normalized = normalizeRole(role);
  if (normalized === 'admin') return 'admin';
  if (normalized === 'manager') return 'manager';
  return 'user';
};
