Que incluye el proyecto:
1. Usuarios en base de datos
2. Registro de usuarios.
3. Autenticación básica con login y password
4. Verificación de autenticación.
5. Sesión de usuario con cookie
6. Rutas Protegidas
7. Json Web Tokens
8. Middlewares
9. Cerrar sesión
10. Refresh Token

El .env debe llevar:
APP_PORT=
NODE_ENV= desarrollo o produccion
FRONTEND_URL=  
BACKEND_URL=

#Database Configuration
HOST=
USER=
PASSWORD=
DB=
PORT=

#JWT CONFIGURATION
SECRET_JWT_KEY=

# Protección de tráfico
TRUST_PROXY=false

La API aplica un límite global de 120 solicitudes por IP/minuto, límites más estrictos
para autenticación y un body máximo de 100 KB. En producción, `TRUST_PROXY=true` solo
debe usarse cuando la API está detrás de un proxy inverso/CDN controlado por ti.
Para ataques volumétricos (DDoS de red), publica la API detrás de un WAF/CDN como
Cloudflare, AWS WAF/Shield o el servicio equivalente de tu proveedor; el limitador
en Node no puede absorber por sí solo un ataque que sature la red o el balanceador.
