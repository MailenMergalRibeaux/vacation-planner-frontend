import { Routes } from '@angular/router';
import { UserListComponent } from './pages/user-list/user-list.component';
import { UserFormComponent } from './pages/user-form/user-form.component';

export const USERS_ROUTES: Routes = [
  {
    path: 'neu',
    component: UserFormComponent
  },
  {
    path: ':id/bearbeiten',
    component: UserFormComponent
  },
  {
    path: '',
    pathMatch: 'full',
    component: UserListComponent
  }
];

