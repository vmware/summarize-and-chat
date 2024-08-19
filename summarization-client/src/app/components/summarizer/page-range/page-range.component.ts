/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidatorFn,
} from '@angular/forms';

@Component({
  selector: 'app-page-range',
  templateUrl: './page-range.component.html',
  styleUrls: ['./page-range.component.scss'],
})
export class PageRangeComponent implements OnInit {
  pageRangeForm: FormGroup = new FormGroup({
    startPage: new FormControl(1, [Validators.required, Validators.min(1)]),
    endPage: new FormControl(50, [Validators.required, Validators.min(1)]),
  });
  @Output() pageRangeData = new EventEmitter<Object>();

  constructor() {
    this.pageRangeForm = new FormGroup(
      {
        startPage: new FormControl(1, [Validators.required, Validators.min(1)]),
        endPage: new FormControl(50, [Validators.required, Validators.min(1)]),
      },
      { validators: this.greaterThanValidator('startPage', 'endPage') }
    );
  }
  ngOnInit(): void {}

  greaterThanValidator(
    controlName: string,
    compareToControlName: string
  ): ValidatorFn {
    return (formGroup: AbstractControl): { [key: string]: any } | null => {
      const control = formGroup.get(controlName);
      const compareToControl = formGroup.get(compareToControlName);

      if (
        control &&
        compareToControl &&
        control.value > compareToControl.value
      ) {
        return { greaterThan: true };
      }
      return null;
    };
  }

  modelChange() {
    this.pageRangeData.emit(this.pageRangeForm.value);
  }
}
