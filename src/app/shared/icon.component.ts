import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICONS } from './icons';

/**
 * Renders one of the design's real vector icons (extracted from the .fig as SVG
 * path geometry with its own per-path fills). Angular strips <svg> from a plain
 * [innerHTML] binding, so the trusted markup is bypassed explicitly — the
 * source is a build-time constant (icons.ts), never user input.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<span class="icon-slot" [innerHTML]="html"></span>`,
  styles: [`:host{display:inline-block;line-height:0}.icon-slot{display:block;line-height:0}`],
})
export class IconComponent {
  html: SafeHtml = '';
  constructor(private readonly sanitizer: DomSanitizer) {}

  @Input() set name(value: string) {
    this.html = this.sanitizer.bypassSecurityTrustHtml(ICONS[value] ?? '');
  }
}
