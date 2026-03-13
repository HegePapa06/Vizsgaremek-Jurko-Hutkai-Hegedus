import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token'); // Ide azt a kulcsot írd, amit használsz

  if (token) {
    return true; // Van token, mehet tovább
  } else {
    router.navigate(['/login']); // Nincs token, irány a login!
    return false;
  }
};