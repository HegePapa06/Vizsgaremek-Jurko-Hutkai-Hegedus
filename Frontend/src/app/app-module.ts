import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { RegisterComponent } from './register/register';
import { LoginComponent } from './login/login';
import { HomepageComponent } from './homepage/homepage';
import { Oktatok } from './oktatok/oktatok';
import { OrarendComponent } from './orarend/orarend';
import { Vasarlas } from './vasarlas/vasarlas';



@NgModule({
  declarations: [
    App,
    
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    RegisterComponent,  
    LoginComponent,
    Oktatok,
    HomepageComponent,  
    OrarendComponent,  
    Vasarlas,
  ],
  providers: [],
  bootstrap: [App]
})
export class AppModule {}
