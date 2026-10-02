using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
namespace Architecture.Api;

public static partial class CatalogRules
{
    public static readonly string[] TeamTypes = ["stream-aligned", "platform", "enabling", "complicated-subsystem"];
    public static string Normalize(string value) => string.Concat(value.Trim().Normalize(NormalizationForm.FormD).Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)).ToLowerInvariant();
    public static void Require(bool condition, string message) { if (!condition) throw new CatalogException(message); }
    public static void Text(string? value, string name) => Require(!string.IsNullOrWhiteSpace(value) && value.Length <= 2000, $"{name}: se requiere texto de 1 a 2000 caracteres.");
    public static void Score(decimal value, string name) => Require(value is >= 1 and <= 5, $"{name}: debe estar entre 1 y 5.");
    public static async Task Leaf(CatalogDb db, string id) => Require(await db.Nodes.AnyAsync(x => x.Id == id && x.Level == 4), "La referencia debe ser una capacidad de nivel 4.");
    public static async Task Validate(CatalogDb db, object item)
    {
        var id = (string?)item.GetType().GetProperty("Id")?.GetValue(item);
        Require(id is not null && IdPattern().IsMatch(id), "Identificador inválido (letras, números, guion; máximo 80).");
        switch (item)
        {
            case Goal g:
                Text(g.Name, "Objetivo"); Text(g.Metric, "Métrica"); Text(g.Owner, "Responsable"); Require(g.Target > 0, "La meta debe ser positiva."); break;
            case CapabilityNode n:
                Text(n.Name, "Nombre"); Text(n.Definition, "Definición"); Text(n.Owner, "Responsable");
                Require(n.Level is >= 1 and <= 5, "Nivel fuera de alcance (1 a 5).");
                Require(TeamTypes.Contains(n.TeamType), "Tipo de equipo inválido.");
                var parent = n.ParentId is null ? null : await db.Nodes.FindAsync(n.ParentId);
                Require(n.Level == 1 ? n.ParentId is null : parent is not null && parent.Level == n.Level - 1, "El padre debe estar en el nivel inmediatamente anterior.");
                var existing = await db.Nodes.AsNoTracking().ToListAsync();
                Require(!existing.Any(x => x.Id != n.Id && x.ParentId == n.ParentId && Normalize(x.Name) == Normalize(n.Name)), "Nombre duplicado dentro del mismo alcance.");
                Require(!existing.Any(x => x.ParentId == n.Id && x.Level != n.Level + 1), "El cambio de nivel invalidaría los descendientes.");
                if (n.Level != 4 && existing.Any(x => x.Id == n.Id && x.Level == 4))
                    Require(!await db.Alignments.AnyAsync(x => x.CapabilityId == n.Id) && !await db.Assessments.AnyAsync(x => x.CapabilityId == n.Id) && !await db.Traces.AnyAsync(x => x.CapabilityId == n.Id) && !await db.Initiatives.AnyAsync(x => x.CapabilityId == n.Id) && !await db.Decisions.AnyAsync(x => x.CapabilityId == n.Id), "No se puede cambiar el nivel de una capacidad con referencias.");
                break;
            case Alignment a:
                await Leaf(db, a.CapabilityId); Require(await db.Goals.AnyAsync(x => x.Id == a.GoalId), "Objetivo inexistente."); Require(a.Weight is > 0 and <= 1, "El peso debe ser mayor que 0 y máximo 1.");
                Require(!await db.Alignments.AnyAsync(x => x.Id != a.Id && x.CapabilityId == a.CapabilityId && x.GoalId == a.GoalId), "Vínculo estratégico duplicado."); break;
            case Assessment a:
                await Leaf(db, a.CapabilityId); foreach (var s in new[] { a.People, a.Process, a.Data, a.Technology, a.Target }) Score(s, "Madurez");
                foreach (var s in new[] { a.Revenue, a.Cost, a.Risk, a.Customer, a.Feasibility }) Score(s, "Impacto o viabilidad");
                Text(a.Evidence, "Evidencia"); Text(a.Assessor, "Evaluador"); Require(!await db.Assessments.AnyAsync(x => x.Id != a.Id && x.CapabilityId == a.CapabilityId), "Ya existe una evaluación para la capacidad.");
                a.AssessedAt = DateTimeOffset.UtcNow; break;
            case ArchitectureAsset a:
                Text(a.Name, "Activo"); Text(a.Description, "Descripción"); Text(a.Owner, "Responsable"); Require(new[] { "process", "data", "application", "technology" }.Contains(a.Kind), "Tipo de activo inválido."); Require(new[] { "current", "target", "retiring" }.Contains(a.State), "Estado inválido."); break;
            case TraceLink t:
                await Leaf(db, t.CapabilityId); Require(await db.Assets.AnyAsync(x => x.Id == t.AssetId), "Activo inexistente."); Text(t.Rationale, "Justificación"); Require(!await db.Traces.AnyAsync(x => x.Id != t.Id && x.CapabilityId == t.CapabilityId && x.AssetId == t.AssetId), "Trazabilidad duplicada."); break;
            case Initiative i:
                await Leaf(db, i.CapabilityId); Text(i.Name, "Iniciativa"); Text(i.Owner, "Responsable"); Text(i.Outcome, "Resultado esperado"); Require(i.Quarter is not null && QuarterPattern().IsMatch(i.Quarter), "Trimestre inválido: YYYY-Q1 a Q4."); Require(i.Budget >= 0, "Presupuesto negativo."); Require(new[] { "planned", "in-progress", "completed" }.Contains(i.Status), "Estado inválido.");
                var plans = await db.Initiatives.AsNoTracking().Where(x => x.Id != i.Id).ToListAsync(); plans.Add(i);
                foreach (var plan in plans)
                    foreach (var dependency in Dependencies(plan))
                    {
                        var before = plans.Find(x => x.Id == dependency);
                        Require(before is not null && before.Id != plan.Id, "Dependencia inexistente o autorreferencia.");
                        Require(string.CompareOrdinal(before!.Quarter, plan.Quarter) <= 0, "La dependencia está programada después de la iniciativa.");
                    }
                foreach (var plan in plans) CheckCycle(plan.Id, plans, new HashSet<string>(), new HashSet<string>());
                break;
            case Decision d:
                await Leaf(db, d.CapabilityId); Text(d.Title, "Decisión"); Text(d.Context, "Contexto"); Text(d.Choice, "Elección"); Text(d.Tradeoffs, "Compromisos"); Require(new[] { "proposed", "accepted", "superseded" }.Contains(d.Status), "Estado inválido."); break;
        }
    }
    public static string[] Dependencies(Initiative i) => (i.Dependencies ?? "").Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
    static void CheckCycle(string id, List<Initiative> plans, HashSet<string> active, HashSet<string> done)
    {
        if (done.Contains(id)) return;
        Require(active.Add(id), "La hoja de ruta contiene un ciclo de dependencias.");
        foreach (var dep in Dependencies(plans.First(x => x.Id == id))) CheckCycle(dep, plans, active, done);
        active.Remove(id); done.Add(id);
    }
    [GeneratedRegex("^[a-zA-Z0-9-]{1,80}$")] private static partial Regex IdPattern();
    [GeneratedRegex("^20[0-9]{2}-Q[1-4]$")] private static partial Regex QuarterPattern();
}
public class CatalogException(string message) : Exception(message);
