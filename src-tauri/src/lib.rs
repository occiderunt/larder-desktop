mod commands;
mod db;
mod models;

use tauri::Manager;

use crate::db::Database;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;
            let database = Database::open(data_dir.join("larder.sqlite"))?;
            app.manage(database);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::bootstrap,
            commands::create_location,
            commands::update_location,
            commands::delete_location,
            commands::reorder_locations,
            commands::create_item,
            commands::update_item,
            commands::delete_item,
            commands::update_settings,
            commands::export_data,
            commands::import_data,
            commands::clear_items,
            commands::restore_samples,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Larder");
}
