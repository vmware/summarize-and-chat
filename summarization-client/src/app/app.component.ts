/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ChatService } from 'src/app/services/chat.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Summarizer';

  pinned!: boolean;
  showing!: boolean;
  open!: boolean;
  showAssist: boolean = false;

  constructor(
    private router: Router,
    private chatService: ChatService,
    private cdref: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.url === '/nav/doc' || event.url === '/nav/files') {
          this.showAssist = true;
        } else {
          this.showAssist = false;
          this.open = false;
          this.showing = false;
        }
      }
    });

    this.chatService.getAssistValue().subscribe((res) => {
      if (!res) {
        this.open = false;
        this.showing = true;
      }
    });
  }

  outPinned(event: any) {
    this.pinned = event.pinned;
    this.open = event.open;
    this.showing = event.showing;
  }

  ngAfterContentChecked() {
    this.cdref.detectChanges();
  }
}
