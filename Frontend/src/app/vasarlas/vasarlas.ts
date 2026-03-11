import { Component, OnInit } from '@angular/core'; 
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vasarlas',
  templateUrl: './vasarlas.html',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./vasarlas.css']
})
export class Vasarlas implements OnInit {
  apiUrl = 'http://localhost:3000';
  cart: any[] = [];
  student: any = null;
  role: string | null = ''; 

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.role = localStorage.getItem('role');
    
    this.loadStudentData();
  }

  loadStudentData() {
    this.http.get(`${this.apiUrl}/me`, this.getAuthHeaders()).subscribe({
      next: (res: any) => {
        this.student = res;
        console.log("Adatok betöltve:", this.student);
      },
      error: (err) => console.error("Nem sikerült betölteni az adatokat", err)
    });
  }

  addToCart(type: string) {
    if (this.role === 'tanar') {
      alert("Oktatóként nem vásárolhatsz!");
      return;
    }

    if (!this.student && this.role === 'tanulo') {
      alert("Adatok betöltése folyamatban...");
      return;
    }

    if (type === 'retake_exam') {
      if (!this.student?.lastExamFailed) {
        alert("Csak sikertelen vizsga után vásárolhatsz pótvizsgát!");
        return;
      }
      const alreadyInCart = this.cart.find(i => i.type === 'retake_exam');
      if (alreadyInCart || this.student?.canRetakeExam === true) {
        alert("Már van egy megvásárolt vagy kosárban lévő pótvizsgád!");
        return;
      }

      this.cart.push({ 
        id: Date.now(), 
        type: 'retake_exam', 
        name: 'Pótvizsga alkalma', 
        price: 15000 
      });
    }

    if (type === 'extra_hour') {
      this.cart.push({ 
        id: Date.now(), 
        type: 'extra_hour', 
        name: 'Plusz vezetés óra', 
        price: 8000 
      });
    }
  }

  getTotalPrice() {
    return this.cart.reduce((sum, item) => sum + item.price, 0);
  }

  removeFromCart(itemId: number) {
    this.cart = this.cart.filter(item => item.id !== itemId);
  }

  checkout() {
    if (this.cart.length === 0 || this.role === 'tanar') return;

    const orderData = { items: this.cart };

    this.http.post(`${this.apiUrl}/shop/buy`, orderData, this.getAuthHeaders()).subscribe({
      next: (res: any) => {
        alert('Sikeres vásárlás!');
        this.cart = [];
        this.loadStudentData(); 
      },
      error: (err) => {
        console.error("Hiba a fizetés során", err);
        alert(err.error?.message || "A fizetés nem sikerült.");
      }
    });
  }

  get totalAmount(): number {
    return this.cart.reduce((sum, item) => sum + item.price, 0);
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({ 
        'Authorization': `Bearer ${token}` 
      })
    };
  }
}