import { Component } from '@angular/core';
import { ShellComponent } from './layout/shell/shell.component';
import { OrderListComponent } from './order-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShellComponent, OrderListComponent],
  template: `
    <app-shell>
      <app-order-list></app-order-list>
    </app-shell>
  `,
})
export class AppComponent {}
