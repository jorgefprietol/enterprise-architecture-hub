# Arquitectura y decisiones

## 001 — Separar catálogo y cálculo

El catálogo C# conserva objetivos, nodos, relaciones, evaluaciones, activos, iniciativas y decisiones. El motor Java solo recibe una proyección de evaluación y costo; no lee la base de datos. Cada servicio puede evolucionar por separado. El costo es una llamada HTTP adicional; el cliente C# aplica un tiempo límite de 10 segundos y comunica indisponibilidad mediante 503. La aplicación muestra el error manteniendo navegables los catálogos.

## 002 — React con TypeScript

El producto requiere tablas, formularios, navegación contextual y escenarios interactivos. React mantiene el cliente acotado, con tipos compartidos, composición de vistas y una compilación estática que se sirve mediante Nginx. NestJS añadiría otro servidor sin responsabilidad nueva, y Angular aumentaría la infraestructura de un panel de este alcance.

## 003 — Persistencia relacional de nodo único

EF Core y SQLite ofrecen restricciones de integridad, índices únicos y escrituras transaccionales sin otro proceso de almacenamiento. Las entidades y el evento de auditoría se guardan en la misma transacción de `SaveChanges`. La semilla completa tiene una transacción explícita y se aplica una sola vez. Las migraciones EF Core versionadas crean el esquema y se aplican al iniciar la instancia del catálogo. El historial de migraciones permite inspeccionar el estado del almacenamiento. Los cambios posteriores deben agregar una migración y verificar su compatibilidad con el volumen existente.

SQLite define el límite operativo: una sola instancia del catálogo con volumen local, sin escalado horizontal de escritura. Una migración a PostgreSQL y una identidad por usuario son pasos necesarios para un servicio multiusuario a escala. Cada entidad tiene una versión marcada como token de concurrencia: la edición incluye la versión leída y recibe 409 si otra sesión ya modificó el registro. EF también protege contra cambios concurrentes entre lectura y escritura.

## 004 — Reglas de alcance

Solo los nodos N4 se enlazan a objetivos, evaluaciones, activos e iniciativas. N1 no tiene padre; N2 a N5 requieren un padre del nivel inmediatamente anterior. Se rechazan duplicados normalizados dentro del padre, cambios de nivel que invalidan hijos o relaciones, duplicados de vínculos y referencias inexistentes. Un cambio de iniciativa valida la cartera completa para impedir ciclos, autorreferencias y dependencias en trimestres posteriores.

El validador de calidad encuentra capacidades sin objetivo, sin evidencia, sin activos, sin recorrido y nombres potencialmente sobrecargados. Las reglas lingüísticas son señales para revisión humana, no una certificación semántica ni un algoritmo de normalización automática.

## 005 — Modelo de inversión explicable

Las dimensiones y ponderaciones se exponen en la interfaz y en el README. Las decisiones pueden revisarse por capacidad. Los pesos de contribución son independientes por objetivo; su suma se limita a 1 para el cálculo y no se interpreta como distribución probabilística. El costo es la suma de iniciativas no completadas. La simulación considera esa inversión por capacidad como indivisible. No declara retornos financieros reales ni garantiza que un presupuesto seleccionado cubra dependencias de ejecución.

## 006 — Seguridad y operación

El despliegue local usa un token de edición generado por el operador. Las lecturas son públicas dentro del entorno de demostración. Nginx agrega una política de contenido y sirve cliente y API bajo un origen. Los tres contenedores se ejecutan sin privilegios de root; el servidor web usa un sistema de archivos de solo lectura. Los secretos se inyectan en tiempo de ejecución. Java no se publica en el host.

El token compartido identifica al rol `editor`, no a una persona. Antes de exposición externa se requiere OIDC, autorización por roles, auditoría con identidad real, TLS, rate limiting y políticas de respaldo. [Seguridad](../SECURITY.md).
