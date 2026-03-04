// app.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: false
})

export class AppComponent {
  constructor(private router: Router) {}

  // Ez a függvény ellenőrzi a tokent
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token'); // true, ha van token
  }

  // Kijelentkezés funkció
  logout() {
    localStorage.removeItem('token'); // Töröljük a tokent
    this.router.navigate(['/login']); // Visszük a loginra
  }
}