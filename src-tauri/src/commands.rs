use chrono::Local;
use rusqlite::params;
use tauri::State;
use uuid::Uuid;

use crate::db::{item_from_row, location_from_row, lock, Database};
use crate::models::{
    Backup, Bootstrap, FoodItem, ItemInput, Location, LocationInput, Settings, SettingsInput,
};

fn now() -> String {
    Local::now().to_rfc3339()
}

fn all_locations(db: &Database) -> Result<Vec<Location>, String> {
    let conn = lock(&db.conn)?;
    let mut stmt = conn
        .prepare("SELECT * FROM locations ORDER BY sort_order ASC, name ASC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], location_from_row)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

fn all_items(db: &Database) -> Result<Vec<FoodItem>, String> {
    let conn = lock(&db.conn)?;
    let mut stmt = conn
        .prepare("SELECT * FROM items ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], item_from_row)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn bootstrap(db: State<'_, Database>) -> Result<Bootstrap, String> {
    Ok(Bootstrap {
        locations: all_locations(&db)?,
        items: all_items(&db)?,
        settings: db.get_settings()?,
    })
}

#[tauri::command]
pub fn create_location(input: LocationInput, db: State<'_, Database>) -> Result<Location, String> {
    let name = input.name.trim();
    if name.is_empty() {
        return Err("Give this location a name first.".into());
    }

    let location = Location {
        id: format!("loc-{}", Uuid::new_v4()),
        name: name.to_string(),
        icon: input.icon,
        color: input.color,
        description: input
            .description
            .map(|d| d.trim().to_string())
            .filter(|d| !d.is_empty()),
        sort_order: all_locations(&db)?.len() as i32,
        created_at: now(),
    };

    let conn = lock(&db.conn)?;
    conn.execute(
        "INSERT INTO locations (id, name, icon, color, description, sort_order, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            location.id,
            location.name,
            location.icon,
            location.color,
            location.description,
            location.sort_order,
            location.created_at
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(location)
}

#[tauri::command]
pub fn update_location(
    id: String,
    input: LocationInput,
    db: State<'_, Database>,
) -> Result<Location, String> {
    let name = input.name.trim();
    if name.is_empty() {
        return Err("Give this location a name first.".into());
    }

    let conn = lock(&db.conn)?;
    conn.execute(
        "UPDATE locations SET name = ?1, icon = ?2, color = ?3, description = ?4 WHERE id = ?5",
        params![
            name,
            input.icon,
            input.color,
            input
                .description
                .map(|d| d.trim().to_string())
                .filter(|d| !d.is_empty()),
            id
        ],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT * FROM locations WHERE id = ?1",
        params![id],
        location_from_row,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_location(id: String, db: State<'_, Database>) -> Result<(), String> {
    let locations = all_locations(&db)?;
    if locations.len() <= 1 {
        return Err("Keep at least one storage location.".into());
    }

    let fallback = locations
        .iter()
        .find(|location| location.id != id)
        .ok_or_else(|| "Keep at least one storage location.".to_string())?;

    let conn = lock(&db.conn)?;
    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    tx.execute(
        "UPDATE items SET location_id = ?1, updated_at = ?2 WHERE location_id = ?3",
        params![fallback.id, now(), id],
    )
    .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM locations WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reorder_locations(ids: Vec<String>, db: State<'_, Database>) -> Result<(), String> {
    let conn = lock(&db.conn)?;
    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    for (index, id) in ids.iter().enumerate() {
        tx.execute(
            "UPDATE locations SET sort_order = ?1 WHERE id = ?2",
            params![index as i32, id],
        )
        .map_err(|e| e.to_string())?;
    }
    tx.commit().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_item(input: ItemInput, db: State<'_, Database>) -> Result<FoodItem, String> {
    let name = input.name.trim();
    if name.is_empty() {
        return Err("Give this food a name first.".into());
    }
    if input.quantity < 0.0 {
        return Err("Quantity can't be negative.".into());
    }

    let stamp = now();
    let item = FoodItem {
        id: format!("item-{}", Uuid::new_v4()),
        name: name.to_string(),
        category: input.category,
        quantity: input.quantity,
        unit: input.unit,
        location_id: input.location_id,
        purchase_date: input.purchase_date.filter(|d| !d.is_empty()),
        expiry_date: input.expiry_date.filter(|d| !d.is_empty()),
        notes: input
            .notes
            .map(|n| n.trim().to_string())
            .filter(|n| !n.is_empty()),
        created_at: stamp.clone(),
        updated_at: stamp,
    };

    let conn = lock(&db.conn)?;
    conn.execute(
        "INSERT INTO items (id, name, category, quantity, unit, location_id,
            purchase_date, expiry_date, notes, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            item.id, item.name, item.category, item.quantity, item.unit, item.location_id,
            item.purchase_date, item.expiry_date, item.notes, item.created_at, item.updated_at
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(item)
}

#[tauri::command]
pub fn update_item(
    id: String,
    input: ItemInput,
    db: State<'_, Database>,
) -> Result<FoodItem, String> {
    let name = input.name.trim();
    if name.is_empty() {
        return Err("Give this food a name first.".into());
    }
    if input.quantity < 0.0 {
        return Err("Quantity can't be negative.".into());
    }

    let conn = lock(&db.conn)?;
    conn.execute(
        "UPDATE items SET name = ?1, category = ?2, quantity = ?3, unit = ?4,
            location_id = ?5, purchase_date = ?6, expiry_date = ?7, notes = ?8,
            updated_at = ?9 WHERE id = ?10",
        params![
            name,
            input.category,
            input.quantity,
            input.unit,
            input.location_id,
            input.purchase_date.filter(|d| !d.is_empty()),
            input.expiry_date.filter(|d| !d.is_empty()),
            input
                .notes
                .map(|n| n.trim().to_string())
                .filter(|n| !n.is_empty()),
            now(),
            id
        ],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row("SELECT * FROM items WHERE id = ?1", params![id], item_from_row)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_item(id: String, db: State<'_, Database>) -> Result<(), String> {
    let conn = lock(&db.conn)?;
    conn.execute("DELETE FROM items WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_settings(input: SettingsInput, db: State<'_, Database>) -> Result<Settings, String> {
    let current = db.get_settings()?;
    let theme = input.theme.unwrap_or(current.theme);
    let expiry_warning_days = input
        .expiry_warning_days
        .unwrap_or(current.expiry_warning_days)
        .clamp(1, 60);
    let sample_data = input.sample_data.unwrap_or(current.sample_data);

    let conn = lock(&db.conn)?;
    conn.execute(
        "UPDATE settings SET theme = ?1, expiry_warning_days = ?2, sample_data = ?3 WHERE id = 1",
        params![theme, expiry_warning_days, sample_data],
    )
    .map_err(|e| e.to_string())?;
    drop(conn);

    Ok(Settings {
        theme,
        expiry_warning_days,
        sample_data,
    })
}

#[tauri::command]
pub fn export_data(db: State<'_, Database>) -> Result<Backup, String> {
    Ok(Backup {
        version: 1,
        exported_at: now(),
        locations: all_locations(&db)?,
        items: all_items(&db)?,
        settings: db.get_settings()?,
    })
}

#[tauri::command]
pub fn import_data(backup: Backup, db: State<'_, Database>) -> Result<Bootstrap, String> {
    if backup.locations.is_empty() {
        return Err("This backup has no storage locations.".into());
    }
    if backup.version > 1 {
        return Err("This backup was made with a newer version of Larder.".into());
    }

    let valid_ids: Vec<String> = backup.locations.iter().map(|l| l.id.clone()).collect();
    let fallback = valid_ids[0].clone();
    let conn = lock(&db.conn)?;
    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;

    tx.execute("DELETE FROM items", []).map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM locations", [])
        .map_err(|e| e.to_string())?;

    for location in &backup.locations {
        tx.execute(
            "INSERT INTO locations (id, name, icon, color, description, sort_order, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                location.id,
                location.name,
                location.icon,
                location.color,
                location.description,
                location.sort_order,
                location.created_at
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    for item in &backup.items {
        let location_id = if valid_ids.contains(&item.location_id) {
            item.location_id.clone()
        } else {
            fallback.clone()
        };
        tx.execute(
            "INSERT INTO items (id, name, category, quantity, unit, location_id,
                purchase_date, expiry_date, notes, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                item.id, item.name, item.category, item.quantity, item.unit, location_id,
                item.purchase_date, item.expiry_date, item.notes, item.created_at, item.updated_at
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.execute(
        "UPDATE settings SET theme = ?1, expiry_warning_days = ?2, sample_data = ?3 WHERE id = 1",
        params![
            backup.settings.theme,
            backup.settings.expiry_warning_days.clamp(1, 60),
            backup.settings.sample_data
        ],
    )
    .map_err(|e| e.to_string())?;
    tx.execute(
        "INSERT OR REPLACE INTO metadata (key, value) VALUES ('seeded', '1')",
        [],
    )
    .map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;
    drop(conn);

    Ok(Bootstrap {
        locations: all_locations(&db)?,
        items: all_items(&db)?,
        settings: db.get_settings()?,
    })
}

#[tauri::command]
pub fn clear_items(db: State<'_, Database>) -> Result<(), String> {
    let conn = lock(&db.conn)?;
    conn.execute("DELETE FROM items", [])
        .map_err(|e| e.to_string())?;
    conn.execute("UPDATE settings SET sample_data = 0 WHERE id = 1", [])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn restore_samples(db: State<'_, Database>) -> Result<Bootstrap, String> {
    let stamp = now();
    let today = Local::now().date_naive();
    let samples = [
        ("Milk", "Dairy & Eggs", 1.0, "L", "loc-fridge", 3, -2, "Whole milk"),
        ("Free-range Eggs", "Dairy & Eggs", 12.0, "pcs", "loc-fridge", 14, -3, ""),
        ("Baby Spinach", "Produce", 1.0, "bag", "loc-fridge", 2, -1, "Wash before use"),
        ("Cheddar Cheese", "Dairy & Eggs", 250.0, "g", "loc-fridge", 9, -5, ""),
        ("Greek Yogurt", "Dairy & Eggs", 4.0, "cups", "loc-fridge", 6, -4, ""),
        ("Bananas", "Produce", 6.0, "pcs", "loc-counter", 5, -2, ""),
        ("Avocados", "Produce", 3.0, "pcs", "loc-counter", 4, -1, "Two are ripe"),
        ("Sourdough Bread", "Bakery", 1.0, "loaf", "loc-counter", 1, -1, ""),
        ("Chicken Breast", "Meat & Seafood", 800.0, "g", "loc-freezer", 21, -10, ""),
        ("Ground Beef", "Meat & Seafood", 500.0, "g", "loc-freezer", 0, -20, "Use today"),
        ("Frozen Berries", "Frozen", 1.0, "bag", "loc-freezer", 120, -30, ""),
        ("Jasmine Rice", "Pantry", 2.0, "kg", "loc-pantry", 365, -40, ""),
        ("Olive Oil", "Condiments", 1.0, "bottle", "loc-pantry", 240, -25, "Extra virgin"),
        ("Coffee Beans", "Beverages", 500.0, "g", "loc-pantry", 150, -12, "Medium roast"),
        ("Paprika", "Condiments", 1.0, "jar", "loc-spice", 300, -60, ""),
    ];

    let conn = lock(&db.conn)?;
    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM items", []).map_err(|e| e.to_string())?;

    let mut sort_order: i32 = tx
        .query_row("SELECT COUNT(*) FROM locations", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    for (id, name, icon, color) in [
        ("loc-fridge", "Fridge", "fridge", "#4A9D8E"),
        ("loc-freezer", "Freezer", "freezer", "#6E9BD6"),
        ("loc-pantry", "Pantry", "pantry", "#C9A15B"),
        ("loc-counter", "Counter", "counter", "#C28072"),
        ("loc-spice", "Spice Rack", "spice", "#9B7FC4"),
    ] {
        let exists: i64 = tx
            .query_row(
                "SELECT COUNT(*) FROM locations WHERE id = ?1",
                params![id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        if exists == 0 {
            tx.execute(
                "INSERT INTO locations (id, name, icon, color, description, sort_order, created_at)
                 VALUES (?1, ?2, ?3, ?4, NULL, ?5, ?6)",
                params![id, name, icon, color, sort_order, stamp],
            )
            .map_err(|e| e.to_string())?;
            sort_order += 1;
        }
    }

    for (name, category, quantity, unit, location_id, expiry, purchased, notes) in samples {
        let day = |offset: i64| {
            (today + chrono::Duration::days(offset))
                .format("%Y-%m-%d")
                .to_string()
        };
        tx.execute(
            "INSERT INTO items (id, name, category, quantity, unit, location_id,
                purchase_date, expiry_date, notes, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                format!("sample-{}", Uuid::new_v4()),
                name,
                category,
                quantity,
                unit,
                location_id,
                day(purchased),
                day(expiry),
                if notes.is_empty() { None } else { Some(notes) },
                stamp,
                stamp
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.execute("UPDATE settings SET sample_data = 1 WHERE id = 1", [])
        .map_err(|e| e.to_string())?;
    tx.execute(
        "INSERT OR REPLACE INTO metadata (key, value) VALUES ('seeded', '1')",
        [],
    )
    .map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;
    drop(conn);

    Ok(Bootstrap {
        locations: all_locations(&db)?,
        items: all_items(&db)?,
        settings: db.get_settings()?,
    })
}
