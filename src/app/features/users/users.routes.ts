import { Routes } from '@angular/router';
import { UserListComponent } from './pages/user-list/user-list.component';
import { UserFormComponent } from './pages/user-form/user-form.component';
import { adminGuard } from '@app/core/guards/admin.guard';

export const USERS_ROUTES: Routes = [
  {
    path: 'neu',
    canActivate: [adminGuard],
    component: UserFormComponent
  },
  {
    path: ':id/bearbeiten',
    canActivate: [adminGuard],
    component: UserFormComponent
  },
  {
    path: '',
    pathMatch: 'full',
    canActivate: [adminGuard],
    component: UserListComponent
  }
];

