# Contratos HTTP

Los identificadores aceptan letras, números y guiones, hasta 80 caracteres. Las rutas de edición exigen el mismo ID en URL y cuerpo. Las relaciones se crean por ID; las referencias inexistentes se rechazan. Los errores 400 y 409 describen la regla violada; 401 indica clave de edición ausente o inválida; 503 indica indisponibilidad del cálculo remoto.

El catálogo devuelve nombres de propiedades en camelCase. Los registros individuales se crean con POST (versión inicial 1) y se reemplazan con PUT incluyendo la propiedad `version` leída. Una edición correcta incrementa la versión; una versión desactualizada recibe 409. Los campos obligatorios deben incluirse también en la edición. El contrato completo se genera en `/openapi/v1.json`.

## Motor Java (red interna)

`POST /engine/prioritize` recibe hasta 1000 candidatos. No requiere acceso al almacenamiento. Ejemplo:

```json
{
  "budget": 100000,
  "candidates": [
    {
      "id": "orders",
      "name": "Gestión de pedidos comerciales",
      "people": 2,
      "process": 2,
      "data": 2,
      "technology": 3,
      "target": 4,
      "revenue": 5,
      "cost": 4,
      "risk": 4,
      "customer": 5,
      "feasibility": 5,
      "alignment": 1,
      "investment": 70000,
      "teamType": "stream-aligned"
    }
  ]
}
```

Respuesta: `priorities`, `budget`, `allocated`, `remaining`, `strategicBets`, `algorithm`. Cada prioridad incluye la madurez, brecha, impacto, oportunidad, puntaje, cuadrante, inversión, equipo, elegibilidad presupuestaria y explicación. Un presupuesto omitido produce ranking sin asignación. Cero presupuesto no financia capacidades. Identificadores duplicados, campos fuera de escala y presupuestos negativos producen 400. Los costos se manejan con `BigDecimal` para evitar errores de acumulación monetaria.

Los valores calculados se redondean a tres decimales; los empates después del redondeo se ordenan por ID.
