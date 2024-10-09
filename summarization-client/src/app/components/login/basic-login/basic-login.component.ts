/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit } from '@angular/core';
import { DatasetValidator, FormValidatorUtil } from 'src/app/utils/validators';
import { FormGroup, FormControl } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { ConfigService } from 'src/app/services/config.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './basic-login.component.html',
  styleUrls: ['./basic-login.component.scss'],
})
export class BasicLoginComponent implements OnInit {
  dsForm!: FormGroup;
  error?: boolean;
  loading?: boolean;
  isClickSignup?: boolean;
  registerSuccess?: string;
  registerFailed?: string;
  loginType?: string;
  isLadp?: boolean;

  
  constructor(
    private config: ConfigService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.error = false;
    this.isClickSignup = false;
    this.isLadp = false;
    this.createForm();
  }

  createForm(): void {
    this.dsForm = new FormGroup({
      firstname: new FormControl('', null),
      lastname: new FormControl('', null),
      username: new FormControl('', DatasetValidator.validNormalEmail()),
      password: new FormControl('', DatasetValidator.validPassword()),
    });
  }

  clickSignup() {
    this.isClickSignup = true;
    this.dsForm?.get('firstname')?.setValidators(DatasetValidator.required());
    this.dsForm?.get('firstname')?.updateValueAndValidity();
    this.dsForm?.get('lastname')?.setValidators(DatasetValidator.required());
    this.dsForm?.get('lastname')?.updateValueAndValidity();
    this.cleanInputValue();
  }

  clickSignin() {
    this.isClickSignup = false;
    this.dsForm?.get('firstname')?.setValue(null);
    this.dsForm?.get('firstname')?.setValidators(null);
    this.dsForm?.get('firstname')?.updateValueAndValidity();
    this.dsForm?.get('lastname')?.setValue(null);
    this.dsForm?.get('lastname')?.setValidators(null);
    this.dsForm?.get('lastname')?.updateValueAndValidity();
    this.cleanInputValue();
  }

  cleanInputValue() {
    this.loading = false;
    this.error = false;
    this.dsForm?.reset();
    this.registerFailed = '';
    this.registerSuccess = '';
  }

  selectedUserType(event: any) {
    if (event.target.value === 'ldap') {
      this.isLadp = true;
    } else {
      this.isLadp = false;
    }
  }

  loginSubmit() {
    FormValidatorUtil.markControlsAsTouched(this.dsForm!);
    if (!this.dsForm?.invalid) {
      this.loading = true;
      const param: any = {
        email: this.dsForm?.get('username')?.value,
        password: this.dsForm?.get('password')?.value,
      };
      console.log(param)
      this.authService.basicAuthSignIn(param).subscribe(
        (res) => {
          let auth_user = res.auth_user
          console.log(auth_user)
          const user = {
            user: {
              email: auth_user.email,
              name: auth_user.fname,
              username: auth_user.email,
              token: auth_user.token,
            },
          };
          this.authService.addUserToStorage(user);
          this.authService._user$.next(user);
          this.loading = false;
          this.router.navigate(['/nav/doc']);
        },
        (err) => {
          this.error = true;
          this.loading = false;
          return;
        },
      );
    }
  }

  signupSubmit() {
    this.registerFailed = '';
    this.registerSuccess = '';
    this.error = false;
    FormValidatorUtil.markControlsAsTouched(this.dsForm!);
    if (!this.dsForm?.invalid) {
      this.loading = true;
      const fname = this.dsForm?.get('firstname')?.value;
      const lname =  this.dsForm?.get('lastname')?.value;
      // const fullName: Array<string> = [];
      // name.split(' ').forEach((e) => {
      //   fullName.push(e.replace(e[0], e[0].toUpperCase()));
      // });
      const param = {
        fname: this.dsForm?.get('firstname')?.value,
        lname: this.dsForm?.get('lastname')?.value,
        email: this.dsForm?.get('username')?.value,
        password: this.dsForm?.get('password')?.value
        
      };
 

      console.log(param)
      this.authService.register(param).subscribe(
        (res) => {
          console.log(res)
          this.registerSuccess = 'Sign Up Complete!';
          this.loading = false;
          setTimeout(() => {
            this.isClickSignup = false;
            this.registerSuccess = '';
          }, 500);
        },
        (err) => {
          console.log(err)
          // this.registerFailed = err.error.MSG;
          this.error = false;
          this.loading = false;
        }
      );
    } else {
      this.error = true;
    }
  }
}
