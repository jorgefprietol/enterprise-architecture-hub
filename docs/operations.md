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

`docker compose ps` muestra estado y salud. `docker compose logs --tail=100 catalog decisions web` aporta diagnóstico. Reiniciar el catálogo conserva el volumen y no vuelve a sembrar datos. La salud de Java usa Actuator; la del catálogo verifica acceso al almacenamiento. La salud del catálogo no implica disponibilidad del motor remoto; `/api/priorities` verifica el camino completo.

La variable `SeedDemo=false` permite iniciar una base vacía cambiando el valor en Compose; no borra registros existentes. El catálogo admite un máximo de texto de 2000 caracteres en campos obligatorios. Mantener el token fuera del historial de comandos y del control de versiones.

## Respaldo

Para un respaldo consistente, detener `catalog`, copiar el contenido de su volumen mediante una tarea de mantenimiento y volver a iniciarlo. Conservar el respaldo fuera del mismo host y verificar una restauración. No copiar un archivo SQLite activo sin usar su API de backup o incluir correctamente el estado WAL. No borrar el volumen salvo que se busque descartar los datos locales.

## Imágenes publicadas

El pipeline publica `ghcr.io/jorgefprietol/enterprise-architecture-hub-{catalog,decisions,web}`. Seleccionar la etiqueta `sha-<commit>` o un digest inmutable para una entrega reproducible; `latest` sigue la última construcción aprobada. La política de visibilidad del paquete en GitHub es independiente de la visibilidad del repositorio.

La entrega automática termina en el registro de imágenes. No hay despliegue a un proveedor cloud ni promesa de disponibilidad pública. El servicio local se abre en `http://localhost:18095`.
