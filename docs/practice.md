# Práctica de arquitectura empresarial

## Alcance y resultados

Antes de modelar, el equipo registra el dominio incluido, el patrocinador, los resultados de negocio, el nivel de detalle requerido y los elementos excluidos. El mapa usa nombres de niveles completos: estrategia, dominio, subdominio, capacidad y subcapacidad. Una capacidad describe **qué resultado puede producir el negocio**, con independencia de la aplicación, proceso o proveedor que la implementa.

Los cinco resultados de la práctica son un mapa de capacidades, una evaluación con evidencia, un portafolio priorizado, una arquitectura objetivo trazable y una hoja de ruta con responsables. La plataforma conecta esos resultados mediante IDs y relaciones explícitas, en lugar de tratarlos como documentos aislados.

## Criterios de modelado

Una entrada útil expresa un resultado de negocio, tiene un alcance definido, pertenece a un único lugar de la jerarquía, conserva significado al cambiar la tecnología, tiene responsable, admite medición, se distingue de sus vecinas y puede descomponerse sin mezclar niveles. Se usa un calificador de dominio: «Gestión de precios comerciales» comunica más alcance que «Gestión de precios».

Para revisar una lista de entrada: confirmar alcance; clasificar cada entrada; separar sistemas y procesos en activos; normalizar nombres; identificar sinónimos; consolidar duplicados; dividir resultados independientes; verificar padres; asignar definiciones y responsables; registrar decisiones de revisión; publicar la versión acordada. La normalización automática del servicio cubre espacios, mayúsculas y acentos. Las fusiones de sinónimos y las decisiones semánticas requieren revisión humana.

## Revisión del mapa

| Control                  | Evidencia                                                |
| ------------------------ | -------------------------------------------------------- |
| Alcance aprobado         | Dominio, patrocinador y exclusiones definidos            |
| Nivel explícito          | Cada nodo usa N1–N5                                      |
| Padre inmediato          | Referencia al nivel anterior                             |
| Resultado de negocio     | Definición sin depender de un proveedor                  |
| Nombre calificado        | Dominio identificable                                    |
| Ausencia de duplicados   | Revisión de sinónimos y control normalizado              |
| Descomposición coherente | Hijos con alcance menor que su padre                     |
| Responsable              | Persona o equipo accountable en el contexto real         |
| Objetivo estratégico     | Relación ponderada por capacidad                         |
| Recorrido                | Experiencia donde aparece el resultado                   |
| Madurez con evidencia    | Muestra, fecha, evaluador y cuatro dimensiones           |
| Soporte tecnológico      | Procesos, datos, aplicaciones y tecnologías relacionados |
| Decisiones e iniciativas | Elección defendible y ejecución calendarizada            |

La plataforma impone integridad estructural y señales de calidad; esta revisión agrega juicio de negocio. El mapa no convierte un nombre válido en una capacidad útil por sí solo.

## Evidencia y calibración

L1 representa una práctica inicial; L2, repetición parcial; L3, definición consistente; L4, control mediante medición; L5, mejora sistemática. Cada dimensión se puntúa por separado. La evidencia debe describir el alcance de la muestra y permitir al revisor reproducir el razonamiento. Una evaluación posterior reemplaza el estado vigente; el registro de auditoría identifica la operación, pero no almacena versiones completas históricas de cada puntuación.

## Equipos y arquitectura objetivo

El dueño de la capacidad define el resultado; el equipo constructor decide cómo implementarlo dentro de las restricciones; el responsable de la métrica comprueba el efecto. Un equipo alineado al flujo conserva un resultado de negocio de extremo a extremo. Una plataforma provee capacidades internas reutilizables; un habilitador ayuda a desarrollar una práctica; un subsistema especializado concentra conocimientos difíciles de distribuir. La aplicación registra la asignación; no deduce automáticamente un organigrama óptimo.

La arquitectura actual y objetivo se representan mediante estados de activos y relaciones justificadas. Los ADR documentan contexto, elección y compromisos. El caso Meridian propone separar la orquestación de pedidos, gobernar datos de disponibilidad y usar contratos de eventos; estas propuestas no se confunden con servicios ya implementados del caso comercial.

## Revisión ejecutiva

En una sesión de 30 minutos: confirmar objetivos y métricas (5 minutos), recorrer capacidades y evidencia (10), revisar prioridades y restricciones de inversión (10), y acordar decisiones, responsables y próximos hitos (5). Las objeciones se resuelven con alcance, evidencia y compromisos de diseño. No se modifica una puntuación para acomodar una preferencia sin registrar el motivo.

La publicación de un mapa o la aceptación de un ADR no equivale a aprobar una inversión. La aprobación empresarial, el retorno real y la ejecución operativa se realizan fuera de esta demostración.
