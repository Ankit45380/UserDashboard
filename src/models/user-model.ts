export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
}

export interface RoleDistribution {
  role: string;
  count: number;
}
