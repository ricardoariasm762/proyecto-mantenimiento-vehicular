# Guía de Autenticación Frontend con Angular Signals y RBAC

Especificación del subsistema de seguridad y control de acceso basado en roles en el cliente Angular.

---

## 1. Arquitectura de Estado con Angular Signals

El servicio `AuthService` utiliza `signal` para gestionar la reactividad del usuario autenticado:
- `currentUser = signal<AuthUser | null>(this.loadUserFromStorage())`: Almacena el token JWT y los datos del perfil.
- `isAuthenticated = computed(() => !!this.currentUser())`: Señal derivada que indica si hay una sesión activa.
- `isDriver = computed(() => this.currentUser()?.role === 'ROLE_DRIVER')`: Comprobación reactiva para vistas de conductor.
- `isMechanic = computed(() => this.currentUser()?.role === 'ROLE_MECHANIC')`: Comprobación reactiva para mecánicos.

---

## 2. Inyección de Tokens (HTTP Interceptor)

`authInterceptor` intercepta de forma transparente cada petición HTTP:
- Adjunta el encabezado `Authorization: Bearer <TOKEN>` cuando la URL coincide con la del backend (`localhost:8082` o la URL de producción en Render).
- Si el backend responde con un error `401 Unauthorized`, el interceptor detecta la expiración del token y ejecuta `authService.logout()`.

---

## 3. Vistas Adaptativas por Rol

- **Modo Conductor (`ROLE_DRIVER`)**:
  - Habilitación completa del dictado por voz de síntomas vehiculares.
  - Formulario de telemetría y diagnóstico predictivo.
  - Bitácora restringida a los vehículos asignados al conductor.
- **Modo Mecánico (`ROLE_MECHANIC`)**:
  - Consulta y auditoría global de cualquier placa automotriz.
  - Panel de emisión de órdenes de taller con priorización (Crítica, Alta, Media, Baja).

