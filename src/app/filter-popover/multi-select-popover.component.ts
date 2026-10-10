import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-multi-select-popover',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './multi-select-popover.component.html',
  styleUrl: './multi-select-popover.component.css',
})
export class MultiSelectPopoverComponent {
  @Input() title = '';
  @Input() hint = '';
  @Input() options: string[] = [];
  @Input() selected: string[] = [];
  @Output() apply = new EventEmitter<string[]>();

  pending: string[] = [];

  ngOnChanges(): void {
    this.pending = [...this.selected];
  }

  toggle(option: string): void {
    const idx = this.pending.indexOf(option);
    if (idx >= 0) {
      this.pending.splice(idx, 1);
    } else {
      this.pending.push(option);
    }
  }

  isSelected(option: string): boolean {
    return this.pending.includes(option);
  }

  applyNow(): void {
    this.apply.emit(this.pending);
  }
}
