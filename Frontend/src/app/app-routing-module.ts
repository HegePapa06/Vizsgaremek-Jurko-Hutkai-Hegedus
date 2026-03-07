import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegisterComponent } from './register/register';
import { LoginComponent } from './login/login';
import { HomepageComponent } from './homepage/homepage';
import { Oktatok } from './oktatok/oktatok';
import { OrarendComponent } from './orarend/orarend';
import { Vasarlas } from './vasarlas/vasarlas';
import { authGuard } from './auth-guard';
import { Profile } from './profile/profile';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: "home", component: HomepageComponent },
  { path: "oktatok", component: Oktatok, canActivate: [authGuard] },
  { path: 'orarend', component: OrarendComponent, canActivate: [authGuard] },
  { path: 'vasarlas', component: Vasarlas, canActivate: [authGuard]},
  { path: 'profile', component: Profile, canActivate: [authGuard]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
