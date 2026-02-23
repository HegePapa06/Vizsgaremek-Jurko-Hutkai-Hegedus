import { Component } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  role = 'tanulo';
  teacherCode = '';
  county = '';
  city = ''; 
  bio = '';
  phone = '';
  selectedFile: File | null = null;
  message = '';

  constructor(private http: HttpClient, private router: Router) {}

  onRoleChange() {
    // Itt kezelheted, ha tanár választásakor extra mezőket akarsz mutatni (pl. város)
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onRegister() {
    const formData = new FormData();
    formData.append('username', this.username);
    formData.append('email', this.email);
    formData.append('password', this.password);
    formData.append('role', this.role);
    formData.append('teacherCode', this.teacherCode);
    formData.append('county', this.county);
    formData.append('bio', this.bio);
    formData.append('phone', this.phone);
    
    // Opcionális: csak akkor küldjük a várost, ha be van töltve
    if (this.city) {
      formData.append('city', this.city);
    }

    if (this.selectedFile) {
      formData.append('photo', this.selectedFile);
    }

    this.http.post('http://localhost:3000/register', formData).subscribe({
      next: (res: any) => {
        this.message = res.message;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error("Regisztrációs hiba:", err);
        this.message = 'Hiba történt a regisztráció során.';
      }
    });
  }
}