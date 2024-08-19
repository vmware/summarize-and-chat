import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClipboardModule } from 'ngx-clipboard';
import { HttpClientModule } from '@angular/common/http';
import { ChatComponent } from './chat.component';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { registerLocaleData } from '@angular/common';
import { RightDrawerModule } from './right-drawer/right-drawer.module';
import { LottieComponent } from 'ngx-lottie';
// import zh from '@angular/common/locales/zh';

// registerLocaleData(zh);

@NgModule({
  declarations: [
    ChatComponent,
  ],
  imports: [
    CommonModule,
    RightDrawerModule,
    LottieComponent,
    ClarityModule,
    CdsModule,
    FormsModule,
    ReactiveFormsModule,
    ClipboardModule,
    HttpClientModule,
    NgxDocViewerModule,
    NgxExtendedPdfViewerModule,
    NzButtonModule,
    NzTimePickerModule,
    FormsModule,
  ],
  exports: [ChatComponent],
})
export class ChatModule {}
