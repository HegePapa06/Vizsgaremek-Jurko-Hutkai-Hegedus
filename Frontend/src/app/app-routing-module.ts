import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegisterComponent } from './register/register';
import { LoginComponent } from './login/login';
import { HomepageComponent } from './homepage/homepage';
import { Oktatok } from './oktatok/oktatok';
import { OrarendComponent } from './orarend/orarend';
import { Vasarlas } from './vasarlas/vasarlas';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: "home", component: HomepageComponent },
  { path: "oktatok", component: Oktatok },
  { path: 'orarend', component: OrarendComponent },
  { path: 'vasarlas', component: Vasarlas}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
