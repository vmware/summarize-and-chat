import { Injectable } from '@angular/core';
import { Router, Route, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { Observable } from 'rxjs';
import { ConfigService } from 'src/app/services/config.service';

@Injectable({providedIn: 'root'})
export class AuthGuard {
  constructor(private authService: AuthService) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    const user = this.authService.loggedUser();
    if (user) {
      return true;
    }
    if (this.authService.isLoggedIn()) {
      console.log('Logged in')
      return true
    } else {
      console.log('redirect)')
      // this.authService.redirectToLogin();
      
      return false;
    }
  }
}