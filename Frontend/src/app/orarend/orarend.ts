import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Request {
  id: number;
  student: { id: number, username: string };
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

@Component({
  selector: 'app-orarend',
  standalone: true,
  templateUrl: './orarend.html',
  styleUrls: ['./orarend.css'],
  imports: [CommonModule, HttpClientModule, FormsModule]
})
export class OrarendComponent implements OnInit, OnDestroy {
  role: string | null = null;
  teacherId: number | null = null;

  requests: Request[] = [];
  startIndex = 0;
  visibleCount = 4;

  studentTeacher: any = null;

  apiUrl = 'http://localhost:3000';
  errorMessage = '';
  lessons: any[] = [];
  myStudents: any[] = [];
  teachers: any[] = [];

  showModal = false;
  modalDay = '';
  modalTime = '';
  selectedStudentId: number | null = null;

  days = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
  times: string[] = [];

  constructor(private http: HttpClient) {
    let hour = 8;
    while (hour <= 20) {
      const h = Math.floor(hour);
      const m = hour % 1 === 0 ? '00' : '30';
      this.times.push(`${h.toString().padStart(2,'0')}:${m}`);
      hour += 1.5;
    }
  }

  ngOnInit(): void {
  this.role = localStorage.getItem("role");
  const user = JSON.parse(localStorage.getItem("user") || 'null');
  
  if (user) {
    this.teacherId = user.id;
    
    this.loadStudentStats(); 

    if (this.role === 'tanar') {
      this.loadRequests();
      this.loadLessons();
      this.loadMyStudents();
    } else if (this.role === 'tanulo') {
      this.loadStudentTeacher(user.id);
      this.loadLessons();
      this.loadTeachers();
    }
  }
}

  ngOnDestroy(): void {}

  getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem("token");
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }

  get visibleRequests(): Request[] {
    return this.requests.slice(this.startIndex, this.startIndex + this.visibleCount);
  }

  nextSlide() { if (this.startIndex + this.visibleCount < this.requests.length) this.startIndex += this.visibleCount; }
  prevSlide() { if (this.startIndex - this.visibleCount >= 0) this.startIndex -= this.visibleCount; }

  loadRequests() {
    if (!this.teacherId) return;
    this.http.get<Request[]>(`${this.apiUrl}/teachers/requests/${this.teacherId}`, this.getAuthHeaders())
      .subscribe({
        next: data => this.requests = data,
        error: err => {
          console.error("Request error:", err);
          this.errorMessage = 'Hiba történt a kérések betöltésekor!';
        }
      });
  }

  acceptRequest(request: Request) {
    this.http.post(`${this.apiUrl}/teachers/requests/${request.id}/accept`, {}, this.getAuthHeaders())
      .subscribe(() => request.status = 'accepted');
  }

  rejectRequest(request: Request) {
    this.http.post(`${this.apiUrl}/teacher/requests/${request.id}/reject`, {}, this.getAuthHeaders())
      .subscribe(() => request.status = 'rejected');
  }

loadStudentTeacher(studentId: number) {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

  this.http.get(`http://localhost:3000/student-request-status/${studentId}`, { headers })
    .subscribe({
      next: (data: any) => {
        this.studentTeacher = data;
      },
      error: (err) => {
        console.error("Hiba az oktató lekérésekor:", err);
        this.studentTeacher = null;
      }
    });
}

  loadTeachers() {
    this.http.get<any[]>(`${this.apiUrl}/teachers`, this.getAuthHeaders())
      .subscribe({
        next: data => this.teachers = data,
        error: err => console.error("Teachers fetch error:", err)
      });
  }

readonly MAX_STUDENTS = 20;
get currentStudentCount(): number {
  return this.studentStats ? this.studentStats.length : 0;
}

get hasEmptySlot(): boolean {
  return this.currentStudentCount < this.MAX_STUDENTS;
}

isApplying: boolean = false;

applyToTeacher(teacherId: number) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user || this.role !== 'tanulo') return;

  if (this.studentTeacher) {
    alert("Már van aktív jelentkezésed vagy oktatód!");
    return;
  }

  if (!this.hasEmptySlot) {
    alert("Sajnos az oktatónál betelt a létszám!");
    return;
  }

  if (this.isApplying || this.studentTeacher) return;

  if (this.isApplying) return;
  this.isApplying = true; 

  const body = { studentId: user.id, teacherId: teacherId };
  
  this.http.post(`${this.apiUrl}/apply-teacher`, body, this.getAuthHeaders())
    .subscribe({
      next: (res: any) => {
        alert("Sikeres jelentkezés!");
        this.isApplying = false;
        this.loadStudentTeacher(user.id); 
      },
      error: err => {
        this.isApplying = false;
        
        if (err.status === 400) {
           this.loadStudentTeacher(user.id);
           console.warn("A szerver elutasította a duplikált jelentkezést.");
        } else {
           alert("Hiba a jelentkezés során!");
        }
      }
    });
}

  loadLessons() {
  const t = new Date().getTime();
  
  this.http.get<any[]>(`${this.apiUrl}/lessons?cacheBuster=${t}`, this.getAuthHeaders())
    .subscribe({
      next: (data) => {
        console.log("ADATOK ÉRKEZTEK A SZERVERRŐL:", data);
        
        const debugLesson = data.find(l => l.id === 74);
        if (debugLesson) {
          console.log("74-ES ÓRA STÁTUSZA A SZERVERRŐL:", debugLesson.status);
        }

        this.lessons = data.map(l => {
          const raw = new Date(l.date).toLocaleDateString('hu-HU', { weekday: 'long' });
          const day = raw.charAt(0).toUpperCase() + raw.slice(1);
          const lessonType = l.type ? String(l.type).toLowerCase().trim() : 'vezetés';

          return { 
            id: l.id,
            status: l.status, 
            date: l.date,
            startTime: l.startTime,
            day: day, 
            time: l.startTime, 
            studentId: Number(l.studentId || l.student_id),
            studentName: this.role === 'tanar' 
              ? (l.studentName || 'Ismeretlen diák') 
              : (lessonType === 'vizsga' ? 'VIZSGA' : 'Vezetés'),
            type: lessonType,
            examResult: l.examResult,
            note: l.note 
          };
        });
      },
      error: err => console.error("Hiba:", err)
    });
}
  loadMyStudents() {
    if (!this.teacherId) return;
    this.http.get<any[]>(`${this.apiUrl}/teacher/accepted-students/${this.teacherId}`, this.getAuthHeaders())
      .subscribe({
        next: data => {
          this.myStudents = data;
        },
        error: err => console.error("Accepted students fetch error:", err)
      });
  }

  openModal(day: string, time: string) {
    this.modalDay = day;
    this.modalTime = time;
    this.selectedStudentId = null;
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

selectedLessonType: string = 'vezetés'; 
selectedExamResult: string = ''; 
saveLesson() {
  if (!this.selectedStudentId || !this.teacherId) return;
  
  const student = this.studentStats.find(s => s.id === this.selectedStudentId);

  if (student && (student.hasLicense === true || student.hasLicense === 1)) {
    alert(`Hiba: ${student.username} már sikeresen levizsgázott! Nem írható be több óra vagy vizsga.`);
    this.closeModal();
    return;
  }

  
  if (student) {
    if (student.isExamReady && this.selectedLessonType !== 'vizsga') {
      alert(`Hiba: ${student.username} már teljesítette a 30 órát. Neki már csak vizsgát lehet beosztani!`);
      return; 
    }

    if (!student.isExamReady && this.selectedLessonType === 'vizsga') {
      alert(`Hiba: ${student.username} még nem vezetett 30 órát, nem mehet vizsgázni!`);
      return;
    }
  }
  

  if (this.selectedLessonType === 'vizsga') {
    if (student && student.completedHours < 30) {
      alert(`Hiba: ${student.username} még nem érte el a 30 órát (Jelenleg: ${student.completedHours})!`);
      return;
    }

    const hasActiveExam = this.lessons.some(l => 
      l.studentId === this.selectedStudentId && 
      l.type === 'vizsga' && 
      l.status === 'planned'
    );

    if (hasActiveExam) {
      alert("Hiba: Ennek a tanulónak már van egy aktív vizsgaidőpontja a naptárban!");
      return;
    }
  }
  

  const [hour, minute] = this.modalTime.split(':').map(Number);
  
  const today = new Date();
  const startOfThisWeek = this.getStartOfWeek(today);

  const targetDayIndex = this.days.indexOf(this.modalDay); 
  
  const start = new Date(startOfThisWeek);
  start.setDate(startOfThisWeek.getDate() + targetDayIndex + (this.selectedWeekOffset * 7));
  start.setHours(hour, minute, 0, 0);

  const end = new Date(start.getTime() + 90 * 60000);

  const body = {
    teacherId: this.teacherId,
    studentId: this.selectedStudentId,
    date: start.toISOString().split('T')[0], 
    startTime: this.modalTime,
    endTime: `${end.getHours().toString().padStart(2,'0')}:${end.getMinutes().toString().padStart(2,'0')}`,
    status: 'planned',
    type: this.selectedLessonType.toLowerCase().trim()
  };

  console.log("!!! MI MEGY A BACKENDRE? ->", body);

  this.http.post(`${this.apiUrl}/lessons`, body, this.getAuthHeaders())
    .subscribe({
      next: () => { 
        this.closeModal(); 
        this.loadLessons();
        this.loadStudentStats(); 
        this.selectedLessonType = 'vezetés';
      },
      error: err => {
        console.error("Lesson save error:", err);
        if (err.status === 400 && err.error.message) {
          alert(err.error.message);
        } else {
          alert("Hiba történt a mentés során!");
        }
      }
    });
}


hasPurchasedHours(studentId: number | null): boolean {
  if (!studentId) return false;
  const student = this.studentStats.find(s => s.id === studentId);
  return student ? (student.purchasedHours > 0) : false;
}


cancelLesson(lessonId: number) {
  const reason = prompt("Miért mondod le az órát? (Nem kötelező)");
  
  if (reason === null) return;

  const body = { cancelReason: reason };

  this.http.put(`${this.apiUrl}/lessons/${lessonId}/cancel`, body, this.getAuthHeaders())
    .subscribe({
      next: () => {
        alert("Óra lemondva!");
        this.loadLessons(); 
      },
      error: err => {
        console.error("Hiba a lemondásnál:", err);
        alert("Nem sikerült lemondani az órát.");
      }
    });
}

  onCellClick(day: string, time: string) {
    if (this.role === 'tanar') this.openModal(day, time);
  }

  showEditModal = false;
  selectedLesson: any = null;
  editModalDay = '';
  editModalTime = '';
  editModalEndTime = '';


  selectedWeekOffset: number = 0;
  handleCellClick(dayName: string, time: string, weekOffset: number) {
    console.log("KATTINTÁS TÖRTÉNT!");
  this.selectedWeekOffset = weekOffset;
  const lesson = this.getLesson(dayName, time, weekOffset);
  console.log("Megtalált óra:", lesson);

  if (!lesson || lesson.status === 'cancelled') {

  const student = this.myStudents.find(s => s.id === this.selectedStudentId);

  if (student && (student.hasLicense === true || student.hasLicense === 1)) {
    alert("Ennek a diáknak már sikeres vizsgája van, nem írható be több óra!");
    return;
  }
    this.onCellClick(dayName, time);
    return;
  }
  
  console.log("Kattintott óra adatai:", lesson);

  if (lesson.type === 'vizsga') {
    if (lesson.examResult || lesson.status === 'completed' || lesson.status === 'failed') {
      console.warn("STOP: Ez a vizsga már le van zárva! Státusz:", lesson.status);
      return; 
    }

    const now = new Date();
    const lessonDate = new Date(lesson.date); 
    const [hours, minutes] = lesson.startTime.split(':').map(Number);
    lessonDate.setHours(hours, minutes, 0, 0);

    if (now < lessonDate) {
      alert(`A vizsgaeredményt csak a vizsga kezdete után (${lesson.startTime}) lehet beírni!`);
      return; 
    }

    this.selectedLesson = lesson; 
    this.showExamResultModal = true; 
    return; 
  }

  const now = new Date();
  const lessonDate = new Date(lesson.date);
  const [hours, minutes] = lesson.startTime.split(':').map(Number);
  lessonDate.setHours(hours, minutes, 0, 0);

  if (now >= lessonDate) {
    console.log("Ez az óra már lezajlott.");
  } else {
    this.openEditModal(lesson);
  }
}

  openEditModal(lesson: any) {
    this.selectedLesson = lesson;
    this.editModalDay = lesson.day; 
    this.editModalTime = lesson.time;
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedLesson = null;
  }

  updateLesson() {
  if (!this.selectedLesson || !this.teacherId) return;

  const [hour, minute] = this.editModalTime.split(':').map(Number);
  const today = new Date();

  const targetDayIndex = this.days.indexOf(this.editModalDay);
  const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
  let daysToAdd = targetDayIndex - currentDayIndex;
  
  if (daysToAdd < 0) daysToAdd += 7;

  const start = new Date();
  start.setDate(today.getDate() + daysToAdd);
  start.setHours(hour, minute, 0, 0);

  const end = new Date(start.getTime() + 90 * 60000);

  const body = {
    day: start.toISOString().split('T')[0], 
    time: this.editModalTime,
    endTime: `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`,
    examResult: this.selectedLesson.examResult
  };

  this.http.put(`${this.apiUrl}/lessons/${this.selectedLesson.id}/move`, body, this.getAuthHeaders())
    .subscribe({
      next: () => {
        alert("Sikeres áthelyezés!");
        this.closeEditModal();
        this.loadLessons();
      },
      error: err => {
        console.error("Hiba:", err);
        if (err.status === 400 && err.error && err.error.message) {
          alert(err.error.message); 
        } else {
          alert("Hiba történt! Ellenőrizd a konzolt.");
        }
      }
    });
}
  studentStats: any[] = [];

  loadStudentStats() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return;
  
  const user = JSON.parse(userStr);
  
  const url = this.role === 'tanar' 
    ? `${this.apiUrl}/teachers/student-stats/${user.id}` 
    : `${this.apiUrl}/stats`;

  this.http.get<any>(url, this.getAuthHeaders())
    .subscribe({
      next: (data) => {
        console.log("Tanuló statisztika nyers adat:", data);
        
        if (this.role === 'tanulo' && data) {
          data.completedHours = data.completedLessons || 0; 
          data.requiredHours = 30; 
          
          if (!data.username) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            data.username = user.username || 'Tanuló';
          }
        }

        this.studentStats = Array.isArray(data) ? data : [data];
      },
      error: (err) => {
        console.error("Frontend statisztika hiba:", err);
      }
    });
}

removeStudent(studentId: number) {
  if (confirm('Biztosan el akarod távolítani ezt a diákot? A jövőbeli órái is törlődnek.')) {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    this.http.delete(`${this.apiUrl}/teachers/remove-student/${user.id}/${studentId}`, this.getAuthHeaders())
      .subscribe({
        next: () => {
          this.loadStudentStats();
          this.loadLessons();
          
          alert("Diák sikeresen eltávolítva.");
        },
        error: (err) => alert("Hiba a törlés során!")
      });
  }
}
activeWeek: number = 0; 

setWeek(weekIndex: number) {
  this.activeWeek = weekIndex;
}

  get acceptedStudents() { return this.myStudents || []; }

  currentWeekOffset: number = 0;

  getLesson(dayName: string, time: string, weekOffset: number = 0) {
  const today = new Date();
  const startOfThisWeek = this.getStartOfWeek(today);
  
  const targetWeekMonday = new Date(startOfThisWeek);
  targetWeekMonday.setDate(targetWeekMonday.getDate() + (weekOffset * 7));
  targetWeekMonday.setHours(0, 0, 0, 0);
  
  const targetWeekSunday = new Date(targetWeekMonday);
  targetWeekSunday.setDate(targetWeekSunday.getDate() + 7);
  targetWeekSunday.setHours(23, 59, 59, 999);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const myId = user.id ? Number(user.id) : null;

  const slotLessons = this.lessons.filter(l => {
    const lessonDate = new Date(l.date);
    const lessonDateOnly = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
    
    const hungarianDays = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
    const currentDayName = hungarianDays[lessonDate.getDay()];
    
    const isInWeek = lessonDate >= targetWeekMonday && lessonDate <= targetWeekSunday;
    const isSameTime = l.startTime === time;
    const isSameDay = currentDayName === dayName;
    
    const isVisible = this.role === 'tanulo' ? Number(l.studentId) === myId : true;

    return isInWeek && isSameDay && isSameTime && isVisible;
  });

  if (slotLessons.length === 0) return null;

  return slotLessons.find(l => l.status === 'planned') || 
         slotLessons.find(l => l.status === 'completed') || 
         slotLessons[0];
}

isStudentReady(studentId: number | null): boolean {
  if (!studentId) return false;
  const student = this.studentStats.find(s => s.id === studentId);
  return student ? student.isExamReady : false;
}

examResultValue: string = 'sikeres';
showExamResultModal: boolean = false;

submitExamResult() {
  if (!this.selectedLesson || !this.examResultValue) {
    alert("Kérlek válassz ki egy eredményt!");
    return;
  }

  const updateData = {
    status: 'completed',
    examResult: this.examResultValue
  };

  this.http.put(`${this.apiUrl}/lessons/${this.selectedLesson.id}/result`, updateData, this.getAuthHeaders())
    .subscribe({
      next: (res: any) => {
        console.log('Sikeres mentés a szerveren:', res);
        
        const index = this.lessons.findIndex(l => l.id === this.selectedLesson.id);
        if (index !== -1) {
          this.lessons[index].status = res.status;
          this.lessons[index].examResult = res.examResult;
        }

        this.showExamResultModal = false;
        
        this.loadLessons();
        this.loadStudentStats();
        
        alert("Vizsga eredménye elmentve!");
      },
      error: (err) => {
        console.error("Hiba történt:", err);
        alert("Hiba: " + (err.error?.message || "Szerver elérési hiba"));
      }
    });
}

saveExamResult(result: string) {
  if (!this.selectedLesson) return;

  const updateData = {
    examResult: result,
    status: result === 'sikertelen' ? 'failed' : 'completed'
  };

  this.http.put(`http://localhost:3000/lessons/${this.selectedLesson.id}`, updateData)
    .subscribe({
      next: (res: any) => {
        console.log("Szerver válasza:", res);
        
        this.selectedLesson.examResult = result;
        this.selectedLesson.status = updateData.status;

        this.showExamResultModal = false;
        
        this.loadLessons(); 
      },
      error: (err) => alert("Hiba a mentésnél: " + err.error.message)
    });
}

openExamResultModal(lesson: any) {
  this.selectedLesson = lesson;
  this.showExamResultModal = true;
}

getStartOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); 
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}
}
