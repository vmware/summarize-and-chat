/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { AnimationItem } from 'lottie-web';
import { marked } from 'marked';
import {
  AnimationLoader,
  AnimationOptions,
  provideLottieOptions,
} from 'ngx-lottie';

@Component({
  selector: 'assist',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  // providers: [
  //   provideLottieOptions({
  //     player: () => import('lottie-web'),
  //   }),
  //   AnimationLoader,
  // ],
})
export class ChatComponent implements OnInit {
  @Input('history')
  history: any = [];
  @Input('showHistoryIcon')
  showHistoryIcon: boolean = false;
  @Input('headerColor')
  headerColor: number = 1;
  @Input('user')
  user: string = '';
  @Input('helps')
  helps: string = '';
  // @Input('prompt')
  // prompt: string = '';
  @Input('promptQuestions')
  promptQuestions!: any[];
  @Output('showPin')
  showPinEmitter = new EventEmitter();
  @Output('sendToApi')
  sendToApiEmitter = new EventEmitter();
  @Output('delHistory')
  delHistoryEmitter = new EventEmitter();
  @Output('getHistory')
  getHistoryEmitter = new EventEmitter();
  @Input('inputPinnable')
  inputPinnable: boolean = true;
  @Input('inputPinned')
  inputPinned: boolean = true;
  @Input('inputOpen')
  inputOpen: boolean = false;

  pinnable: boolean = true;
  pinned: boolean = true;
  open: boolean = false;

  showImg: boolean = true;
  conversation: any = null;

  greeting: string = '';
  inputText: string = '';
  outputElement: any;
  index = 0;
  timer: any = null;

  outputGreetHelpElement: any;
  helpIndex = 0;
  helpTimer: any = null;

  showChat: boolean = false;
  click: number = 0;

  showing = true;
  hiding = false;
  // options!: AnimationOptions | null;
  showTooltip = false;
  showH: boolean = false;
  errMessage: string = '';

  imgHover(flag: boolean) {
    this.showTooltip = flag;
  }

  showingClick() {
    this.showing = true;
    this.showPinEmitter.emit({
      open: this.open,
      showing: this.showing,
      pinned: this.pinned,
    });
  }

  hidingClick() {
    this.hiding = true;
    this.showPinEmitter.emit({
      open: this.open,
      showing: this.showing,
      pinned: this.pinned,
    });
  }

  pinnedChange() {
    console.log("assist - pinnedChange");
    this.showPinEmitter.emit({
      open: this.open,
      showing: this.showing,
      pinned: this.pinned,
    });
  }

  showDelCard: boolean = false;

  constructor(
    private cd: ChangeDetectorRef,
    private renderer: Renderer2,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    const now = new Date();
    // this.greeting = `${this.getHelloTime(now.getHours())} ${
    //   this.user ? this.user : ''
    // }.`;
    this.setHeaderColor();
    this.conversation = {
      messages: [],
      responses: [],
    };
    this.handleAnimationLoopComplete()
    
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.pinned = this.inputPinned;
      this.open = this.inputOpen;
      this.pinnable = this.inputPinnable;
      this.cd.detectChanges();
      if (this.open) {
        this.showPinEmitter.emit({
          open: this.open,
          showing: this.showing,
          pinned: this.pinned,
        });
      }
    }, 0);
  }

  getHelloTime(hrs: number): string {
    let greet = '';
    if (hrs < 12) greet = 'Good Morning';
    else if (hrs >= 12 && hrs <= 17) greet = 'Good Afternoon';
    else if (hrs >= 17 && hrs <= 24) greet = 'Good Evening';
    return greet;
  }

  setHeaderColor() {
    if (this.headerColor == 1) {
      document
        .getElementsByTagName('body')[0]
        .style.setProperty('--header-color', '#313131');
    } else if (this.headerColor == 2) {
      document
        .getElementsByTagName('body')[0]
        .style.setProperty('--header-color', '#485969');
    } else if (this.headerColor == 3) {
      document
        .getElementsByTagName('body')[0]
        .style.setProperty('--header-color', '#281336');
    } else if (this.headerColor == 4) {
      document
        .getElementsByTagName('body')[0]
        .style.setProperty('--header-color', '#006a91');
    } else if (this.headerColor == 5) {
      document
        .getElementsByTagName('body')[0]
        .style.setProperty('--header-color', '#004a70');
    } else if (this.headerColor == 6) {
      document
        .getElementsByTagName('body')[0]
        .style.setProperty('--header-color', '#002538');
    } else if (this.headerColor == 7) {
      document
        .getElementsByTagName('body')[0]
        .style.setProperty('--header-color', '#25333d');
    } else {
      document
        .getElementsByTagName('body')[0]
        .style.setProperty('--header-color', '#0f171c');
    }
  }

  showSide() {
    console.log('showSide')
    this.open = !this.open;
    this.click++;
    // if (this.open) {
    //   if (this.click == 1) {
    //     this.options = {
    //       path: '../../../assets/animation/first-impression-logo-animation.json',
    //       loop: 0,
    //     };
    //   }
    // }
    this.showPinEmitter.emit({
      open: this.open,
      showing: this.showing,
      pinned: this.pinned,
    });
  }

  animationCreated(animationItem: AnimationItem): void {
    console.log(animationItem);
  }

  handleAnimationLoopComplete() {
    console.log('handleAnimationLoopComplete')
    this.outputElement = document.getElementById('outputGreeting');
    this.timer = setInterval(() => this.streamOutput(), 30);
  }

  streamOutput() {
    console.log('streamOutput')
    if (this.index < this.greeting?.length) {
      var currentText = this.greeting.substring(0, this.index + 1);
      if (this.outputElement) {
        this.outputElement.textContent = currentText;
      }
      this.index++;
    } else {
      clearInterval(this.timer);
      this.outputGreetHelpElement =
        document.getElementById('outputGreetingHelp');
      this.helpTimer = setInterval(() => this.streamOutputHelp(), 30);
    }
  }

  streamOutputHelp() {
    console.log('streamOutputHelp')
    if (this.helpIndex < this.helps?.length) {
      var currentText = this.helps.substring(0, this.helpIndex + 1);
      if (this.outputGreetHelpElement) {
        this.outputGreetHelpElement.textContent = currentText;
      }
      this.helpIndex++;
    } else {
      this.showChat = true;
      clearInterval(this.helpTimer);
      this.cd.detectChanges();
      if (this.open) {
        const myElement =
          this.elementRef.nativeElement.querySelector('.greet-question');
        const chatAskEle =
          this.elementRef.nativeElement.querySelector('.chat-mainAsk');
        if (!chatAskEle) {
          this.renderer.addClass(myElement, 'question-flow');
        }
      }
    }
  }

  scrollChatToBottom() {
    this.cd.detectChanges();
    var scrollingDiv = document.getElementById('chat-out');
    if (scrollingDiv) scrollingDiv.scrollTop = scrollingDiv.scrollHeight;
  }

  outputText(event: any) {
    event.preventDefault();
    this.inputText = this.inputText.trim();
    this.sendOutMessage();
  }

  onChatInput() {
    const textarea = document.getElementById('prompt_textarea');
    function adjustTextareaHeight() {
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height =
          Math.min(
            textarea.scrollHeight,
            (12 * textarea.offsetHeight) /
              (textarea as HTMLTextAreaElement).rows
          ) + 'px';
      }
    }

    if (textarea) textarea.addEventListener('input', adjustTextareaHeight);
    window.addEventListener('resize', adjustTextareaHeight);
    adjustTextareaHeight();
  }

  questionClick(question: string) {
    this.inputText = question.trim();
    this.sendOutMessage();
  }

  sendOutMessage() {
    if (this.inputText) {
      const textarea = document.getElementById('prompt_textarea');
      if (textarea) textarea.style.height = 2 + 'em';
      const myElement =
        this.elementRef.nativeElement.querySelector('.greet-question');
      this.renderer.removeClass(myElement, 'question-flow');
      this.conversation.messages.push({
        message: this.inputText,
        context: '',
      });
      this.inputText = '';
      this.scrollChatToBottom();
      this.errMessage = '';
      this.cd.detectChanges();
      this.sendToApiEmitter.emit(this.conversation);
    }
  }

  setResponse(choiceText: string) {
    if (choiceText) {
      this.conversation.responses[this.conversation.responses.length - 1][
        'response'
      ] += choiceText;
    } else {
      this.conversation.responses.push({ response: '', sources: [] });
    }
    this.scrollChatToBottom();
  }

  markdownToHtml(markdown: string) {
    return marked(markdown);
  }

  showHistory() {
    this.showH = !this.showH;
    if (this.showH) {
      this.getHistoryEmitter.emit();
      (
        document.getElementsByTagName('right-drawer')[0] as HTMLElement
      ).style.setProperty('--right-drawer-width', '800px');
      document
        .getElementById('chat-mainLine')
        ?.setAttribute('class', 'chat-mainLine2');
      document
        .getElementById('chat-mainLine')
        ?.removeAttribute('chat-mainLine');
    } else {
      (
        document.getElementsByTagName('right-drawer')[0] as HTMLElement
      ).style.setProperty('--right-drawer-width', '380px');
      document
        .getElementById('chat-mainLine')
        ?.setAttribute('class', 'chat-mainLine');
      document
        .getElementById('chat-mainLine')
        ?.removeAttribute('chat-mainLine2');
    }
  }

  setErrMessage(error: string) {
    this.errMessage = error;
    this.cd.detectChanges();
    this.scrollChatToBottom();
  }

  clickClear() {
    this.showDelCard = !this.showDelCard;
  }

  cancelDel() {
    this.showDelCard = false;
  }

  clearHistory() {
    const count = this.history.length;
    this.history = [];
    this.showDelCard = false;
    this.showHistory();
    this.delHistoryEmitter.emit(count);
  }
}
