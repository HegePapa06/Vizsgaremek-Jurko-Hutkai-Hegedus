import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  user: any = {};
  studentStatus: any = null;
  unsubscriptions: any[] = []; 
  message = '';
  isEditing = false; 
  showUnsubscribeModal = false;
  unsubscribeReason = '';
  selectedFile: File | null = null;

  showPasswordChange = false;
  passwords = {
    old: '',
    new: '',
    confirm: ''
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get('http://localhost:3000/me', { headers }).subscribe({
      next: (res: any) => {
        this.user = res;
        if (this.user.role === 'tanulo') {
          this.loadStudentStatus();
        } else if (this.user.role === 'tanar') {
          this.loadUnsubscriptions();
        }
      },
      error: (err) => {
        console.error("Hiba!", err);
        this.message = 'Hiba a letöltésnél.';
      }
    });
  }

  loadStudentStatus() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get(`http://localhost:3000/student-request-status/${this.user.id}`, { headers }).subscribe({
      next: (res: any) => {
        this.studentStatus = res;
      },
      error: (err) => console.error("Hiba a státusz lekérésekor:", err)
    });
  }

  loadUnsubscriptions() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get('http://localhost:3000/my-unsubscriptions', { headers }).subscribe({
      next: (res: any) => {
        this.unsubscriptions = res;
      },
      error: (err) => console.error("Hiba az indoklások lekérésekor:", err)
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    
    if (!this.isEditing) {
      this.selectedFile = null;
      this.showPasswordChange = false; 
      this.passwords = { old: '', new: '', confirm: '' }; 
      this.loadProfile(); 
    }
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  uploadProfilePicture() {
    if (this.user.role !== 'tanar') {
        alert('Tanulók nem tölthetnek fel képet.');
        return;
    }

    if (!this.selectedFile) {
      alert('Kérlek, válassz ki egy fájlt először!');
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const formData = new FormData();
    formData.append('photo', this.selectedFile);

    this.http.post('http://localhost:3000/update-profile-picture', formData, { headers }).subscribe({
      next: (res: any) => {
        alert('Profilkép sikeresen frissítve!');
        this.selectedFile = null;
        this.loadProfile();
      },
      error: (err) => alert('Hiba történt a kép feltöltése során.')
    });
  }

  saveProfile() {
    if (this.user.phone) {
      const phoneLen = this.user.phone.replace(/\s/g, "").length;
      if (phoneLen < 11 || phoneLen > 12) {
        alert('Hiba: A telefonszám hossza nem megfelelő!');
        return;
      }
    }

    if (!this.user.email || !this.user.email.toLowerCase().endsWith('@gmail.com')) {
      alert('Hiba: Érvényes @gmail.com cím szükséges!');
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.put('http://localhost:3000/update', this.user, { headers }).subscribe({
      next: (res: any) => {
        alert('Változtatások sikeresen elmentve!');
        this.isEditing = false;
        this.showPasswordChange = false;
        this.loadProfile();
      },
      error: (err) => alert('Hiba történt a mentés során.')
    });
  }

  changePassword() {
    if (!this.passwords.old || !this.passwords.new || !this.passwords.confirm) {
      alert('Kérlek töltsd ki az összes jelszó mezőt!');
      return;
    }

    if (this.passwords.new.length < 6) {
      alert('Az új jelszónak legalább 6 karakternek kell lennie!');
      return;
    }

    if (this.passwords.new !== this.passwords.confirm) {
      alert('Az új jelszavak nem egyeznek meg!');
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    const body = {
      oldPassword: this.passwords.old,
      newPassword: this.passwords.new
    };

    this.http.post('http://localhost:3000/change-password', body, { headers }).subscribe({
      next: (res: any) => {
        alert('Jelszó sikeresen megváltoztatva!');
        this.showPasswordChange = false;
        this.passwords = { old: '', new: '', confirm: '' };
      },
      error: (err) => alert(err.error.message || 'Hiba történt a jelszó módosítása közben.')
    });
  }

  confirmUnsubscribe() {
    console.log("Kiiratkozás gomb megnyomva!"); 
  console.log("Indoklás:", this.unsubscribeReason);
  console.log("TeacherID:", this.studentStatus?.teacherId);
    if (!this.unsubscribeReason.trim()) {
      alert('Az indoklás megadása kötelező a kiiratkozáshoz!');
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    if (this.studentStatus && this.studentStatus.teacherId) {
      this.http.post(`http://localhost:3000/unsubscribe/${this.studentStatus.teacherId}`, 
        { reason: this.unsubscribeReason }, 
        { headers }).subscribe({
        next: () => {
          alert('Sikeresen kiiratkoztál!');
          this.closeUnsubscribeModal();
          this.studentStatus = null;
          this.loadProfile();
        },
        error: (err) => alert('Hiba a kiiratkozáskor.')
      });
    }
  }

  deleteUnsubscription(id: number) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.delete(`http://localhost:3000/unsubscriptions/${id}`, { headers }).subscribe({
      next: () => {
        this.unsubscriptions = this.unsubscriptions.filter(u => u.id !== id);
      },
      error: (err) => alert('Hiba az indoklás törlésekor.')
    });
  }

  openUnsubscribeModal() { this.showUnsubscribeModal = true; }
  closeUnsubscribeModal() { this.showUnsubscribeModal = false; this.unsubscribeReason = ''; }
}