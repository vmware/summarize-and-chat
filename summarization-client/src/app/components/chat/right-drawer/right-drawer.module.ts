/*
Copyright 2024-2025 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";

import { CommonModule } from "@angular/common";

import { ClrTooltipModule } from "@clr/angular";

import { ClarityIcons, angleIcon, pinIcon, popOutIcon, resizeIcon, shrinkIcon, timesIcon } from "@cds/core/icon";
import { RightDrawerComponent } from "./right-drawer.component";

@NgModule({
    declarations: [RightDrawerComponent],
    imports: [CommonModule, ClrTooltipModule],
    exports: [RightDrawerComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RightDrawerModule {
    constructor() {
        ClarityIcons.addIcons(pinIcon, timesIcon, shrinkIcon, resizeIcon, popOutIcon, angleIcon);
    }
}
