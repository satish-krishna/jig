using Xunit;

// Every test class in this assembly shares ONE API host and ONE SQLite connection: the
// FastEndpoints AppFixture caches a host per fixture type, and ApiFixture swaps in a single
// in-memory database on a connection held open for the process (see ApiFixture.cs). A
// SqliteConnection is not safe to use from two threads at once, and xUnit runs test classes
// in parallel by default, so the classes were never independent — they only looked it while
// the template had exactly one endpoint test class and nothing to race against.
//
// The second class makes the race real. Microsoft.Data.Sqlite registers and unregisters
// user-defined functions on the connection as each DbContext is built and disposed, so a
// context created on one thread while another thread has a statement open on the same
// connection fails the whole request with SQLite error 5, "unable to delete/modify
// user-function due to active statements". It reproduced in roughly one run in five once a
// generated slice added its own endpoint test class, and it landed on whichever test lost
// the race rather than on the new one, which is the sort of flake that gets blamed on the
// wrong change for a week.
//
// Running the classes in sequence costs nothing here — the whole assembly is well under a
// second — and it states the truth the fixture already implied. This is assembly-wide on
// purpose rather than a collection attribute per class: the slice generator emits an
// endpoint test class per slice, and the safe default has to hold without the generator
// having to remember to opt each one in.
[assembly: CollectionBehavior(DisableTestParallelization = true)]
