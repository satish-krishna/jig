//! Tauri command adapters for the users operations. These are deliberately thin:
//! they deref the managed store and stringify errors into a rejected invoke. All
//! behavior is in users.rs and tested there. Command names match COMMANDS in the
//! frontend operation registry (users_list, users_get, users_save).

use crate::users::{User, UserStore};
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
