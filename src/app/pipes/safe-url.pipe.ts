import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safeUrl',
  standalone: true
})
export class SafeUrlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(url: string | null | undefined): SafeUrl {
    if (!url) {
      return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500';
    }
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }
}
