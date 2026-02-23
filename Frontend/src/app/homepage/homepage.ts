import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.css']
})
export class HomepageComponent implements OnInit {

  username = '';
  role = '';

  constructor(private router: Router) {}

  ngOnInit() {
    const saved = localStorage.getItem('user');

    if (saved) {
      const user = JSON.parse(saved);
      this.username = user.username;
      this.role = user.role;
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    this.router.navigate(['/login']);
  }
}
