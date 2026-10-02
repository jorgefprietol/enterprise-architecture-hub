# Operación

## Desarrollo sin contenedores

Se requieren .NET SDK 10, JDK 21, Maven 3.9 y Node.js 22. Iniciar Java con `mvn -f java/pom.xml spring-boot:run`. El puerto es 8092.

```powershell
$env:ASPNETCORE_URLS = 'http://localhost:8091'
$env:EditorToken = '<clave local>'
$env:DecisionEngineUrl = 'http://localhost:8092'
dotnet run --project csharp/Architecture.Api
```

En otra terminal, `cd web`, `npm ci`, `npm run dev`. Vite reenvía `/api` a 8091. OpenAPI se consulta directamente en el catálogo.

## Contenedores

El esquema se crea mediante la migración `InitialCatalog`, guardada en el repositorio. Para cambios futuros, ejecutar `dotnet tool restore`, agregar una migración con `dotnet ef migrations add <Nombre> --project csharp/Architecture.Api`, y verificar actualización y restauración antes de entregar. La instancia única aplica las migraciones al iniciar. No usar `EnsureCreated` sobre este almacenamiento.

`docker compose ps` muestra estado y salud. `docker compose logs --tail=100 catalog decisions web` aporta diagnóstico. Reiniciar el catálogo conserva el volumen y no vuelve a sembrar datos. La salud de Java usa Actuator; la del catálogo verifica acceso al almacenamiento. La salud del catálogo no implica disponibilidad del motor remoto; `/api/priorities` verifica el camino completo.

Si un host compartido agotó los rangos automáticos de red, crear un `compose.override.yaml` local con una subred libre después de revisar `docker network inspect`. Este archivo está ignorado por Git. Ejemplo para un rango que no esté asignado en ese host:

```yaml
networks:
  default:
    ipam:
      config:
        - subnet: 10.254.195.0/28
```

`docker compose stop` libera los procesos del proyecto y conserva los contenedores, la red y el volumen. `docker compose up -d --wait` restaura el servicio con los mismos datos.

La variable `SeedDemo=false` permite iniciar una base vacía cambiando el valor en Compose; no borra registros existentes. El catálogo admite un máximo de texto de 2000 caracteres en campos obligatorios. Mantener el token fuera del historial de comandos y del control de versiones.

## Respaldo

Para un respaldo consistente, detener `catalog`, copiar el contenido de su volumen mediante una tarea de mantenimiento y volver a iniciarlo. Conservar el respaldo fuera del mismo host y verificar una restauración. No copiar un archivo SQLite activo sin usar su API de backup o incluir correctamente el estado WAL. No borrar el volumen salvo que se busque descartar los datos locales.

## Imágenes publicadas

El pipeline publica `ghcr.io/jorgefprietol/enterprise-architecture-hub-{catalog,decisions,web}`. Seleccionar la etiqueta `sha-<commit>` o un digest inmutable para una entrega reproducible; `latest` sigue la última construcción aprobada. La política de visibilidad del paquete en GitHub es independiente de la visibilidad del repositorio.

La entrega automática termina en el registro de imágenes. No hay despliegue a un proveedor cloud ni promesa de disponibilidad pública. El servicio local se abre en `http://localhost:18145`.

El puerto predeterminado `18145` permite coexistir con los otros proyectos del equipo. Si ya existe un archivo `.env` de una revisión anterior, actualizar solo `WEB_PORT=18145` y conservar la clave de edición. Después ejecutar `docker compose up -d --no-build --wait --wait-timeout 300`; Compose aplica el nuevo puerto y conserva el volumen de datos.
