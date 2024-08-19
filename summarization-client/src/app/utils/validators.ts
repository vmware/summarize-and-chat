/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

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

