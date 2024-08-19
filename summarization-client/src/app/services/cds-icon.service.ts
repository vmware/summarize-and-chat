/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Injectable } from '@angular/core';
import {
  ClarityIcons,
  alignLeftTextIcon,
  arrowIcon,
  chatBubbleIcon,
  copyIcon,
  downloadIcon,
  fileIcon,
  gridViewIcon,
  trashIcon,
  uploadCloudIcon,
  userIcon,
  videoGalleryIcon,
  clipboardIcon,
  noteIcon,
  logoutIcon,
  shrinkIcon,
  talkBubblesIcon,
  refreshIcon,
  fileGroupIcon,
  historyIcon,
  plusCircleIcon,
  clockIcon,
  envelopeIcon,
} from '@cds/core/icon';
import '@cds/core/icon/register.js';
import { pdfFileIcon } from '@cds/core/icon/shapes/pdf-file';

ClarityIcons.addIcons(
  userIcon,
  chatBubbleIcon,
  arrowIcon,
  uploadCloudIcon,
  fileIcon,
  copyIcon,
  downloadIcon,
  alignLeftTextIcon,
  pdfFileIcon,
  videoGalleryIcon,
  gridViewIcon,
  trashIcon,
  clipboardIcon,
  noteIcon,
  logoutIcon,
  shrinkIcon,
  videoGalleryIcon,
  talkBubblesIcon,
  refreshIcon,
  fileGroupIcon,
  historyIcon,
  plusCircleIcon,
  clockIcon,
  envelopeIcon
);
@Injectable({
  providedIn: 'root',
})
export class CdsIconService {
  constructor() {}
}
