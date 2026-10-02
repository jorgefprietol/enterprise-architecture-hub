using System.Net;
using System.Net.Http.Json;
using Architecture.Api;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

public sealed class CatalogFixture : WebApplicationFactory<Program>
{
    private readonly string path = Path.Combine(Path.GetTempPath(), $"architecture-test-{Guid.NewGuid()}.db");
    protected override void ConfigureWebHost(IWebHostBuilder builder) => builder.UseSetting("ConnectionStrings:Catalog", $"Data Source={path}").UseSetting("EditorToken", "integration-test-secret").UseSetting("SeedDemo", "true");
    protected override void Dispose(bool disposing) { base.Dispose(disposing); Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools(); if (File.Exists(path)) File.Delete(path); }
}
public class CatalogTests(CatalogFixture fixture) : IClassFixture<CatalogFixture>
{
    HttpClient Editor() { var client = fixture.CreateClient(); client.DefaultRequestHeaders.Add("X-Editor-Token", "integration-test-secret"); return client; }
    [Fact]
    public async Task PublicReadsAndProtectedWrites()
    {
        using var client = fixture.CreateClient();
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/workspace")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/goals", new Goal())).StatusCode);
    }
    [Fact]
    public async Task HierarchyRejectsSkippedLevelsAndNormalizedDuplicateNames()
    {
        using var client = Editor();
        var node = new CapabilityNode { Id = "test-invalid", Name = "Nueva capacidad", Level = 4, ParentId = "strategy", Definition = "Resultado", Owner = "Equipo" };
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/nodes", node)).StatusCode);
        node.Name = " GESTIÓN de identidad del cliente "; node.ParentId = "commercial-sub";
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/nodes", node)).StatusCode);
    }
    [Fact]
    public async Task ReferencedCapabilityCannotBeDeleted()
    {
        using var client = Editor(); Assert.Equal(HttpStatusCode.Conflict, (await client.DeleteAsync("/api/nodes/orders")).StatusCode);
    }
    [Fact]
    public async Task AssessmentRequiresEvidenceAndBoundedMaturity()
    {
        using var client = Editor();
        var a = new Assessment { Id = "assessment-customer", CapabilityId = "customer", People = 2, Process = 2, Data = 0, Technology = 2, Target = 4, Revenue = 3, Cost = 3, Risk = 3, Customer = 3, Feasibility = 3, Assessor = "Reviewer", Evidence = "" };
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync("/api/assessments/assessment-customer", a)).StatusCode);
        a.Data = 2; Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync("/api/assessments/assessment-customer", a)).StatusCode);
    }
    [Fact]
    public async Task RoadmapRejectsCyclesAndLaterDependencies()
    {
        using var client = Editor();
        var plan = new Initiative { Id = "initiative-analytics", Name = "Datos", CapabilityId = "analytics", Owner = "Equipo", Quarter = "2027-Q1", Budget = 1000, Outcome = "Datos confiables", Dependencies = "initiative-orders" };
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync("/api/initiatives/initiative-analytics", plan)).StatusCode);
        plan.Quarter = "2027-Q2"; Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync("/api/initiatives/initiative-analytics", plan)).StatusCode);
    }
    [Fact]
    public async Task CreatesUpdatesAndAuditsGoalThenProtectsCsvFromFormulaInjection()
    {
        using var client = Editor();
        var goal = new Goal { Id = "test-goal", Name = "Retención", Owner = "Equipo", Metric = "Clientes recurrentes (%)", Target = 70 };
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/goals", goal)).StatusCode);
        goal.Target = 80; Assert.Equal(HttpStatusCode.OK, (await client.PutAsJsonAsync("/api/goals/test-goal", goal)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync("/api/goals/test-goal")).StatusCode);
        var node = new CapabilityNode { Id = "test-csv", Name = "=1+1", Definition = "+cmd", Owner = "Equipo", Level = 4, ParentId = "operations-sub", Journey = "Compra" };
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/nodes", node)).StatusCode);
        var csv = await client.GetStringAsync("/api/export/capabilities.csv");
        Assert.Contains("'=1+1", csv); Assert.Contains("'+cmd", csv);
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync("/api/nodes/test-csv")).StatusCode);
        Assert.Contains("create:goals", await client.GetStringAsync("/api/workspace"));
    }
}
