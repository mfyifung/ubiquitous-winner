import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface NavItem {
  label: string;
  icon: string | null; // asset filename under /assets/icons, or null (no recoverable design icon)
  active?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  readonly mainNav: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard' },
    { label: 'Products', icon: 'product' },
    { label: 'Favorites', icon: 'favourites' },
    { label: 'Inbox', icon: 'chat' },
    { label: 'Order Lists', icon: 'orderlist', active: true },
    { label: 'Product Stock', icon: 'stock' },
  ];

  readonly pagesNav: NavItem[] = [
    { label: 'Pricing', icon: 'pricing' },
    { label: 'Calender', icon: 'calendar' },
    { label: 'To-Do', icon: 'todo' },
    { label: 'Contact', icon: 'contact' },
    { label: 'Invoice', icon: 'invoice' },
    { label: 'UI Elements', icon: 'uielement' },
    { label: 'Team', icon: 'team' },
    { label: 'Table', icon: null },
  ];

  readonly bottomNav: NavItem[] = [
    { label: 'Settings', icon: 'settings' },
    { label: 'Logout', icon: null },
  ];
}
