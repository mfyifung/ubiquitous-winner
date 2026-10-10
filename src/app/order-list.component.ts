import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { OrdersService } from './orders.service';
import { Order, OrdersMeta } from './order.model';
import { DatePopoverComponent } from './filter-popover/date-popover.component';
import { MultiSelectPopoverComponent } from './filter-popover/multi-select-popover.component';
import { IconComponent } from './shared/icon.component';

type PopoverKind = 'date' | 'type' | 'status' | null;

const STATUS_COLORS: Record<string, string> = {
  Completed: '#00B69B',
  Processing: '#6226EF',
  Rejected: '#EF3826',
  'On Hold': '#FFA756',
  'In Transit': '#BA29FF',
};
const DEFAULT_STATUS_COLOR = '#565656';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, DatePopoverComponent, MultiSelectPopoverComponent, IconComponent],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.css',
})
export class OrderListComponent implements OnInit {
  meta: OrdersMeta = { types: [], statuses: [] };
  allOrders: Order[] = [];

  selectedDate: string | null = null;
  selectedTypes: string[] = [];
  selectedStatuses: string[] = [];

  openPopover: PopoverKind = null;

  page = 1;
  readonly pageSize = 9;

  loading = false;
  error: string | null = null;
  metaError: string | null = null;

  constructor(private readonly ordersService: OrdersService) {}

  ngOnInit(): void {
    this.ordersService.getMeta().subscribe({
      next: (meta) => (this.meta = meta),
      error: () => (this.metaError = 'Failed to load filter options'),
    });
    this.reload();
  }

  private ordersSub?: Subscription;

  reload(): void {
    this.ordersSub?.unsubscribe(); // drop a stale in-flight request
    this.loading = true;
    this.error = null;
    this.ordersSub = this.ordersService
      .getOrders({
        date: this.selectedDate,
        type: this.selectedTypes,
        status: this.selectedStatuses,
      })
      .subscribe({
        next: (orders) => {
          this.allOrders = orders;
          this.loading = false;
        },
        error: () => {
          this.allOrders = []; // never show stale, unfiltered rows under an applied filter
          this.page = 1;
          this.error = 'Failed to load orders';
          this.loading = false;
        },
      });
  }

  get hasActiveFilters(): boolean {
    return !!this.selectedDate || this.selectedTypes.length > 0 || this.selectedStatuses.length > 0;
  }

  get totalCount(): number {
    return this.allOrders.length;
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  get pageStart(): number {
    return this.totalCount === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.page * this.pageSize, this.totalCount);
  }

  get pagedOrders(): Order[] {
    const start = (this.page - 1) * this.pageSize;
    return this.allOrders.slice(start, start + this.pageSize);
  }

  toggle(kind: PopoverKind): void {
    this.openPopover = this.openPopover === kind ? null : kind;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const path = event.composedPath() as HTMLElement[];
    const inside = path.some(
      (el) => el.classList?.contains('filter-control') || el.classList?.contains('popover-anchor'),
    );
    if (!inside) {
      this.openPopover = null;
    }
  }

  onDateApply(date: string | null): void {
    this.selectedDate = date;
    this.openPopover = null;
    this.page = 1;
    this.reload();
  }

  onTypeApply(types: string[]): void {
    this.selectedTypes = types;
    this.openPopover = null;
    this.page = 1;
    this.reload();
  }

  onStatusApply(statuses: string[]): void {
    this.selectedStatuses = statuses;
    this.openPopover = null;
    this.page = 1;
    this.reload();
  }

  resetFilters(): void {
    this.selectedDate = null;
    this.selectedTypes = [];
    this.selectedStatuses = [];
    this.openPopover = null;
    this.page = 1;
    this.reload();
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page -= 1;
    }
  }

  nextPage(): void {
    if (this.page < this.pageCount) {
      this.page += 1;
    }
  }

  /** Frame #11 "Prev. Date" / "Next Date": move the applied date by one day and re-query the server. */
  stepDate(delta: number): void {
    if (!this.selectedDate) {
      return;
    }
    const [y, m, d] = this.selectedDate.split('-').map((v) => parseInt(v, 10));
    const next = new Date(Date.UTC(y, m - 1, d + delta));
    this.onDateApply(next.toISOString().slice(0, 10));
  }

  formattedDate(iso: string): string {
    const [y, m, d] = iso.split('-').map((v) => parseInt(v, 10));
    if (!y || !m || !d) {
      return iso;
    }
    return `${String(d).padStart(2, '0')} ${MONTH_NAMES[m - 1]} ${y}`;
  }

  formattedDateLabel(iso: string | null): string {
    if (!iso) {
      return 'Date';
    }
    const [y, m, d] = iso.split('-').map((v) => parseInt(v, 10));
    return `${String(d).padStart(2, '0')} ${MONTH_NAMES[m - 1]} ${y}`;
  }

  statusColor(status: string): string {
    return STATUS_COLORS[status] ?? DEFAULT_STATUS_COLOR;
  }

  statusBg(status: string): string {
    const hex = this.statusColor(status);
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.2)`;
  }
}
