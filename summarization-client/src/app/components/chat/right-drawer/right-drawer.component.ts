/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, Output, EventEmitter, Input, ElementRef, ViewChild, OnChanges, OnDestroy } from "@angular/core";

const CLARITY_HEADER_HEIGHT = 60;
const FOCUSABLE_ELEMENTS = [
    "button:not(.tooltip-trigger)",
    "[href]",
    "input",
    "select",
    "textarea",
    '[tabindex]:not([tabindex="-1"]):not(.tooltip-trigger)',
].join(", ");

@Component({
    selector: "right-drawer",
    templateUrl: "right-drawer.component.html",
    styleUrls: ["./right-drawer.component.scss"],
})
export class RightDrawerComponent implements OnChanges, OnDestroy {
    @Input() open: boolean = false;
    @Input() showBackdrop: boolean = true;
    @Input() expandable: boolean = false;
    @Input() expanded: boolean = false;
    @Input() pinnable: boolean = true;
    @Input() pinned: boolean = false;
    @Input() topOffset: number = 0;
    @Input() headerHeight: number = CLARITY_HEADER_HEIGHT;
    @Input() hideFixedBottom: boolean = false;
    @Input() closeOnUnpin: boolean = false;
    @Input() focusFirstDrawerElement: boolean = false;
    @Input() backdropOpacity: number = 0.85;
    @Input() ariaLabel: string = "";

    @Output() show: EventEmitter<any> = new EventEmitter<any>();
    @Output() openChange: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() hide: EventEmitter<any> = new EventEmitter<any>();
    @Output() showing: EventEmitter<any> = new EventEmitter<any>();
    @Output() hiding: EventEmitter<any> = new EventEmitter<any>();
    @Output() drawerPinStateChanged: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() pinnedChange: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() expandedChange: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() keyboardFocusOut: EventEmitter<boolean> = new EventEmitter<boolean>();

    @ViewChild("rightDrawer", { read: ElementRef, static: false }) rightDrawerRef: any;
    // @ViewChild("rightDrawer", { read: ElementRef, static: false }) rightDrawerRef: ElementRef;

    backdrop = false;
    visible = false;
    isHiding = false;
    slideDelayMillis = 200; // must change CSS animation as well

    private readonly mouseDownListener: () => void;
    private readonly mouseUpListener: () => void;
    private readonly keyDownListener: (e: KeyboardEvent) => void;
    private readonly keyUpListener: () => void;
    private readonly focusOutListener: (e: any) => void;
    private readonly drawerElement: HTMLElement;

    private isMouseUsed: boolean = false;
    private lastKeyboardEvent: any;
    // private lastKeyboardEvent: KeyboardEvent | null;

    public constructor(private elementRef: ElementRef) {
        this.drawerElement = elementRef.nativeElement;

        this.mouseDownListener = () => {
            this.isMouseUsed = true;
        };

        this.mouseUpListener = () => {
            this.isMouseUsed = false;
        };

        this.keyDownListener = (e: KeyboardEvent) => {
            this.lastKeyboardEvent = e;
        };

        this.keyUpListener = () => {
            this.lastKeyboardEvent = null;
        };

        this.focusOutListener = (e) => {
            const isNewElementFocused = e.relatedTarget !== null && e.relatedTarget !== document.body;
            const drawerContainsFocusedElement = this.drawerElement.contains(e.relatedTarget as Node);

            if (!this.isMouseUsed && isNewElementFocused && !drawerContainsFocusedElement) {
                // We check whether keyboard focusout was caused by forward Tab key.
                // If that's the case, keyboardFocusOut will emit TRUE to signal focus moved 'forward'.
                if (this.lastKeyboardEvent?.key === "Tab") {
                    if (!this.lastKeyboardEvent?.shiftKey) {
                        if (!this.pinned) {
                            console.log("right-drawer - not pinned");
                            this.focusFirstFocusableElement();
                        }
                        if (!this.drawerElement.contains(document.activeElement)) {
                            this.keyboardFocusOut.emit(true);
                        }
                    } else {
                        if (!this.pinned) {
                            console.log("2 - right-drawer - not pinned");
                            this.focusLastFocusableElement();
                        }
                        if (!this.drawerElement.contains(document.activeElement)) {
                            this.keyboardFocusOut.emit(false);
                        }
                    }
                }
            }
        };

        document.addEventListener("mousedown", this.mouseDownListener, true);
        document.addEventListener("mouseup", this.mouseUpListener, true);
        document.addEventListener("keydown", this.keyDownListener, true);
        document.addEventListener("keyup", this.keyUpListener, true);
        this.drawerElement.addEventListener("focusout", this.focusOutListener);
    }

    get containerHeight(): string {
        return "calc(100vh - " + (this.topOffset + this.headerHeight) + "px)";
    }

    get pinButtonLabel(): string {
        if (this.pinned) {
            if (this.closeOnUnpin) {
                return "close-panel";
            } else {
                return "unpin";
            }
        } else {
            return "pin";
        }
    }

    get expandButtonLabel(): string {
        if (this.expanded) {
            return "shrink";
        } else {
            return "expand";
        }
    }

    ngOnChanges(changes: any) {
        if (changes && changes.open) {
            if (changes.open.currentValue) {
                this.showDrawer();
            } else if (changes.open.previousValue) {
                this.hideDrawer(false);
            }
        }

        if (changes && changes.pinned) {
            this.backdrop = !this.pinned;
        }

        if (changes?.expanded) {
            // cannot expand if expandable is false
            if (changes.expanded.currentValue && !this.expandable) {
                return;
            }
            this.toggleExpandState(changes.expanded.currentValue);
        }

        if (changes && changes.focusFirstDrawerElement) {
            this.focusFirstFocusableElement();
        }
    }

    ngOnDestroy() {
        document.removeEventListener("mousedown", this.mouseDownListener, true);
        document.removeEventListener("mouseup", this.mouseUpListener, true);
        document.removeEventListener("keydown", this.keyDownListener, true);
        document.removeEventListener("keyup", this.keyUpListener, true);
        this.drawerElement.removeEventListener("focusout", this.focusOutListener);
    }

    togglePinState(emitEvent: boolean = true) {
        if (this.pinned && this.closeOnUnpin) {
            this.hideDrawer();
        }

        this.pinned = !this.pinned;
        if (this.pinned) {
            this.backdrop = false;
        } else {
            this.backdrop = this.showBackdrop;
        }
        
        if (emitEvent) {
            this.drawerPinStateChanged.emit(this.pinned);
        }
        console.log('pinned=', this.pinned);
        this.pinnedChange.emit(this.pinned);
    }

    toggleExpandState(expanded: boolean) {
        const root = document.querySelector(":root") as HTMLElement;

        let width: number = 380;

        this.expanded = expanded;

        if (expanded) {
            width = 600;
        }

        root.style.setProperty("--right-drawer-width", `${width}px`);

        this.expandedChange.emit(this.expanded);
    }

    hideDrawer(emit: boolean = true): any {
        this.isHiding = true;
        this.backdrop = false;

        if (this.pinned && !this.isHiding) {
            this.togglePinState(false);
        }

        this.hiding.emit(null);

        setTimeout(() => {
            this.isHiding = false;
            this.visible = false;
            this.hide.emit(null);
            this.open = false;
            if (emit) {
                this.openChange.emit(false);
            }
        }, this.slideDelayMillis);
    }

    private focusFirstFocusableElement() {
        if (!this.rightDrawerRef) {
            return;
        }
        const allElements = this.getAllElements();
        for (let index = 0; index < allElements.length; index++) {
            const elementFocused = this.focusElement(allElements[index]);
            if (elementFocused) {
                break;
            }
        }
    }

    private focusLastFocusableElement() {
        if (!this.rightDrawerRef) {
            return;
        }
        const allElements = this.getAllElements();
        for (let index = allElements.length - 1; index >= 0; index--) {
            const elementFocused = this.focusElement(allElements[index]);
            if (elementFocused) {
                break;
            }
        }
    }

    private focusElement(element: HTMLElement): boolean {
        const style = window.getComputedStyle(element);
        if (style.display !== "none" && style.visibility !== "hidden" && element.offsetParent !== null) {
            element.focus();
            return true;
        }
        return false;
    }

    private getAllElements(): NodeListOf<HTMLElement> {
        return this.rightDrawerRef.nativeElement.querySelectorAll(FOCUSABLE_ELEMENTS) as NodeListOf<HTMLElement>;
    }

    private showDrawer() {
        this.backdrop = this.showBackdrop && !this.pinned;
        this.visible = true;
        this.showing.emit(null);

        setTimeout(() => {
            this.show.emit(null);
            this.focusFirstFocusableElement();
        }, this.slideDelayMillis);
    }
}
