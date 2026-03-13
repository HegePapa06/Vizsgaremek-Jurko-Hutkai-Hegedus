import { Component, OnInit } from '@angular/core';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http'; 
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'countyFilter',
  standalone: true
})
export class CountyFilterPipe implements PipeTransform {
  transform(teachers: any[], county: string): any[] {
    if (!county) return teachers;
    return teachers.filter(t => t.county === county);
  }
}

@Component({
  selector: 'app-oktatok',
  templateUrl: './oktatok.html',
  styleUrls: ['./oktatok.css'],
  standalone: true,
  imports: [
    CommonModule,      
    HttpClientModule,
    FormsModule,
    CountyFilterPipe
  ]
})
export class Oktatok implements OnInit {
  teachers: any[] = [];
  loading = true;
  error = '';
  counties: string[] = [];
  selectedCounty: string = '';
  currentUser: any = null;
  studentTeacher: any = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const userJson = localStorage.getItem('user'); 
    if (userJson) {
      this.currentUser = JSON.parse(userJson);
    }

    if (!token) {
      this.error = 'Jelentkezz be újra!';
      this.loading = false;
      return;
    }

    this.loadTeachers();

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any[]>('http://localhost:3000/teachers', { headers }).subscribe({
      next: (data) => {
        this.teachers = data;
        this.counties = Array.from(new Set(data.map(t => t.county)));
        
        this.checkExistingRequest(user.id, headers);
      },
      error: (err) => {
        this.error = 'Hiba az adatok betöltésekor.';
        this.loading = false;
      }
    });
  }

checkExistingRequest(studentId: number, headers: HttpHeaders) {

this.http.get(`http://localhost:3000/student-request-status/${studentId}`, { headers })
  .subscribe({
    next: (data: any) => {
      console.log("Jelentkezés státusza:", data);
      this.studentTeacher = data;
      this.loading = false;
    },
    error: (err) => {
      console.error("Hiba történt:", err);
      this.studentTeacher = null;
      this.loading = false;
    }
  });
  }

  applyToTeacher(teacherId: number) {
    if (this.studentTeacher) {
      alert("Már van aktív jelentkezésed vagy oktatód! Nem jelentkezhetsz máshoz.");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user")!);
    const token = localStorage.getItem("token");
    const headers = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    });

    this.http.post("http://localhost:3000/teachers/apply", { 
      studentId: Number(user.id),
      teacherId: Number(teacherId)
    }, { headers }).subscribe({
      next: (res: any) => {
        alert("Sikeres jelentkezés!");
        this.studentTeacher = { teacherId: teacherId, status: 'pending' };
      },
      error: (err) => alert("Hiba a jelentkezés során!")
    });
  }

  loadTeachers() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any[]>('http://localhost:3000/teachers', { headers }).subscribe({
      next: (data) => {
        this.teachers = data;
        this.counties = Array.from(new Set(data.map(t => t.county)));
        
        this.checkExistingRequest(user.id, headers);
      },
      error: (err) => {
        this.error = 'Hiba az adatok betöltésekor.';
        this.loading = false;
      }
    });
  }
}