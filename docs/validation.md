# Evidencia de validación

Las validaciones forman parte del pipeline público; sus resultados se consultan en [GitHub Actions](https://github.com/jorgefprietol/enterprise-architecture-hub/actions/workflows/ci.yml). El informe de cada ejecución corresponde al commit de esa ejecución.

- C#: pruebas de API sobre SQLite real para proteger escrituras, jerarquía, duplicados, referencias, evidencia, dependencias, CSV y auditoría.
- Java: pruebas de fórmulas, alineación, madurez objetivo, empates, presupuesto, estimaciones ausentes, contratos inválidos y salud HTTP.
- React: pruebas de navegación contextual, búsqueda por alcance y promedio de madurez; compilación TypeScript estricta.
- E2E: navegación del panel, simulación sin presupuesto, evidencia, trazabilidad, gobierno, altas persistentes y eliminación mediante la interfaz, además de búsqueda con ancho móvil.
- Integración: llamadas al catálogo desplegado y al motor Java, protección por token, integridad referencial, versión de edición y rechazo de escrituras desactualizadas.
- Persistencia: un objetivo nuevo, distinto de los datos semilla, se recupera después de reiniciar el proceso del catálogo y se elimina al cerrar la verificación.

Las capturas de la interfaz demuestran el aspecto del producto. No son evidencia de resultados comerciales ni de un despliegue empresarial.

## Verificación local del 2 de octubre de 2026

| Grupo | Resultado |
|---|---|
| Catálogo C# | 7 pruebas correctas |
| Motor Java | 7 pruebas correctas |
| Lógica React | 3 pruebas correctas |
| Interfaz E2E | 3 pruebas correctas, incluida escritura y recarga |
| Integración HTTP | Salud, ranking remoto, presupuesto, CSV, token, auditoría y versión desactualizada verificados |
| Dependencias | Auditorías .NET y npm sin vulnerabilidades reportadas en el momento de la revisión |

GitHub Actions reproduce las pruebas sobre un entorno Linux y contenedores; su estado público confirma cada entrega automatizada.

La [ejecución verificada del commit 79dc83f](https://github.com/jorgefprietol/enterprise-architecture-hub/actions/runs/37054697354) completó correctamente los siete trabajos, incluida la publicación de las tres imágenes en GHCR con SBOM y procedencia. Las imágenes llevan la etiqueta del commit `sha-79dc83f83ef83ad6c47e3495e6b830f992998f3d`.
