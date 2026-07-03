//! Users store for the desktop (thick) client. Holds the same user use-cases the
//! .NET API does (list, get, save with email uniqueness and not-found), so the
//! frontend behaves identically whether it talks to Rust over IPC or to the API
//! over HTTP. The Tauri commands are thin adapters over this; the logic is here
//! and unit-tested in isolation.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use uuid::Uuid;

/// The user shape crossing the IPC wire. Serializes to the same JSON as the .NET
/// UserResponse (id, name, email), so the operation registry's res type fits both.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
}

/// An expected failure. Maps to a rejected invoke on the wire (see commands.rs).
#[derive(Debug, PartialEq)]
pub enum StoreError {
    NotFound(String),
    Conflict(String),
}

impl std::fmt::Display for StoreError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StoreError::NotFound(m) | StoreError::Conflict(m) => write!(f, "{m}"),
        }
    }
}

/// In-memory user store. A template default: swap the Mutex<HashMap> for SQLite or
/// a file store without changing the commands or the frontend.
///
/// @capability shell.user-store
/// @intent The thick client's user use-cases, mirroring the API so both wires agree.
/// @reuse Manage one UserStore in the Tauri app state; commands delegate to it.
#[derive(Default)]
pub struct UserStore {
    users: Mutex<HashMap<String, User>>,
}

impl UserStore {
    pub fn list(&self) -> Vec<User> {
        let mut all: Vec<User> = self.users.lock().unwrap().values().cloned().collect();
        all.sort_by(|a, b| a.name.cmp(&b.name));
        all
    }

    pub fn get(&self, id: &str) -> Result<User, StoreError> {
        self.users
            .lock()
            .unwrap()
            .get(id)
            .cloned()
            .ok_or_else(|| StoreError::NotFound(format!("User {id} was not found.")))
    }

    pub fn save(&self, id: Option<String>, name: String, email: String) -> Result<User, StoreError> {
        let mut users = self.users.lock().unwrap();

        if let Some(existing) = users.values().find(|u| u.email == email) {
            if Some(&existing.id) != id.as_ref() {
                return Err(StoreError::Conflict(format!("Email {email} is already in use.")));
            }
        }

        match id {
            Some(id) => {
                let user = users
                    .get_mut(&id)
                    .ok_or_else(|| StoreError::NotFound(format!("User {id} was not found.")))?;
                user.name = name;
                user.email = email;
                Ok(user.clone())
            }
            None => {
                let user = User { id: Uuid::new_v4().to_string(), name, email };
                users.insert(user.id.clone(), user.clone());
                Ok(user)
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn list_is_empty_on_a_fresh_store() {
        let store = UserStore::default();
        assert_eq!(store.list(), vec![]);
    }

    #[test]
    fn save_creates_a_user_with_an_id() {
        let store = UserStore::default();
        let user = store.save(None, "Ada".into(), "ada@x.io".into()).unwrap();
        assert!(!user.id.is_empty());
        assert_eq!(user.name, "Ada");
        assert_eq!(store.list().len(), 1);
    }

    #[test]
    fn get_unknown_id_is_not_found() {
        let store = UserStore::default();
        assert_eq!(
            store.get("missing"),
            Err(StoreError::NotFound("User missing was not found.".into()))
        );
    }

    #[test]
    fn save_then_get_roundtrips() {
        let store = UserStore::default();
        let created = store.save(None, "Bo".into(), "bo@x.io".into()).unwrap();
        assert_eq!(store.get(&created.id).unwrap(), created);
    }

    #[test]
    fn save_duplicate_email_on_a_different_user_is_conflict() {
        let store = UserStore::default();
        store.save(None, "First".into(), "dup@x.io".into()).unwrap();
        let result = store.save(None, "Second".into(), "dup@x.io".into());
        assert!(matches!(result, Err(StoreError::Conflict(_))));
    }

    #[test]
    fn save_update_of_unknown_id_is_not_found() {
        let store = UserStore::default();
        let result = store.save(Some("ghost".into()), "Ghost".into(), "ghost@x.io".into());
        assert!(matches!(result, Err(StoreError::NotFound(_))));
    }

    #[test]
    fn save_update_keeps_the_same_email_without_conflict() {
        let store = UserStore::default();
        let created = store.save(None, "Cy".into(), "cy@x.io".into()).unwrap();
        let updated = store
            .save(Some(created.id.clone()), "Cyrus".into(), "cy@x.io".into())
            .unwrap();
        assert_eq!(updated.id, created.id);
        assert_eq!(updated.name, "Cyrus");
    }
}
