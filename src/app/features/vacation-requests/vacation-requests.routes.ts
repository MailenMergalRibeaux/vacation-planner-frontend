import { Routes } from '@angular/router';
import { VacationRequestListComponent } from './pages/vacation-request-list/vacation-request-list.component';
import { VacationRequestFormComponent } from './pages/vacation-request-form/vacation-request-form.component';
import { VacationRequestDetailComponent } from './pages/vacation-request-detail/vacation-request-detail.component';

export const VACATION_REQUESTS_ROUTES: Routes = [
  {
    path: '',
    component: VacationRequestListComponent
  },
  {
    path: 'neu',
    component: VacationRequestFormComponent
  },
  {
    path: ':id',
    component: VacationRequestDetailComponent
  },
  {
    path: ':id/bearbeiten',
    component: VacationRequestFormComponent
  }
];
