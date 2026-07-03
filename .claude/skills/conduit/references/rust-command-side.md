# The Rust command side

Read this when wiring the Tauri desktop backend so the IPC `res` shapes line up with the shared operation registry (and, by extension, the generated OpenAPI DTOs the HTTP transport uses).

## The mapping to preserve

Each entry in the frontend `COMMANDS` table names a `#[tauri::command]`. The command's return type must serialize to the same JSON shape as the registry's `res` for that operation. If the HTTP side gets `Page<User>` from `/users`, the `list_users` command must return a value that serializes identically. Keep one Rust struct set as the source of truth and derive `Serialize` so the shapes cannot drift by hand.

```rust
// mirror the registry res types
#[derive(serde::Serialize)]
pub struct User { pub id: String, pub name: String, pub email: String }

#[derive(serde::Serialize)]
pub struct Page<T> { pub items: Vec<T>, pub total: u64, pub page: u32 }

#[derive(serde::Deserialize)]
pub struct UserInput { pub name: String, pub email: String }
```

If the .NET API is the canonical schema, generate or hand-mirror these structs from the same OpenAPI document that produces the TypeScript DTOs. That keeps all three (Rust, TypeScript, .NET) anchored to one contract.

## Commands

Argument names must match the payload keys the frontend sends. Tauri deserializes the `invoke` payload into the command parameters by name, so `invoke('get_user', { id })` requires a parameter called `id`.

```rust
#[tauri::command]
async fn get_user(id: String, state: tauri::State<'_, Db>) -> Result<User, ApiError> {
    state.users().find(&id).await.map_err(ApiError::from)
}

#[tauri::command]
async fn list_users(page: u32, state: tauri::State<'_, Db>) -> Result<Page<User>, ApiError> {
    state.users().page(page).await.map_err(ApiError::from)
}

#[tauri::command]
async fn save_user(user: UserInput, state: tauri::State<'_, Db>) -> Result<User, ApiError> {
    state.users().upsert(user).await.map_err(ApiError::from)
}
```

Register them so the command table on the frontend has a real target:

```rust
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![get_user, list_users, save_user])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

## Error shaping (so the normalizer has something predictable)

The frontend `NormalizingTransport` folds errors into one app type. Give it a stable shape to fold, rather than letting arbitrary strings escape. Return a serializable error enum, and the rejected `invoke` promise carries that JSON, which `toAppError` can branch on the same way it branches on `HttpErrorResponse.status`.

```rust
#[derive(serde::Serialize)]
#[serde(tag = "kind", content = "detail")]
pub enum ApiError {
    NotFound(String),
    Validation(Vec<String>),
    Internal(String),
}

impl From<DbError> for ApiError {
    fn from(e: DbError) -> Self {
        match e {
            DbError::Missing(id) => ApiError::NotFound(id),
            other => ApiError::Internal(other.to_string()),
        }
    }
}
```

On the frontend, map that discriminated `kind` onto the same app error categories the HTTP status codes map to. Now both wires converge on one error vocabulary, which is exactly what the normalizer promised.

## Checklist

- Every command in the frontend `COMMANDS` table exists in `generate_handler!`.
- Command parameter names match the payload keys the frontend sends.
- Return types serialize to the registry `res` shapes (same source of truth as the OpenAPI DTOs).
- Errors return a tagged, serializable enum so `toAppError` can normalize IPC failures the same way it normalizes HTTP ones.
