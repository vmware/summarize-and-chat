/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, OnInit, Output, EventEmitter } from '@angular/core';

enum statusObj {
  er = 'error',
  wa = 'warning',
  un = '',
}
@Component({
  selector: 'app-sum-time-range',
  templateUrl: './sum-time-range.component.html',
  styleUrls: ['./sum-time-range.component.scss'],
})
export class SumTimeRangeComponent implements OnInit {
  timeStart = new Date().setHours(0, 0, 0, 0);
  defaultStartValue = new Date(0, 0, 0, 0, 0, 0);

  timeEnd = new Date().setHours(2, 0, 0, 0);
  defaultEndValue = new Date(0, 0, 0, 0, 0, 0);
  startStatus: statusObj = statusObj.un;
  endStatus: statusObj = statusObj.un;

  @Output() rangeStartData = new EventEmitter<Object>();
  @Output() rangeEndData = new EventEmitter<Object>();

  constructor() {}

  ngOnInit(): void {}

  onStartDateChange(event: any) {
    if (event) {
      this.startStatus = statusObj.un;
      let startTime = this.dealTime(event);
      this.rangeStartData.emit({
        startTime,
      });
    } else {
      this.startStatus = statusObj.er;
      this.rangeStartData.emit({
        startStatus: this.startStatus,
      });
    }
  }

  onEndDateChange(event: any) {
    if (event) {
      this.endStatus = statusObj.un;
      let endTime = this.dealTime(event);
      this.rangeEndData.emit({
        endTime,
      });
    } else {
      this.endStatus = statusObj.er;
      this.rangeEndData.emit({
        endStatus: this.endStatus,
      });
    }
  }

  dealTime(date: any) {
    let time = new Date(date);
    let h = time.getHours().toString().padStart(2, '0');
    let m = time.getMinutes().toString().padStart(2, '0');
    let s = time.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  disabledHours(): number[] {
    return Array.from({ length: 21 }, (_, index) => index + 3);
  }

  disabledMinutes(hour: number): number[] {
    if (hour === 2) {
      return Array.from({ length: 59 }, (_, index) => index + 1);
    } else {
      return [];
    }
  }

  disabledSeconds(hour: number, minute: number): number[] {
    if (hour === 2) {
      return Array.from({ length: 59 }, (_, index) => index + 1);
    } else {
      return [];
    }
  }
}
