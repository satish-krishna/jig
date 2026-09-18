// Tests for the C# and desktop-entry-point registry injectors. No parser is available for
// either target language, so each injector below locates its insertion point with a single
// anchor string rather than an AST — see inject-ts.test.ts for the sibling TypeScript
// injectors, which do have a parser. Fixtures are inlined copies of the real target files'
// contents (ApplicationModule.cs, InfrastructureModule.cs, JigDbContext.cs, plus the
// desktop shell's two files in the thick-only half below): when someone reshapes one of
// those files, the fixture here stops matching and this test fails, rather than the
// generator silently mis-splicing at the next slice.
//
// Fixture spec is "Order" (icon lucideBox, one unique string field, one number field), so
// every assertion reads directly off deriveNames' output: pascal Order, pascalPlural Orders,
// camel order, snakePlural orders.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateSpec } from './spec.ts';
import {
  injectApplicationModule,
  injectDbContext,
  injectInfrastructureModule,
} from './inject-text.ts';
// thick:start
import { injectCommandsRs, injectLibRs } from './inject-text.ts';
// thick:end

const spec = validateSpec({
  name: 'Order',
  icon: 'lucideBox',
  fields: [
    { name: 'reference', type: 'string', label: 'Reference', unique: true },
    { name: 'total', type: 'number', label: 'Total' },
  ],
});

const APP_MODULE = `using Microsoft.Extensions.DependencyInjection;

namespace Jig.Application;

/// <summary>Composition root for the application use-cases.</summary>
/// <capability>api.application-module</capability>
/// <intent>One call registers the use-case services, so the host does not name each by hand.</intent>
/// <reuse>Call services.AddApplication() from the API composition root.</reuse>
public static class ApplicationModule
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<UserService>();
        return services;
    }
}
`;

const INFRA_MODULE = `using Jig.Application;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Jig.Infrastructure;

/// <summary>Composition root for the persistence layer.</summary>
/// <capability>api.infrastructure-module</capability>
/// <intent>One call wires the database and repositories, so the host does not know EF Core details.</intent>
/// <reuse>Call services.AddInfrastructure(connectionString) from the API composition root, then InitializeDatabaseAsync on startup.</reuse>
public static class InfrastructureModule
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<JigDbContext>(options => options.UseSqlite(connectionString));
        services.AddScoped<IUserRepository, UserRepository>();
        return services;
    }

    /// <summary>Ensure the schema exists. Keeps EF Core out of the host: the API calls this,
    /// not DbContext.Database directly. Swap EnsureCreated for MigrateAsync when migrations arrive.</summary>
    public static async Task InitializeDatabaseAsync(this IServiceProvider services, CancellationToken ct = default)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<JigDbContext>();
        await db.Database.EnsureCreatedAsync(ct);
    }
}
`;

const DB_CONTEXT = `using Jig.Domain;
using Microsoft.EntityFrameworkCore;

namespace Jig.Infrastructure;

/// <summary>EF Core context for the Jig database. Holds the User set and its schema.</summary>
public sealed class JigDbContext : DbContext
{
    public JigDbContext(DbContextOptions<JigDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(user =>
        {
            user.HasKey(u => u.Id);
            user.Property(u => u.Name).IsRequired();
            user.Property(u => u.Email).IsRequired();
            user.HasIndex(u => u.Email).IsUnique();
        });
    }
}
`;

// thick:start
// A copy of the desktop shell's entry point. No mention of the toolchain that compiles it
// belongs in this file's prose (tools/init/thin.test.ts scans every tracked file for that
// vocabulary), so this comment, like inject-text.ts's, just calls it the desktop entry point.
const LIB_RS = `mod commands;
mod users;

use users::UserStore;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Updater wired as a configured no-op: registered so a clone can turn it on,
        // but nothing calls check(), so the default build never contacts an endpoint.
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(UserStore::default())
        .invoke_handler(tauri::generate_handler![
            commands::users_list,
            commands::users_get,
            commands::users_save,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running application");
}
`;

// A copy of the desktop entry point's command-adapter file. These are deliberately thin:
// they deref the managed store and stringify errors into a rejected invoke. All behavior
// is in the per-entity store and tested there.
const COMMANDS_RS = `use crate::users::{User, UserStore};
use tauri::State;

/// users.list — returns every user.
#[tauri::command]
pub fn users_list(store: State<'_, UserStore>) -> Vec<User> {
    store.list()
}

/// users.get — one user, or a rejected invoke carrying the not-found message.
#[tauri::command]
pub fn users_get(id: String, store: State<'_, UserStore>) -> Result<User, String> {
    store.get(&id).map_err(|e| e.to_string())
}

/// users.save — create (null id) or update; conflict and not-found become a rejected invoke.
#[tauri::command]
pub fn users_save(
    id: Option<String>,
    name: String,
    email: String,
    store: State<'_, UserStore>,
) -> Result<User, String> {
    store.save(id, name, email).map_err(|e| e.to_string())
}
`;
// thick:end
test('injectApplicationModule registers the service before the return', () => {
  const out = injectApplicationModule(APP_MODULE, spec);
  assert.match(out, /services\.AddScoped<OrderService>\(\);/);
  assert.match(out, /services\.AddScoped<UserService>\(\);/);
});

test('injectInfrastructureModule registers the repository', () => {
  assert.match(injectInfrastructureModule(INFRA_MODULE, spec),
    /services\.AddScoped<IOrderRepository, OrderRepository>\(\);/);
});

test('injectDbContext adds the DbSet and the entity configuration', () => {
  const out = injectDbContext(DB_CONTEXT, spec);
  assert.match(out, /public DbSet<Order> Orders => Set<Order>\(\);/);
  assert.match(out, /modelBuilder\.Entity<Order>\(order =>/);
  assert.match(out, /order\.HasKey\(o => o\.Id\);/);
  assert.match(out, /order\.Property\(o => o\.Reference\)\.IsRequired\(\);/);
  assert.match(out, /order\.HasIndex\(o => o\.Reference\)\.IsUnique\(\);/);
});

// DB_CONTEXT is a full-fidelity copy of the real file, which already carries a HasIndex
// for the sample User's unique Email field (see the fixture-fidelity note on inject-ts.test.ts's
// OPERATIONS fixture) — so asserting no HasIndex anywhere in the output would fail on the
// pre-existing one, not on anything this injector did. Scope the assertion to the block this
// call actually adds.
test('a slice with no unique field gets no unique index', () => {
  const out = injectDbContext(DB_CONTEXT, validateSpec({
    name: 'Note', icon: 'lucideFile', fields: [{ name: 'body', type: 'string', label: 'Body' }],
  }));
  const noteBlock = out.slice(out.indexOf('modelBuilder.Entity<Note>'), out.indexOf('modelBuilder.Entity<User>'));
  assert.notEqual(noteBlock, '');
  assert.doesNotMatch(noteBlock, /HasIndex/);
});

// thick:start
test('injectLibRs adds the module, its store import, the managed store, and the three handlers', () => {
  const out = injectLibRs(LIB_RS, spec);
  assert.match(out, /^mod orders;$/m);
  assert.match(out, /^use orders::OrderStore;$/m);
  assert.match(out, /\.manage\(OrderStore::default\(\)\)/);
  assert.match(out, /commands::orders_list,/);
  assert.match(out, /commands::orders_get,/);
  assert.match(out, /commands::orders_save,/);
  // The exemplar's own managed store survives alongside the new one — DI in this generator
  // is additive, never a replacement, the same rule injectApplicationModule's test enforces.
  assert.match(out, /\.manage\(UserStore::default\(\)\)/);
});

test('injectCommandsRs adds the use import and the three command adapters', () => {
  const out = injectCommandsRs(COMMANDS_RS, spec);
  assert.match(out, /use crate::orders::\{Order, OrderStore\};/);
  assert.match(out, /pub fn orders_list\(store: State<'_, OrderStore>\) -> Vec<Order> \{/);
  assert.match(out, /pub fn orders_get\(id: String, store: State<'_, OrderStore>\) -> Result<Order, String> \{/);
  assert.match(out, /pub fn orders_save\(/);
  assert.match(out, /reference: String,/);
  assert.match(out, /total: f64,/);
  assert.match(out, /store\.save\(id, reference, total\)\.map_err\(\|e\| e\.to_string\(\)\)/);
  // The exemplar's own adapters survive alongside the new ones.
  assert.match(out, /pub fn users_list\(/);
});
// thick:end
test('every injector is idempotent', () => {
  for (const [fn, src] of [
    [injectApplicationModule, APP_MODULE],
    [injectInfrastructureModule, INFRA_MODULE],
    [injectDbContext, DB_CONTEXT],
  ] as const) {
    const once = fn(src, spec);
    assert.equal(fn(once, spec), once);
  }
  // thick:start
  const onceRs = injectLibRs(LIB_RS, spec);
  assert.equal(injectLibRs(onceRs, spec), onceRs);
  const onceCommands = injectCommandsRs(COMMANDS_RS, spec);
  assert.equal(injectCommandsRs(onceCommands, spec), onceCommands);
  // thick:end
});

test('a missing anchor throws with the file and the anchor', () => {
  assert.throws(() => injectApplicationModule('public static class Nothing { }', spec),
    /ApplicationModule\.cs: anchor not found/);
});

test('an ambiguous anchor throws', () => {
  assert.throws(() => injectApplicationModule(APP_MODULE + APP_MODULE, spec),
    /ApplicationModule\.cs: anchor is ambiguous/);
});

// thick:start
test('injectLibRs throws with the file and the anchor when the entry point is unrecognizable', () => {
  assert.throws(() => injectLibRs('fn run() {}', spec), /lib\.rs: anchor not found/);
});

test('injectCommandsRs throws with the file and the anchor when the adapter file is unrecognizable', () => {
  assert.throws(() => injectCommandsRs('// nothing here', spec), /commands\.rs: anchor not found/);
});
// thick:end
