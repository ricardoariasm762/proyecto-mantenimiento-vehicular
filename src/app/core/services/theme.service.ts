import { Injectable, signal, effect } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'veloce-theme-preference';

  // Preferencia del usuario: 'system', 'light' o 'dark'
  public readonly themePreference = signal<ThemePreference>('system');

  // Tema resuelto actualmente activo ('light' o 'dark')
  public readonly activeTheme = signal<ResolvedTheme>('dark');

  // Consulta de medios del sistema
  private mediaQuery: MediaQueryList | null = null;

  constructor() {
    this.initTheme();

    // Reaccionar a cambios en la preferencia del usuario
    effect(() => {
      const pref = this.themePreference();
      this.applyTheme(pref);
    });
  }

  private initTheme(): void {
    if (typeof window === 'undefined') return;

    // Detectar si el usuario ya tenía una preferencia guardada en localStorage
    const saved = localStorage.getItem(this.STORAGE_KEY) as ThemePreference | null;
    const initialPref: ThemePreference = saved && ['light', 'dark', 'system'].includes(saved)
      ? saved
      : 'system';

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Escuchar cambios automáticos del sistema operativo en tiempo real
    this.mediaQuery.addEventListener('change', (e) => {
      if (this.themePreference() === 'system') {
        const resolved: ResolvedTheme = e.matches ? 'dark' : 'light';
        this.updateDocumentTheme(resolved);
        this.activeTheme.set(resolved);
      }
    });

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
      const systemDark = this.mediaQuery ? this.mediaQuery.matches : window.matchMedia('(prefers-color-scheme: dark)').matches;
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
