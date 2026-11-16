# Arquitectura de Frontend - Sistema Predictivo de Mantenimiento Vehicular

## 1. Diseño Blueprint Industrial
La interfaz está construida siguiendo la estética técnica de plano de ingeniería automotriz:
- **Fondo base**: `Blueprint Deep Navy` (`#07101e`).
- **Líneas de cota y cuadrícula**: Cyan fluorescente semitransparente (`rgba(0, 229, 255, 0.15)`).
- **Acentos de acción**: Naranja automotriz de alta visibilidad (`#ff6d00`).
- **Tipografía**: Fuentes monoespaciadas técnicas para telemetría, lecturas numéricas y códigos DTC.

## 2. Gestión Reactiva de Estado (Angular Signals)
- Señales en `AuthService` para estado de autenticación reactivo sin suscripciones manuales.
- Componentes standalone en Angular 19 con control de flujo `@if` y `@for`.
- Interceptor HTTP funcional para inyección de token Bearer en solicitudes salientes.

