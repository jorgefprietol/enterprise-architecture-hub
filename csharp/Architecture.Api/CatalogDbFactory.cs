using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
namespace Architecture.Api;

public class CatalogDbFactory : IDesignTimeDbContextFactory<CatalogDb>
{
    public CatalogDb CreateDbContext(string[] args) => new(new DbContextOptionsBuilder<CatalogDb>().UseSqlite("Data Source=catalog.db").Options);
}
