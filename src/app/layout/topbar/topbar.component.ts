import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {}
