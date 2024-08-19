/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { ConfigService } from 'src/app/services/config.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent implements OnInit {
  collapsed: any;
  username: any;
  contactUs: any;

  constructor(private _auth: AuthService, private _config: ConfigService) {}

  ngOnInit(): void {
    this.collapsed = true;
    const user = this._auth.user;
    if (user && user.name) {
      this.username = user.name;
    }
    this.contactUs = this._config.contactUs;
  }

  logout() {
    this._auth.signOut();
  }
}
