import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { map, take } from 'rxjs';

export const authGuard = () => {
  const apiService = inject(ApiService);
  const router = inject(Router);

  return apiService.isLoggedIn$.pipe(
    take(1),
    map(isLoggedIn => {
      if (isLoggedIn) {
        return true;
      } else {
        router.navigate(['/login']);
        return false;
      }
    })
  );
};
