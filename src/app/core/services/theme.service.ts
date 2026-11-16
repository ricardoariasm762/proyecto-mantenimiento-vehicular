import { Injectable, signal, effect } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'veloce-theme-preference';

  // User preference: 'system', 'light' or 'dark'
  public readonly themePreference = signal<ThemePreference>('system');

  // Currently active resolved theme ('light' or 'dark')
  public readonly activeTheme = signal<ResolvedTheme>('dark');

  // System media query
  private mediaQuery: MediaQueryList | null = null;

  constructor() {
    this.initTheme();

    // React to user preference changes
    effect(() => {
      const pref = this.themePreference();
      this.applyTheme(pref);
    });
  }

  private initTheme(): void {
    if (typeof window === 'undefined') return;

    // Detect if user already saved a preference in localStorage
    const saved = localStorage.getItem(this.STORAGE_KEY) as ThemePreference | null;
    const initialPref: ThemePreference = saved && ['light', 'dark', 'system'].includes(saved)
      ? saved
      : 'system';

    if (typeof window.matchMedia === 'function') {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      // Listen for live operating system theme changes in real time
      this.mediaQuery.addEventListener?.('change', (e) => {
        if (this.themePreference() === 'system') {
          const resolved: ResolvedTheme = e.matches ? 'dark' : 'light';
          this.updateDocumentTheme(resolved);
          this.activeTheme.set(resolved);
        }
      });
    }

    this.themePreference.set(initialPref);
  }

  public setTheme(pref: ThemePreference): void {
    this.themePreference.set(pref);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, pref);
    }
  }

  public cycleTheme(): void {
    const current = this.themePreference();
    if (current === 'system') {
      this.setTheme('dark');
    } else if (current === 'dark') {
      this.setTheme('light');
    } else {
      this.setTheme('system');
    }
  }

  private applyTheme(pref: ThemePreference): void {
    if (typeof window === 'undefined') return;

    let resolved: ResolvedTheme = 'dark';

    if (pref === 'system') {
      const systemDark = this.mediaQuery
        ? this.mediaQuery.matches
        : (typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)').matches : true);
      resolved = systemDark ? 'dark' : 'light';
    } else {
      resolved = pref;
    }

    this.updateDocumentTheme(resolved);
    this.activeTheme.set(resolved);
  }

  private updateDocumentTheme(theme: ResolvedTheme): void {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }
}
