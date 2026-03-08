using Microsoft.EntityFrameworkCore;
using RaportApp.Models; // To pozwala widzieć klasę ReportTemplate

namespace RaportApp.Data
{
    // DbContext to "most" między Twoim kodem C# a bazą danych PostgreSQL
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // Ta linia mówi: "Stwórz w bazie tabelę o nazwie ReportTemplates na podstawie modelu ReportTemplate"
        public DbSet<ReportTemplate> ReportTemplates { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Tutaj moglibyśmy dodać dodatkową konfigurację, 
            // ale na razie wystarczy nam domyślna.
        }
    }
}