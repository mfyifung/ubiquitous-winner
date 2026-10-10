import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

interface DayCell {
  day: number | null;
  iso: string | null;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

@Component({
  selector: 'app-date-popover',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-popover.component.html',
  styleUrl: './date-popover.component.css',
})
export class DatePopoverComponent implements OnInit {
  @Input() selectedDate: string | null = null;
  @Output() apply = new EventEmitter<string | null>();

  viewYear: number;
  viewMonth: number; // 0-11
  pending: string | null;

  constructor() {
    const now = new Date();
    this.viewYear = now.getFullYear();
    this.viewMonth = now.getMonth();
    this.pending = null;
  }

  ngOnInit(): void {
    // @Input is bound after construction — derive the visible month from the applied date here
    this.pending = this.selectedDate;
    if (this.selectedDate) {
      const [y, m] = this.selectedDate.split('-').map((v) => parseInt(v, 10));
      if (y && m) {
        this.viewYear = y;
        this.viewMonth = m - 1;
      }
    }
    this.weeks = this.buildWeeks();
  }

  get monthLabel(): string {
    return `${MONTH_NAMES[this.viewMonth]} ${this.viewYear}`;
  }

  weeks: DayCell[][] = [];

  private buildWeeks(): DayCell[][] {
    const firstOfMonth = new Date(this.viewYear, this.viewMonth, 1);
    const startWeekday = firstOfMonth.getDay(); // 0=Sun
    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(this.viewYear, this.viewMonth, 0).getDate();

    const cells: DayCell[] = [];
    // leading days from previous month (shown, but not selectable/highlighted)
    for (let i = startWeekday - 1; i >= 0; i--) {
      cells.push({ day: daysInPrevMonth - i, iso: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${this.viewYear}-${String(this.viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, iso });
    }
    let trailing = 1;
    while (cells.length % 7 !== 0) {
      cells.push({ day: trailing, iso: null });
      trailing += 1;
    }
    const weeks: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }

  prevMonth(): void {
    this.viewMonth -= 1;
    if (this.viewMonth < 0) {
      this.viewMonth = 11;
      this.viewYear -= 1;
    }
    this.weeks = this.buildWeeks();
  }

  nextMonth(): void {
    this.viewMonth += 1;
    if (this.viewMonth > 11) {
      this.viewMonth = 0;
      this.viewYear += 1;
    }
    this.weeks = this.buildWeeks();
  }

  selectDay(cell: DayCell): void {
    if (!cell.iso) {
      return;
    }
    this.pending = cell.iso;
  }

  applyNow(): void {
    this.apply.emit(this.pending);
  }
}
