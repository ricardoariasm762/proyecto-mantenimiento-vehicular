import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  public readonly themeService = inject(ThemeService);
  public readonly currentTimeUtc = signal<string>('14:28:09.412 UTC');
  private clockIntervalId: any = null;

  ngOnInit(): void {
    this.startClock();
  }

  ngOnDestroy(): void {
    if (this.clockIntervalId) clearInterval(this.clockIntervalId);
  }

  private startClock(): void {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      const ms = String(now.getUTCMilliseconds()).padStart(3, '0');
      this.currentTimeUtc.set(`${h}:${m}:${s}.${ms} UTC`);
    };
    updateTime();
    this.clockIntervalId = setInterval(updateTime, 95);
  }
}
