import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.css'],
  imports: [RouterLink]
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

  
}
