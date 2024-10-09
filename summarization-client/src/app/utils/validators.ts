/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { AbstractControl, FormControl, FormGroup, FormArray, ValidationErrors, ValidatorFn } from '@angular/forms';

export function urlValidator(): ValidatorFn {
  return (control: AbstractControl): {[key: string]: any} | null => {
    if (!control.value) {
      return null;
    }
    const urlRegex = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+|localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d{1,5})?(\/[^\s]*)?$/i
    let valid = urlRegex.test(control.value);
    if (valid) {
      try {
        new URL(control.value)
      }
      catch(error) {
        valid = false
      }
    }
    return valid ? null : { 'invalidUrl': { value: control.value } };
  };
}

export class FormValidatorUtil {
  static markControlsAsTouched(formElement: AbstractControl): void {
    if (formElement instanceof FormControl) {
      formElement.markAsTouched();
    } else if (formElement instanceof FormGroup) {
      Object.keys(formElement.controls).forEach((key) => {
        this.markControlsAsTouched(formElement.get(key)!);
      });
    } else if (formElement instanceof FormArray) {
      formElement.controls.forEach((control) => {
        this.markControlsAsTouched(control);
      });
    }
  }
}

export class DatasetValidator {
  private static readonly REQUIRED_FIELD: string = 'This field is required';
  private static readonly REQUIRED_FIELD_LABEL: string = 'This field is required at least 2 labels';
  private static readonly REQUIRED_FIELD_POP_LABEL: string = 'This field is required at least 2 secondary labels';
  private static readonly REQUIRED_FIELD_ENTITY: string = 'This field is required at least 1 entity';
  private static readonly FILE_FORMAT_NOT_SUPPORT: string = 'Selected file format is not supported';
  private static readonly FILE_SIZE_EXCEED_LIMIT: string = 'Selected file size exceeds the limit 500MB';
  private static readonly IMAGE_FILE_SIZE_EXCEED_LIMIT: string = 'Selected file size exceeds the limit 1MB';
  private static readonly FILE_DUPLICATED: string = 'Selected file has already exist in database';
  private static readonly FILE_EXCEEDS_100MB: string =
    'File exceeds 100MB. Please use the My Datasets tab for larger dataset upload. Once completed, data will be available in this menu.';
  static modelName(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!control.parent) {
        return null!;
      }

      if (DatasetValidator.isEmpty(control.value)) {
        return { msg: { value: DatasetValidator.REQUIRED_FIELD } };
      }

      const pattern = `^[a-zA-Z0-9 _\\-\\.]+$`;
      const argRegEx = new RegExp(pattern, 'g');
      if (!control.value.match(argRegEx)) {
        return {
          msg: {
            value: 'Wrong format! Model name only allow letters, digits, dots, underscores and hyphen',
          },
        };
      }
      return null!;
    };
  }

  private static isEmpty(str: any): boolean {
    if (!str) {
      return true;
    } else if (str instanceof String && str.trim().length === 0) {
      return true;
    } else if (str instanceof Array && str.length === 0) {
      return true;
    } else if (str instanceof Object) {
      return this.isEmptyObject(str);
    }
    return false;
  }

  private static isEmptyObject(obj: any): boolean {
    for (const key in obj) {
      if (obj[key] !== null && obj[key] !== '') {
        return false;
      }
    }
    return true;
  }

  static validNormalEmail(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!control.parent) {
        return null!;
      }

      if (DatasetValidator.isEmpty(control.value)) {
        return { msg: { value: DatasetValidator.REQUIRED_FIELD } };
      }

      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (pattern.test(control.value)) {
        return null!;
      } else {
        return { msg: { value: 'Wrong format! Only accept email address' } };
      }
    };
  }

  static validPassword(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!control.parent) {
        return null!;
      }

      if (DatasetValidator.isEmpty(control.value)) {
        return { msg: { value: DatasetValidator.REQUIRED_FIELD } };
      }
      return null!;
    };
  }


  static required(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (DatasetValidator.isEmpty(control.value)) {
        return { msg: { value: DatasetValidator.REQUIRED_FIELD } };
      }
      return null!;
    };
  }
}