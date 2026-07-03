mod commands;
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
        .expect("error while running tauri application");
}
