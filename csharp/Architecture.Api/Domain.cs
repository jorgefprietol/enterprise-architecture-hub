namespace Architecture.Api;

public class Goal
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Metric { get; set; } = "";
    public string Owner { get; set; } = "";
    public decimal Target { get; set; }
}
public class CapabilityNode
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public int Level { get; set; }
    public string? ParentId { get; set; }
    public string Definition { get; set; } = "";
    public string Owner { get; set; } = "";
    public string TeamType { get; set; } = "stream-aligned";
    public string Journey { get; set; } = "";
}
public class Alignment
{
    public string Id { get; set; } = "";
    public string CapabilityId { get; set; } = "";
    public string GoalId { get; set; } = "";
    public decimal Weight { get; set; }
}
public class Assessment
{
    public string Id { get; set; } = "";
    public string CapabilityId { get; set; } = "";
    public int People { get; set; }
    public int Process { get; set; }
    public int Data { get; set; }
    public int Technology { get; set; }
    public int Target { get; set; }
    public decimal Revenue { get; set; }
    public decimal Cost { get; set; }
    public decimal Risk { get; set; }
    public decimal Customer { get; set; }
    public decimal Feasibility { get; set; }
    public string Evidence { get; set; } = "";
    public string Assessor { get; set; } = "";
    public DateTimeOffset AssessedAt { get; set; }
}
public class ArchitectureAsset
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Kind { get; set; } = "";
    public string Description { get; set; } = "";
    public string Owner { get; set; } = "";
    public string State { get; set; } = "current";
}
public class TraceLink
{
    public string Id { get; set; } = "";
    public string CapabilityId { get; set; } = "";
    public string AssetId { get; set; } = "";
    public string Rationale { get; set; } = "";
}
public class Initiative
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string CapabilityId { get; set; } = "";
    public string Owner { get; set; } = "";
    public string Quarter { get; set; } = "";
    public decimal Budget { get; set; }
    public string Status { get; set; } = "planned";
    public string Dependencies { get; set; } = "";
    public string Outcome { get; set; } = "";
}
public class Decision
{
    public string Id { get; set; } = "";
    public string CapabilityId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Context { get; set; } = "";
    public string Choice { get; set; } = "";
    public string Tradeoffs { get; set; } = "";
    public string Status { get; set; } = "proposed";
}
public class AuditEntry
{
    public long Id { get; set; }
    public DateTimeOffset At { get; set; }
    public string Action { get; set; } = "";
    public string EntityId { get; set; } = "";
    public string Actor { get; set; } = "editor";
}
