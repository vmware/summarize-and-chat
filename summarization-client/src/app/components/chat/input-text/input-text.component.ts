import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-input-text',
  templateUrl: './input-text.component.html',
  styleUrls: ['./input-text.component.scss'],
})
export class InputTextComponent implements OnInit {
  @Input('hasActiveRequest')
  hasActiveRequest!: boolean;

  @Output('outputText')
  outputTextEmitter = new EventEmitter();
  inputText: string = '';
  lineCount: number = 2;

  @ViewChild('textarea', { read: ElementRef })
  textarea!: ElementRef<HTMLTextAreaElement>;

  constructor() {}

  ngOnInit(): void {}

  onChatInput() {
    if (this.inputText == '' || this.inputText.length < 60) {
      if (!this.inputText.includes('\n')) {
        this.lineCount = 2;
        return;
      }
    }
    const textareaElement = this.textarea.nativeElement;
    const computedStyle = window.getComputedStyle(textareaElement);
    const lineHeight = parseFloat(computedStyle.lineHeight);
    const lines =
      Math.floor(textareaElement.scrollHeight / lineHeight - 1) > 2
        ? Math.floor(textareaElement.scrollHeight / lineHeight - 1)
        : 2;
    this.lineCount = Math.min(lines, 6);
  }

  send(event: any) {
    event.preventDefault();
    if (this.inputText.trim()) {
      this.outputTextEmitter.emit(this.inputText);
      this.inputText = '';
      this.lineCount = 2;
    }
  }
}
