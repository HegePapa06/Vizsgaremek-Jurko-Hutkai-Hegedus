import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

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
  imports: [CommonModule, HttpClientModule, FormsModule, MatIconModule, MatSelectModule, MatFormFieldModule]
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

  const now = new Date();
  const [hour, minute] = this.modalTime.split(':').map(Number);
  
  const startOfThisWeek = this.getStartOfWeek(new Date());
  const targetDayIndex = this.days.indexOf(this.modalDay);
  
  const targetDate = new Date(startOfThisWeek);
  targetDate.setDate(startOfThisWeek.getDate() + targetDayIndex + (this.selectedWeekOffset * 7));
  targetDate.setHours(hour, minute, 0, 0);

  if (targetDate < now) {
    alert("Hiba: Nem írhatsz be órát múltbéli időpontra!");
    return;
  }

  if (student && (student.hasLicense === true || student.hasLicense === 1)) {
    alert(`Hiba: ${student.username} már sikeresen levizsgázott!`);
    this.closeModal();
    return;
  }

  if (student) {
    if (student.isExamReady && this.selectedLessonType !== 'vizsga') {
      alert(`Hiba: ${student.username} már teljesítette a 30 órát. Neki már csak vizsgát lehet beosztani!`);
      return;
    }
    if (!student.isExamReady && this.selectedLessonType === 'vizsga') {
      alert(`Hiba: ${student.username} még nem vezetett 30 órát!`);
      return;
    }
  }

  if (this.selectedLessonType === 'vizsga') {
    const hasActiveExam = this.lessons.some(l => 
      l.studentId === this.selectedStudentId && 
      l.type === 'vizsga' && 
      l.status === 'planned'
    );
    if (hasActiveExam) {
      alert("Hiba: Már van aktív vizsgaidőpontja!");
      return;
    }
  }

  const end = new Date(targetDate.getTime() + 90 * 60000);

  const body = {
    teacherId: this.teacherId,
    studentId: this.selectedStudentId,
    date: `${targetDate.getFullYear()}-${(targetDate.getMonth() + 1).toString().padStart(2, '0')}-${targetDate.getDate().toString().padStart(2, '0')}`,
    startTime: this.modalTime,
    endTime: `${end.getHours().toString().padStart(2,'0')}:${end.getMinutes().toString().padStart(2,'0')}`,
    status: 'planned',
    type: this.selectedLessonType.toLowerCase().trim()
  };

  this.http.post(`${this.apiUrl}/lessons`, body, this.getAuthHeaders())
    .subscribe({
      next: () => { 
        this.closeModal(); 
        this.loadLessons(); 
        this.loadStudentStats(); 
        this.selectedLessonType = 'vezetés'; 
      },
      error: err => {
        console.error("Mentési hiba:", err);
        alert(err.error?.message || "Hiba történt a mentés során!");
      }
    });
}

isPast(dayName: string, timeStr: string, weekOffset: number): boolean {
  const now = new Date();
  
  const startOfWeek = this.getStartOfWeek(new Date());
  const dayIndex = this.days.indexOf(dayName);
  
  const cellDate = new Date(startOfWeek);
  cellDate.setDate(startOfWeek.getDate() + dayIndex + (weekOffset * 7));
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  cellDate.setHours(hours, minutes, 0, 0);

  return cellDate < now;
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
    if (this.isPast(dayName, time, weekOffset)) {
      console.warn("Múltbéli időpontra nem hozhatsz létre új órát!");
      return;
    }
    this.onCellClick(dayName, time);
    return;
  }

if (lesson.type === 'vizsga') {
  console.log("Vizsga ág elindult. Eredmény:", lesson.examResult);

  if (lesson.examResult && lesson.examResult.trim() !== "") {
    console.warn("STOP: Ennek a vizsgának már van rögzített eredménye!");
    alert("Ez a vizsga már lezárult: " + lesson.examResult);
    return; 
  }

  const now = new Date();
  const [year, month, day] = lesson.date.split('-').map(Number);
  const [hours, minutes] = lesson.startTime.split(':').map(Number);
  const lessonDate = new Date(year, month - 1, day, hours, minutes);

  if (now >= lessonDate) {
    console.log("Időpont OK, modal nyitása...");
    this.selectedLesson = lesson; 
    this.showExamResultModal = true; 
  } else {
    alert(`A vizsgaeredményt csak a vizsga kezdete után (${lesson.startTime}) lehet beírni!`);
  }
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
        console.log("Statisztika beérkező adat:", data);
        
        if (this.role === 'tanulo' && data) {
          const completedHours = (data.completedLessons || 0) * 2;
          const requiredHours = 30 + (data.purchasedHours || 0);
          
          const formattedData = {
            ...data, 
            hasLicense: data.hasLicense === true || data.hasLicense === 1 || data.hasLicense === "1",
            lastExamFailed: data.lastExamFailed === true || data.lastExamFailed === 1,
            completedHours: completedHours,
            requiredHours: requiredHours,
            isExamReady: completedHours >= requiredHours && !data.hasLicense, 
            username: data.username || JSON.parse(localStorage.getItem('user') || '{}').username || 'Tanuló'
          };

          this.studentStats = [formattedData];
        } else {
          this.studentStats = Array.isArray(data) ? data : [data];
        }
        
        console.log("Feldolgozott studentStats:", this.studentStats);
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
  if (!this.lessons || this.lessons.length === 0) return null;

  const today = new Date();
  const startOfThisWeek = this.getStartOfWeek(today);
  const targetDate = new Date(startOfThisWeek);
  
  const dayIndex = this.days.indexOf(dayName);
  targetDate.setDate(targetDate.getDate() + dayIndex + (weekOffset * 7));
  
  const cellDateString = `${targetDate.getFullYear()}-${(targetDate.getMonth() + 1).toString().padStart(2, '0')}-${targetDate.getDate().toString().padStart(2, '0')}`;

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const myId = user.id ? Number(user.id) : null;

  const slotLessons = this.lessons.filter(l => {
    const dbDateString = l.date.includes('T') ? l.date.split('T')[0] : l.date;
    
    const isSameDate = dbDateString === cellDateString;
    const isSameTime = l.startTime === time;
    const isVisible = this.role === 'tanulo' ? Number(l.studentId) === myId : true;

    return isSameDate && isSameTime && isVisible;
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
