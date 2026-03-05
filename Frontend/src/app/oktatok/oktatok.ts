import { Component, OnInit } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any[]>('http://localhost:3000/teachers').subscribe({
      next: (data) => {
        this.teachers = data;
        this.loading = false;
        this.counties = Array.from(new Set(data.map(t => t.county)));
      },
      error: (err) => {
        this.error = 'Hiba történt az oktatók betöltésekor!';
        this.loading = false;
      }
    });
  }
  applyToTeacher(teacherId: number) {
  const user = JSON.parse(localStorage.getItem("user")!);
  const studentId = user?.id;

  if (!studentId) {
    alert("Hiba: nincs bejelentkezett felhasználó!");
    return;
  }

  this.http.post("http://localhost:3000/apply-teacher", {
    studentId: Number(studentId),
    teacherId: Number(teacherId)
  }, {
    headers: { 'Content-Type': 'application/json' }
  }).subscribe({
    next: (res: any) => {
      alert("Sikeres jelentkezés!");
      console.log(res);

      const index = this.teachers.findIndex(t => t.id === teacherId);
      if (index !== -1) {
        this.teachers[index].applied = true;
      }
    },
    error: (err) => {
      console.error("Hiba a jelentkezés során:", err);
      alert("Hiba történt a jelentkezés során!");
    }
  });
}



}


