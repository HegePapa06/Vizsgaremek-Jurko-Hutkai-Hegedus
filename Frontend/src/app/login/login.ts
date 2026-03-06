import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email = '';
  password = '';
  message = '';

  constructor(private http: HttpClient, private router: Router) {}  
  
  
  onLogin() {
    const data = { email: this.email, password: this.password };

    this.http.post('http://localhost:3000/login', data).subscribe({
      next: (res: any) => {

       
        console.log("LOGIN RESPONSE:", JSON.stringify(res, null, 2));

        
        localStorage.setItem('token', res.token);
        console.log('LOCAL STORAGE TOKEN:', localStorage.getItem('token'));

        
        localStorage.setItem('user', JSON.stringify(res.user));
        console.log('LOCAL STORAGE USER:', localStorage.getItem('user'));

        localStorage.setItem('role', res.user.role);


        this.router.navigate(['/home']);
      },
      error: () => { this.message = 'Hibás email vagy jelszó!'; }
    });
  }

  
  getProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.message = 'Nincs token, előbb jelentkezz be!';
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get('http://localhost:3000/profile', { headers }).subscribe({
      next: (res: any) => {
        console.log(res);
        this.message = 'Profil sikeresen lekérve! Nézd meg a konzolt.';
      },
      error: (err) => {
        console.error(err);
        this.message = 'Hiba a profil lekérése során!';
      }
    });
  }

  goRegister() {
    this.router.navigate(['/register']);
  }
}
