import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, RoleDistribution } from '../../models/user-model';

@Injectable({
providedIn: 'root'
})
export class UserService {
private users = new BehaviorSubject<User[]>(this.loadUsersFromStorage());
users$ = this.users.asObservable();

constructor() {}

private loadUsersFromStorage(): User[] {
  const stored = localStorage.getItem('users_data');
  if (stored) {
    return JSON.parse(stored);
  }
  return [
    { id: 1, name: 'Lionel Messi', email: 'messi@example.com', role: 'Admin' },
    { id: 2, name: 'Luke Shaw', email: 'luke@example.com', role: 'Editor' },
    { id: 3, name: 'Paul Pogba', email: 'pogba@example.com', role: 'Viewer' },
    { id: 1, name: 'Lionel Messi', email: 'messi@example.com', role: 'Admin' },
    { id: 2, name: 'Luke Shaw', email: 'luke@example.com', role: 'Editor' },
    { id: 3, name: 'Paul Pogba', email: 'pogba@example.com', role: 'Viewer' }
  ];
}

private saveUsersToStorage(users: User[]): void {
  localStorage.setItem('users_data', JSON.stringify(users));
}

getUsers(): Observable<User[]> {
  return this.users$;
}

addUser(user: Omit<User, 'id'>): void {
  const currentUsers = this.users.value;
  const newUser: User = {
    ...user,
    id: currentUsers.length > 0 ? Math.max(...currentUsers.map(u => u.id)) + 1 : 1
  };
  const updatedUsers = [...currentUsers, newUser];
  this.users.next(updatedUsers);
  this.saveUsersToStorage(updatedUsers);
}

deleteUser(id: number): void {
  const currentUsers = this.users.value;
  const updatedUsers = currentUsers.filter(user => user.id !== id);
  this.users.next(updatedUsers);
  this.saveUsersToStorage(updatedUsers);
}

getRoleDistribution(): Observable<RoleDistribution[]> {
  return new Observable(observer => {
    this.users$.subscribe(users => {
      const distribution = this.calculateRoleDistribution(users);
      observer.next(distribution);
    });
  });
}

private calculateRoleDistribution(users: User[]): RoleDistribution[] {
  const roles = ['Admin', 'Editor', 'Viewer'];
  return roles.map(role => ({
    role,
    count: users.filter(user => user.role === role).length
  }));
}
}