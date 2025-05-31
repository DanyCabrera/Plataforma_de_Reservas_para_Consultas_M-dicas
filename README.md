# Plataforma de Reservas

Este es un sistema de reservas basado en microservicios que incluye un frontend, un servicio de agenda y un servicio de notificaciones.

## Requisitos del Sistema

### Requisitos Funcionales

1. **Gestión de Citas Médicas**
   - Los pacientes pueden programar, modificar y cancelar citas médicas
   - Los médicos pueden ver su agenda diaria y semanal
   - El sistema debe validar la disponibilidad de horarios antes de confirmar una cita

2. **Autenticación y Autorización**
   - Registro e inicio de sesión para pacientes y médicos
   - Diferentes niveles de acceso según el rol (paciente, médico, administrador)
   - Recuperación de contraseña mediante correo electrónico

3. **Notificaciones**
   - Envío de recordatorios de citas vía correo electrónico
   - Notificaciones push para recordatorios de citas próximas
   - Alertas para cambios o cancelaciones de citas

4. **Gestión de Perfiles**
   - Los pacientes pueden ver su historial de citas
   - Los médicos pueden gestionar su disponibilidad y especialidad
   - Actualización de información personal y de contacto

5. **Búsqueda y Filtros**
   - Búsqueda de médicos por especialidad
   - Filtrado de horarios disponibles por fecha
   - Visualización de citas por período (diario, semanal, mensual)

6. **Reportes y Estadísticas**
   - Generación de reportes de asistencia
   - Estadísticas de citas por médico y especialidad
   - Historial de consultas por paciente

### Requisitos No Funcionales

1. **Rendimiento**
   - Tiempo de respuesta del sistema < 2 segundos
   - Soporte para mínimo 1000 usuarios concurrentes
   - Disponibilidad del sistema 99.9% del tiempo

2. **Seguridad**
   - Encriptación de datos sensibles (información médica)
   - Cumplimiento de normativas de protección de datos
   - Registro de auditoría de todas las acciones del sistema

3. **Usabilidad**
   - Interfaz intuitiva y responsive para todos los dispositivos
   - Accesibilidad WCAG 2.1 nivel AA
   - Soporte multiidioma (español e inglés)

4. **Escalabilidad**
   - Arquitectura microservicios para escalar componentes independientemente
   - Capacidad de aumentar recursos según demanda
   - Optimización de consultas a base de datos

5. **Mantenibilidad**
   - Código documentado y siguiendo estándares
   - Logs detallados para debugging
   - Versionado de API para actualizaciones sin interrupciones

6. **Integración**
   - Compatibilidad con sistemas de historiales médicos
   - APIs documentadas para integración con terceros
   - Soporte para exportación de datos en formatos estándar

## Tecnologías Utilizadas

### Frontend
- React.js 19
- Bootstrap 5 para componentes de interfaz
- React Router v6 para navegación
- Framer Motion para animaciones
- React Icons para iconografía
- Node Fetch para peticiones HTTP

### Servicio de Agenda
- Node.js con Express
- JavaScript
- PostgreSQL como base de datos
- JWT para autenticación

### Servicio de Notificaciones
- Node.js con Express
- Nodemailer para envío de correos
- Sistema de colas para manejo asíncrono de notificaciones
- Firebase Cloud Messaging (FCM) para notificaciones push
- Web Push API para notificaciones en navegadores

### Infraestructura
- Docker y Docker Compose para containerización
- PostgreSQL 15 como base de datos principal
- Nginx como proxy inverso (opcional)

## Justificación de la Arquitectura

La arquitectura del sistema ha sido diseñada siguiendo los principios de microservicios por las siguientes razones:

### Separación de Responsabilidades
- **Frontend**: Se mantiene como una aplicación independiente para permitir una mejor experiencia de usuario y facilitar el desarrollo de la interfaz.
- **Servicio de Agenda**: Maneja toda la lógica de negocio relacionada con las reservas, permitiendo escalar este componente según la demanda.
- **Servicio de Notificaciones**: Al estar separado, permite manejar las notificaciones de forma asíncrona sin afectar el rendimiento del sistema principal.

### Ventajas de la Arquitectura
1. **Escalabilidad**: Cada servicio puede escalar independientemente según sus necesidades específicas.
2. **Mantenibilidad**: Los equipos pueden trabajar en diferentes servicios sin afectar a los demás.
3. **Resiliencia**: Un fallo en un servicio no afecta al funcionamiento de los demás.
4. **Flexibilidad Tecnológica**: Cada servicio puede utilizar la tecnología más adecuada para su propósito.

### Consideraciones de Diseño
- **Comunicación entre Servicios**: Se utiliza comunicación HTTP/REST para mantener la simplicidad y la interoperabilidad.
- **Base de Datos**: PostgreSQL fue elegido por su robustez y capacidad para manejar transacciones complejas.
- **Containerización**: Docker permite un despliegue consistente y aislado de cada servicio.
- **Autenticación**: JWT proporciona una solución segura y escalable para la autenticación entre servicios.

## Diagrama de Arquitectura

```
                                    [Cliente Web]
                                         │
                                         ▼
                                    [Nginx Proxy]
                                         │
                                         ▼
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
              [Frontend]      [Servicio Agenda]  [Servicio Notif.]
                    │                 │                 │
                    │                 │                 │
                    │                 ▼                 │
                    │           [PostgreSQL]           │
                    │                 │                 │
                    │                 │                 │
                    └─────────────────┼─────────────────┘
                                      │
                                      ▼
                               [Firebase FCM]
                                      │
                                      ▼
                               [Notificaciones]
```

### Descripción de Componentes

1. **Cliente Web**
   - Navegadores web
   - Aplicaciones móviles
   - Interfaz de usuario responsive

2. **Nginx Proxy**
   - Balanceo de carga
   - SSL/TLS termination
   - Enrutamiento de peticiones

3. **Frontend (Puerto 3000)**
   - React.js 19
   - Bootstrap 5
   - React Router v6
   - Framer Motion

4. **Servicio de Agenda (Puerto 3002)**
   - Node.js + Express
   - JWT Authentication
   - PostgreSQL Client
   - API REST

5. **Servicio de Notificaciones (Puerto 4000)**
   - Node.js + Express
   - Nodemailer
   - Firebase Admin SDK
   - Web Push API

6. **Base de Datos**
   - PostgreSQL 15
   - Persistencia de datos
   - Transacciones ACID

7. **Firebase Cloud Messaging**
   - Notificaciones push
   - Mensajería en tiempo real
   - Gestión de tokens

### Flujo de Datos

1. **Flujo de Autenticación**
   ```
   Cliente → Frontend → Servicio Agenda → JWT → Cliente
   ```

2. **Flujo de Reserva**
   ```
   Cliente → Frontend → Servicio Agenda → PostgreSQL
                              ↓
                        Servicio Notif. → Firebase FCM
   ```

3. **Flujo de Notificaciones**
   ```
   Servicio Notif. → Firebase FCM → Cliente
   Servicio Notif. → Nodemailer → Email
   ```

## Configuraciones Específicas

### Base de Datos
```env
POSTGRES_DB=agenda
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
PORT=5434
```

### Servicio de Agenda
```env
DATABASE_URL=postgres://postgres:postgres@agenda-db:5432/agenda
PORT=3002
```

### Servicio de Notificaciones
```env
PORT=4000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

### Frontend
```env
NODE_OPTIONS=--openssl-legacy-provider
PORT=3000
```

## Requisitos Previos

- Docker
- Docker Compose
- Node.js (versión 14 o superior)
- npm o yarn

## Instalación de Dependencias

### Frontend
```bash
cd frontend
npm install
# Instalar dependencias específicas
npm install bootstrap@5.3.6
npm install framer-motion@12.15.0
npm install react-icons@5.5.0
npm install react-router-dom@6.30.1
npm install node-fetch@3.3.2
```

### Servicio de Agenda
```bash
cd agenda-service
npm install
# Instalar dependencias específicas
npm install express
npm install jsonwebtoken
npm install pg
npm install cors
npm install dotenv
```

### Servicio de Notificaciones
```bash
cd notificaciones-service
npm install
# Instalar dependencias específicas
npm install express
npm install nodemailer
npm install firebase-admin
npm install web-push
npm install cors
npm install dotenv
```

## Estructura del Proyecto

El proyecto está compuesto por los siguientes servicios:

- **Frontend**: Interfaz de usuario (puerto 3000)
- **Agenda Service**: Servicio de gestión de reservas (puerto 3002)
- **Notificaciones Service**: Servicio de envío de notificaciones (puerto 4000)
- **Base de Datos**: PostgreSQL (puerto 5434)

## Configuración

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd plataforma-reservas
```

2. Configura las variables de entorno:
   - El servicio de notificaciones requiere credenciales de correo electrónico
   - Las credenciales de la base de datos están configuradas en el docker-compose.yml

## Ejecución del Sistema

1. Inicia todos los servicios usando Docker Compose:
```bash
docker-compose up --build
```

Este comando:
- Construirá las imágenes de Docker para cada servicio
- Iniciará la base de datos PostgreSQL
- Iniciará el servicio de agenda
- Iniciará el servicio de notificaciones
- Iniciará el frontend

2. Accede a la aplicación:
   - Frontend: http://localhost:3000
   - API de Agenda: http://localhost:3002
   - API de Notificaciones: http://localhost:4000

## Detener el Sistema

Para detener todos los servicios:
```bash
docker-compose down
```

Para detener los servicios y eliminar los volúmenes (incluyendo los datos de la base de datos):
```bash
docker-compose down -v
```

## Puertos Utilizados

- Frontend: 3000
- Servicio de Agenda: 3002
- Servicio de Notificaciones: 4000
- Base de Datos PostgreSQL: 5434

## Notas Adicionales

- La base de datos PostgreSQL persiste sus datos en un volumen Docker
- El servicio de notificaciones está configurado para enviar correos electrónicos
- El frontend se comunica con el servicio de agenda para gestionar las reservas
