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
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onRegister() {

  if (!this.phone || this.phone.length < 11 || this.phone.length > 12) {
      this.message = 'Hiba: A telefonszám 11-12 karakter hosszú kell legyen! (Pl: +36301234567)';
      alert(this.message);
      return; 
  }
  
  if (!this.email.toLowerCase().endsWith('@gmail.com')) {
    alert('Hiba: Csak @gmail.com végződésű email címmel regisztrálhatsz!');
    return;
  }
  
  const formData = new FormData();
  formData.append('username', this.username);
  formData.append('email', this.email);
  formData.append('password', this.password);
  formData.append('role', this.role);
  formData.append('teacherCode', this.teacherCode);
  formData.append('county', this.county);
  

  formData.append('city', this.city || 'Nincs megadva'); 

  formData.append('bio', this.bio);
  formData.append('phone', this.phone);

  if (this.selectedFile) {
    formData.append('photo', this.selectedFile);
  }

  console.log("Küldött adatok ellenőrzése...");

  this.http.post('http://localhost:3000/register', formData).subscribe({
    next: (res: any) => {
      this.message = res.message;
      this.router.navigate(['/login']);
    },
    error: (err) => {
      console.error("Regisztrációs hiba:", err);
      this.message = err.error?.message || 'Hiba történt a regisztráció során.';
    }
  });
}
}