using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Architecture.Api;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<CatalogDb>(o => o.UseSqlite(builder.Configuration.GetConnectionString("Catalog") ?? "Data Source=catalog.db"));
builder.Services.AddOpenApi();
builder.Services.AddHttpClient("decisions", c => { c.BaseAddress = new Uri(builder.Configuration["DecisionEngineUrl"] ?? "http://localhost:8092"); c.Timeout = TimeSpan.FromSeconds(10); });
var app = builder.Build();
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    if (context.Request.Method is not ("GET" or "HEAD" or "OPTIONS"))
    {
        var expected = builder.Configuration["EditorToken"];
        var provided = context.Request.Headers["X-Editor-Token"].ToString();
        if (string.IsNullOrWhiteSpace(expected) || !CryptographicOperations.FixedTimeEquals(SHA256.HashData(Encoding.UTF8.GetBytes(expected)), SHA256.HashData(Encoding.UTF8.GetBytes(provided))))
        { context.Response.StatusCode = 401; await context.Response.WriteAsJsonAsync(new { title = "Se requiere la clave de edición.", status = 401 }); return; }
    }
    try { await next(); }
    catch (CatalogException ex) { context.Response.StatusCode = 400; await context.Response.WriteAsJsonAsync(new { title = ex.Message, status = 400 }); }
    catch (CatalogConflictException ex) { context.Response.StatusCode = 409; await context.Response.WriteAsJsonAsync(new { title = ex.Message, status = 409 }); }
    catch (DbUpdateConcurrencyException) { context.Response.StatusCode = 409; await context.Response.WriteAsJsonAsync(new { title = "El registro cambió durante la edición. Recarga el catálogo.", status = 409 }); }
    catch (DbUpdateException) { context.Response.StatusCode = 409; await context.Response.WriteAsJsonAsync(new { title = "Conflicto: identificador duplicado o entidad todavía referenciada.", status = 409 }); }
    catch (HttpRequestException) { context.Response.StatusCode = 503; await context.Response.WriteAsJsonAsync(new { title = "Motor de decisiones no disponible.", status = 503 }); }
    catch (TaskCanceledException) when (!context.RequestAborted.IsCancellationRequested) { context.Response.StatusCode = 503; await context.Response.WriteAsJsonAsync(new { title = "El motor de decisiones excedió el tiempo de espera.", status = 503 }); }
});
app.MapOpenApi();
app.MapGet("/health", async (CatalogDb db) => await db.Database.CanConnectAsync() ? Results.Ok(new { status = "ok", service = "architecture-catalog" }) : Results.StatusCode(503));
app.MapGet("/api/workspace", async (CatalogDb db) => new
{
    goals = await db.Goals.AsNoTracking().OrderBy(x => x.Id).ToListAsync(),
    nodes = await db.Nodes.AsNoTracking().OrderBy(x => x.Id).ToListAsync(),
    alignments = await db.Alignments.AsNoTracking().ToListAsync(),
    assessments = await db.Assessments.AsNoTracking().ToListAsync(),
    assets = await db.Assets.AsNoTracking().ToListAsync(),
    traces = await db.Traces.AsNoTracking().ToListAsync(),
    initiatives = await db.Initiatives.AsNoTracking().ToListAsync(),
    decisions = await db.Decisions.AsNoTracking().ToListAsync(),
    audit = await db.Audit.AsNoTracking().OrderByDescending(x => x.Id).Take(100).ToListAsync()
});
MapCrud<Goal>("goals"); MapCrud<CapabilityNode>("nodes"); MapCrud<Alignment>("alignments"); MapCrud<Assessment>("assessments");
MapCrud<ArchitectureAsset>("assets"); MapCrud<TraceLink>("traces"); MapCrud<Initiative>("initiatives"); MapCrud<Decision>("decisions");
app.MapGet("/api/priorities", async (CatalogDb db, IHttpClientFactory factory, decimal? budget) =>
{
    CatalogRules.Require(budget is null or >= 0, "Presupuesto negativo.");
    var nodes = await db.Nodes.Where(x => x.Level == 4).AsNoTracking().ToListAsync();
    var assessments = await db.Assessments.AsNoTracking().ToListAsync();
    var alignments = await db.Alignments.AsNoTracking().ToListAsync();
    var initiatives = await db.Initiatives.AsNoTracking().ToListAsync();
    var candidates = nodes.Where(n => assessments.Any(a => a.CapabilityId == n.Id)).Select(n =>
    {
        var a = assessments.First(x => x.CapabilityId == n.Id);
        return new { id = n.Id, name = n.Name, people = a.People, process = a.Process, data = a.Data, technology = a.Technology, target = a.Target, revenue = a.Revenue, cost = a.Cost, risk = a.Risk, customer = a.Customer, feasibility = a.Feasibility, alignment = alignments.Where(x => x.CapabilityId == n.Id).Sum(x => x.Weight), investment = initiatives.Where(x => x.CapabilityId == n.Id && x.Status != "completed").Sum(x => x.Budget), teamType = n.TeamType };
    });
    using var response = await factory.CreateClient("decisions").PostAsJsonAsync("/engine/prioritize", new { candidates, budget });
    if (!response.IsSuccessStatusCode) throw new HttpRequestException("Decision engine rejected the request.");
    return Results.Content(await response.Content.ReadAsStringAsync(), "application/json");
});
app.MapGet("/api/validation", async (CatalogDb db) =>
{
    var nodes = await db.Nodes.AsNoTracking().ToListAsync(); var goals = await db.Goals.AsNoTracking().ToListAsync();
    var links = await db.Alignments.AsNoTracking().ToListAsync(); var assessments = await db.Assessments.AsNoTracking().ToListAsync(); var traces = await db.Traces.AsNoTracking().ToListAsync();
    var issues = new List<object>();
    foreach (var n in nodes.Where(x => x.Level == 4))
    {
        if (!links.Any(x => x.CapabilityId == n.Id)) issues.Add(new { entityId = n.Id, severity = "error", rule = "strategic-anchor", message = $"{n.Name}: sin objetivo estratégico." });
        if (!assessments.Any(x => x.CapabilityId == n.Id)) issues.Add(new { entityId = n.Id, severity = "warning", rule = "evidence", message = $"{n.Name}: falta evaluación de madurez." });
        if (!traces.Any(x => x.CapabilityId == n.Id)) issues.Add(new { entityId = n.Id, severity = "warning", rule = "technology-trace", message = $"{n.Name}: sin activos trazados." });
        if (n.Name.Contains(" y ", StringComparison.OrdinalIgnoreCase)) issues.Add(new { entityId = n.Id, severity = "warning", rule = "overloaded-name", message = $"{n.Name}: revisar si combina capacidades independientes." });
        if (string.IsNullOrWhiteSpace(n.Journey)) issues.Add(new { entityId = n.Id, severity = "warning", rule = "customer-journey", message = $"{n.Name}: falta recorrido del cliente." });
    }
    foreach (var g in goals.Where(g => !links.Any(x => x.GoalId == g.Id))) issues.Add(new { entityId = g.Id, severity = "error", rule = "goal-coverage", message = $"{g.Name}: sin capacidades asociadas." });
    return Results.Ok(new { checkedCapabilities = nodes.Count(x => x.Level == 4), issues });
});
app.MapGet("/api/export/capabilities.csv", async (CatalogDb db) =>
{
    var nodes = await db.Nodes.AsNoTracking().ToListAsync(); var assessments = await db.Assessments.AsNoTracking().ToListAsync();
    var csv = new StringBuilder("Strategy,Domain,Subdomain,Capability,Subcapability,Definition,Owner,TeamType,Journey,Maturity,Target,Evidence\r\n");
    foreach (var n in nodes.Where(x => x.Level >= 4).OrderBy(x => x.Id))
    {
        var path = new string[5]; CapabilityNode? cursor = n; string capId = n.Id;
        while (cursor is not null) { path[cursor.Level - 1] = cursor.Name; if (cursor.Level == 4) capId = cursor.Id; cursor = nodes.FirstOrDefault(x => x.Id == cursor.ParentId); }
        var a = assessments.Find(x => x.CapabilityId == capId);
        csv.AppendLine(string.Join(',', path.Concat([n.Definition, n.Owner, n.TeamType, n.Journey, a is null ? "" : ((a.People + a.Process + a.Data + a.Technology) / 4m).ToString(System.Globalization.CultureInfo.InvariantCulture), a?.Target.ToString() ?? "", a?.Evidence ?? ""]).Select(Csv)));
    }
    return Results.File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv; charset=utf-8", "capabilities.csv");
});
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CatalogDb>(); await db.Database.MigrateAsync();
    if (builder.Configuration.GetValue("SeedDemo", true)) await Seed.Initialize(db);
}
app.Run();

void MapCrud<T>(string route) where T : class
{
    app.MapPost($"/api/{route}", async (T item, CatalogDb db) =>
    {
        await CatalogRules.Validate(db, item); var id = (string)item.GetType().GetProperty("Id")!.GetValue(item)!;
        item.GetType().GetProperty("Version")!.SetValue(item, 1);
        db.Add(item); db.Audit.Add(new AuditEntry { At = DateTimeOffset.UtcNow, Action = $"create:{route}", EntityId = id }); await db.SaveChangesAsync();
        return Results.Created($"/api/{route}/{id}", item);
    });
    app.MapPut($"/api/{route}/{{id}}", async (string id, T item, CatalogDb db) =>
    {
        CatalogRules.Require(id == (string?)item.GetType().GetProperty("Id")!.GetValue(item), "El identificador de la ruta no coincide.");
        var existing = await db.Set<T>().FindAsync(id); if (existing is null) return Results.NotFound();
        var versionProperty = item.GetType().GetProperty("Version")!;
        var currentVersion = (int)versionProperty.GetValue(existing)!;
        if ((int)versionProperty.GetValue(item)! != currentVersion) throw new CatalogConflictException("El registro fue editado por otra sesión. Recarga el catálogo antes de guardar.");
        await CatalogRules.Validate(db, item); db.Entry(existing).CurrentValues.SetValues(item);
        db.Entry(existing).Property("Version").CurrentValue = currentVersion + 1;
        db.Audit.Add(new AuditEntry { At = DateTimeOffset.UtcNow, Action = $"update:{route}", EntityId = id }); await db.SaveChangesAsync(); return Results.Ok(existing);
    });
    app.MapDelete($"/api/{route}/{{id}}", async (string id, CatalogDb db) =>
    {
        var existing = await db.Set<T>().FindAsync(id); if (existing is null) return Results.NotFound();
        if (existing is Initiative) CatalogRules.Require(!(await db.Initiatives.ToListAsync()).Any(x => CatalogRules.Dependencies(x).Contains(id)), "La iniciativa es dependencia de otra.");
        db.Remove(existing); db.Audit.Add(new AuditEntry { At = DateTimeOffset.UtcNow, Action = $"delete:{route}", EntityId = id }); await db.SaveChangesAsync(); return Results.NoContent();
    });
}
static string Csv(string? value)
{
    value ??= "";
    if (value.TrimStart().StartsWith('=') || value.TrimStart().StartsWith('+') || value.TrimStart().StartsWith('-') || value.TrimStart().StartsWith('@') || value.StartsWith('\t') || value.StartsWith('\r')) value = "'" + value;
    return "\"" + value.Replace("\"", "\"\"") + "\"";
}
public partial class Program;
public class CatalogConflictException(string message) : Exception(message);
