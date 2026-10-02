using Microsoft.EntityFrameworkCore;
namespace Architecture.Api;

public static class Seed
{
    public static async Task Initialize(CatalogDb db)
    {
        if (await db.Nodes.AnyAsync()) return;
        await using var tx = await db.Database.BeginTransactionAsync();
        db.Goals.AddRange(
            new Goal { Id = "goal-growth", Name = "Crecer el canal digital", Metric = "Participación de ventas digitales (%)", Owner = "Dirección comercial", Target = 35 },
            new Goal { Id = "goal-efficiency", Name = "Reducir el costo operativo", Metric = "Reducción del costo por pedido (%)", Owner = "Operaciones", Target = 20 },
            new Goal { Id = "goal-trust", Name = "Aumentar la confianza del cliente", Metric = "Pedidos perfectos (%)", Owner = "Experiencia de cliente", Target = 98 },
            new Goal { Id = "goal-risk", Name = "Controlar el riesgo empresarial", Metric = "Controles críticos con evidencia (%)", Owner = "Riesgos", Target = 100 });
        db.Nodes.Add(new CapabilityNode { Id = "strategy", Name = "Comercio conectado", Level = 1, Owner = "Comité ejecutivo", Definition = "Crear crecimiento rentable mediante una operación omnicanal confiable." });
        string[] domains = ["commercial", "operations", "governance"];
        string[] names = ["Comercial", "Operaciones", "Gobernanza"];
        for (int i = 0; i < domains.Length; i++)
        {
            db.Nodes.Add(new CapabilityNode { Id = domains[i], Name = names[i], Level = 2, ParentId = "strategy", Owner = names[i], Definition = $"Resultados del dominio {names[i]}." });
            db.Nodes.Add(new CapabilityNode { Id = domains[i] + "-sub", Name = new[] { "Relación comercial", "Cumplimiento de pedidos", "Control empresarial" }[i], Level = 3, ParentId = domains[i], Owner = names[i], Definition = "Agrupación coherente de capacidades de negocio." });
        }
        string[] ids = ["customer", "pricing", "orders", "inventory", "delivery", "returns", "analytics", "risk"];
        string[] capNames = ["Gestión de identidad del cliente", "Gestión de precios comerciales", "Gestión de pedidos comerciales", "Gestión de disponibilidad de inventario", "Gestión de distribución de pedidos", "Gestión de devoluciones comerciales", "Análisis de desempeño empresarial", "Gestión de riesgo operativo"];
        string[] definitions = ["Reconocer y administrar la identidad del cliente entre canales.", "Determinar precios coherentes con margen y mercado.", "Capturar y controlar el ciclo de vida del pedido.", "Determinar existencias disponibles para la promesa comercial.", "Coordinar la entrega conforme a los compromisos del cliente.", "Resolver devoluciones con control económico y trazabilidad.", "Medir resultados y convertir datos confiables en decisiones.", "Identificar y mitigar exposición operativa con controles verificables."];
        string[] journeys = ["Descubrir y registrarse", "Comparar y comprar", "Comprar y confirmar", "Consultar disponibilidad", "Recibir el pedido", "Resolver una devolución", "Revisar el desempeño", "Operar con confianza"];
        string[] goalIds = ["goal-growth", "goal-growth", "goal-trust", "goal-efficiency", "goal-trust", "goal-efficiency", "goal-efficiency", "goal-risk"];
        int[][] maturity = [[2, 2, 1, 2], [3, 3, 3, 4], [2, 2, 2, 3], [2, 1, 2, 2], [3, 2, 2, 3], [4, 4, 3, 4], [2, 2, 1, 2], [4, 3, 4, 3]];
        decimal[][] impact = [[5, 3, 4, 5, 4], [4, 3, 2, 3, 4], [5, 4, 4, 5, 5], [4, 5, 4, 4, 4], [3, 4, 3, 5, 3], [2, 3, 2, 3, 2], [4, 5, 3, 3, 4], [2, 2, 5, 3, 3]];
        for (int i = 0; i < ids.Length; i++)
        {
            var domain = domains[i < 2 ? 0 : i < 6 ? 1 : 2];
            var owner = new[] { "Equipo de clientes", "Equipo comercial", "Equipo de pedidos", "Equipo de inventario", "Equipo logístico", "Equipo posventa", "Plataforma de datos", "Equipo de riesgos" }[i];
            db.Nodes.Add(new CapabilityNode { Id = ids[i], Name = capNames[i], Definition = definitions[i], Level = 4, ParentId = domain + "-sub", Owner = owner, Journey = journeys[i], TeamType = i == 6 ? "platform" : i == 7 ? "enabling" : "stream-aligned" });
            db.Alignments.Add(new Alignment { Id = "align-" + ids[i], CapabilityId = ids[i], GoalId = goalIds[i], Weight = 0.8m });
            db.Assessments.Add(new Assessment { Id = "assessment-" + ids[i], CapabilityId = ids[i], People = maturity[i][0], Process = maturity[i][1], Data = maturity[i][2], Technology = maturity[i][3], Target = 4, Revenue = impact[i][0], Cost = impact[i][1], Risk = impact[i][2], Customer = impact[i][3], Feasibility = impact[i][4], Evidence = $"Escenario ficticio Meridian: revisión de controles de {capNames[i]}, entrevistas de responsables y muestra de 50 registros. Datos de demostración.", Assessor = "Comité de arquitectura (demo)", AssessedAt = DateTimeOffset.UtcNow });
            db.Initiatives.Add(new Initiative { Id = "initiative-" + ids[i], Name = new[] { "Identidad omnicanal", "Política comercial unificada", "Orquestación del pedido", "Inventario disponible en tiempo real", "Promesa de entrega confiable", "Resolución de devoluciones", "Modelo de datos empresarial", "Controles con evidencia" }[i], CapabilityId = ids[i], Owner = owner, Quarter = i is 0 or 6 ? "2027-Q1" : i < 5 ? "2027-Q2" : "2027-Q3", Budget = new[] { 45000m, 25000m, 70000m, 60000m, 40000m, 18000m, 55000m, 30000m }[i], Dependencies = i is 2 or 3 ? "initiative-analytics" : i == 4 ? "initiative-orders,initiative-inventory" : "", Outcome = $"Elevar {capNames[i].ToLowerInvariant()} a madurez 4 y medir el efecto en el objetivo asociado." });
        }
        db.Nodes.AddRange(
            new CapabilityNode { Id = "customer-consent", Name = "Gestión de consentimiento del cliente", Level = 5, ParentId = "customer", Definition = "Administrar permisos verificables por finalidad y canal.", Owner = "Equipo de clientes" },
            new CapabilityNode { Id = "orders-promise", Name = "Gestión de promesa comercial", Level = 5, ParentId = "orders", Definition = "Determinar condiciones verificables de cumplimiento.", Owner = "Equipo de pedidos" });
        db.Alignments.Add(new Alignment { Id = "align-orders-growth", CapabilityId = "orders", GoalId = "goal-growth", Weight = 0.7m });
        var assets = new[] {
            new ArchitectureAsset { Id = "process-order", Name = "Confirmación y cumplimiento", Kind = "process", Description = "Proceso de extremo a extremo de aceptación y entrega.", Owner = "Operaciones" },
            new ArchitectureAsset { Id = "data-customer", Name = "Cliente y consentimiento", Kind = "data", Description = "Identidad empresarial y permisos de contacto.", Owner = "Gobierno de datos", State = "target" },
            new ArchitectureAsset { Id = "data-stock", Name = "Disponibilidad y reservas", Kind = "data", Description = "Modelo canónico de existencias y asignaciones.", Owner = "Gobierno de datos", State = "target" },
            new ArchitectureAsset { Id = "app-oms", Name = "Order Management", Kind = "application", Description = "Orquestación de pedidos y excepciones.", Owner = "Equipo de pedidos", State = "target" },
            new ArchitectureAsset { Id = "app-erp", Name = "ERP comercial", Kind = "application", Description = "Operación comercial transaccional vigente.", Owner = "Plataforma empresarial" },
            new ArchitectureAsset { Id = "tech-events", Name = "Plataforma de eventos", Kind = "technology", Description = "Integración asíncrona con contratos versionados.", Owner = "Plataforma", State = "target" },
            new ArchitectureAsset { Id = "tech-data", Name = "Plataforma analítica", Kind = "technology", Description = "Datos gobernados para indicadores operativos.", Owner = "Plataforma de datos", State = "target" }
        };
        db.Assets.AddRange(assets);
        foreach (var id in ids) db.Traces.Add(new TraceLink { Id = "trace-" + id, CapabilityId = id, AssetId = id == "customer" ? "data-customer" : id == "inventory" ? "data-stock" : id == "analytics" ? "tech-data" : "app-erp", Rationale = "El activo soporta la información o ejecución requerida por la capacidad." });
        db.Traces.AddRange(new TraceLink { Id = "trace-orders-process", CapabilityId = "orders", AssetId = "process-order", Rationale = "El proceso materializa la capacidad en la experiencia de compra." }, new TraceLink { Id = "trace-orders-oms", CapabilityId = "orders", AssetId = "app-oms", Rationale = "La arquitectura objetivo centraliza la orquestación." }, new TraceLink { Id = "trace-orders-events", CapabilityId = "orders", AssetId = "tech-events", Rationale = "Los eventos desacoplan el pedido de inventario y distribución." });
        db.Decisions.Add(new Decision { Id = "adr-001", CapabilityId = "orders", Title = "Orquestar pedidos con contratos de eventos", Context = "La promesa comercial depende de inventario y distribución con ciclos distintos.", Choice = "Un servicio de pedidos publica cambios de estado versionados; cada dominio conserva sus datos.", Tradeoffs = "Mejora el desacoplamiento; requiere idempotencia, observabilidad y manejo explícito de consistencia eventual.", Status = "accepted" });
        db.Audit.Add(new AuditEntry { At = DateTimeOffset.UtcNow, Action = "seed:meridian-demo", EntityId = "strategy", Actor = "system" });
        await db.SaveChangesAsync(); await tx.CommitAsync();
    }
}
