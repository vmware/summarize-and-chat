/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  user: any;
  username: string = '';
  constructor(
    private _auth:AuthService,
  ) {}

  ngOnInit(): void {
    const user = this._auth.user;
    if (user && user.name) {
      this.username = user.name;
    }
  }

  public async login() : Promise<void> {
    await this._auth.signIn()
  }
}
