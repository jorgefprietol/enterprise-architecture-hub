using Microsoft.EntityFrameworkCore;
namespace Architecture.Api;

public class CatalogDb(DbContextOptions<CatalogDb> options) : DbContext(options)
{
    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<CapabilityNode> Nodes => Set<CapabilityNode>();
    public DbSet<Alignment> Alignments => Set<Alignment>();
    public DbSet<Assessment> Assessments => Set<Assessment>();
    public DbSet<ArchitectureAsset> Assets => Set<ArchitectureAsset>();
    public DbSet<TraceLink> Traces => Set<TraceLink>();
    public DbSet<Initiative> Initiatives => Set<Initiative>();
    public DbSet<Decision> Decisions => Set<Decision>();
    public DbSet<AuditEntry> Audit => Set<AuditEntry>();
    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<CapabilityNode>().HasOne<CapabilityNode>().WithMany().HasForeignKey(x => x.ParentId).OnDelete(DeleteBehavior.Restrict);
        model.Entity<Alignment>().HasOne<CapabilityNode>().WithMany().HasForeignKey(x => x.CapabilityId).OnDelete(DeleteBehavior.Restrict);
        model.Entity<Alignment>().HasOne<Goal>().WithMany().HasForeignKey(x => x.GoalId).OnDelete(DeleteBehavior.Restrict);
        model.Entity<Alignment>().HasIndex(x => new { x.CapabilityId, x.GoalId }).IsUnique();
        model.Entity<Assessment>().HasOne<CapabilityNode>().WithMany().HasForeignKey(x => x.CapabilityId).OnDelete(DeleteBehavior.Restrict);
        model.Entity<Assessment>().HasIndex(x => x.CapabilityId).IsUnique();
        model.Entity<TraceLink>().HasOne<CapabilityNode>().WithMany().HasForeignKey(x => x.CapabilityId).OnDelete(DeleteBehavior.Restrict);
        model.Entity<TraceLink>().HasOne<ArchitectureAsset>().WithMany().HasForeignKey(x => x.AssetId).OnDelete(DeleteBehavior.Restrict);
        model.Entity<TraceLink>().HasIndex(x => new { x.CapabilityId, x.AssetId }).IsUnique();
        model.Entity<Initiative>().HasOne<CapabilityNode>().WithMany().HasForeignKey(x => x.CapabilityId).OnDelete(DeleteBehavior.Restrict);
        model.Entity<Decision>().HasOne<CapabilityNode>().WithMany().HasForeignKey(x => x.CapabilityId).OnDelete(DeleteBehavior.Restrict);
    }
}
