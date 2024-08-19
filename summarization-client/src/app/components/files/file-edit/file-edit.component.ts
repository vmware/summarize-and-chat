/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { SummarizeService } from 'src/app/services/summarize.service';

@Component({
  selector: 'app-file-edit',
  templateUrl: './file-edit.component.html',
  styleUrls: ['./file-edit.component.scss'],
})
export class FileEditComponent implements OnInit {
  @Output('editOut') editOutEmitter = new EventEmitter();
  @Input('data') data!: any;

  form!: FormGroup;

  disabledOk: boolean = true;

  constructor(
    private fb: FormBuilder,
    private summarizeService: SummarizeService,
    private dRef: ChangeDetectorRef
  ) {}

  ngAfterContentChecked() {
    this.dRef.detectChanges();
  }
  ngOnInit(): void {
    this.disabledOk = !this.data?.meta?.date;

    this.form = this.fb.group({
      date: [this.data?.meta?.date || '', Validators.required],
      keyValues: this.fb.array([]),
    });
    const keyValues = JSON.parse(JSON.stringify(this.data.meta));
    if (Object.keys(keyValues).length) {
      delete keyValues.date;
    }
    if (Object.keys(keyValues).length) {
      Object.keys(keyValues).forEach((key) => {
        this.keyValues.push(
          this.fb.group({
            key: this.fb.control(key, this.validateKey()),
            value: this.fb.control(keyValues[key]),
          })
        );
      });
    } else {
      this.keyValues.push(
        this.fb.group({
          key: this.fb.control('', this.validateKey()),
          value: this.fb.control(''),
        })
      );
    }
  }

  dateChange() {
    this.disabledOk = this.form.status == 'INVALID';
  }

  get keyValues(): FormArray {
    return this.form.get('keyValues') as FormArray;
  }

  addNew() {
    this.keyValues.push(
      this.fb.group({
        key: this.fb.control('', this.validateKey()),
        value: this.fb.control(''),
      })
    );
  }

  delete(i: number) {
    this.keyValues.removeAt(i);
  }

  cancel() {
    this.editOutEmitter.emit();
  }

  hasRepeatKey() {
    const keys = ['date'];
    if (this.keyValues.value && this.keyValues.value?.length) {
      this.keyValues.value.forEach((element: any) => {
        if (element.key.trim()) {
          keys.push(element.key.trim().toLowerCase());
        }
      });
    }
    return new Set(keys).size !== keys.length;
  }

  validateKey(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.parent) {
        return null;
      }
      if (!control.value.trim()) {
        return null;
      }
      const pattern = `^[a-zA-Z]+$`;
      const argRegEx = new RegExp(pattern, 'g');
      if (!control.value.match(argRegEx)) {
        return {
          msg: {
            value: 'Wrong format! ',
          },
        };
      }
      return null;
    };
  }

  ok() {
    if (this.form.status == 'VALID' && !this.hasRepeatKey()) {
      this.saveEdit();
    }
  }

  saveEdit() {
    const metaData: any = {
      file: this.data?.file,
      meta: {
        date: this.form.get('date')?.value,
      },
    };
    if (this.keyValues.value && this.keyValues.value?.length) {
      this.keyValues.value.forEach((element: any) => {
        if (element.key.trim() && element.value.trim()) {
          metaData.meta[element.key.trim()] = element.value.trim();
        }
      });
    }
    console.log('metaData: ', metaData);
    this.summarizeService.editMetadata(metaData).subscribe(
      (res) => {
        this.editOutEmitter.emit(true);
      },
      (err) => {
        console.log('err ', err);
      }
    );
  }
}
