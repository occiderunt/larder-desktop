use std::path::Path;
use std::sync::{Mutex, MutexGuard};

use chrono::{Duration, Local};
use rusqlite::{params, Connection, OptionalExtension, Row};
use uuid::Uuid;

use crate::models::{FoodItem, Location, Settings};

pub struct Database {
    pub conn: Mutex<Connection>,
}

pub fn lock(conn: &Mutex<Connection>) -> Result<MutexGuard<'_, Connection>, String> {
    conn.lock().map_err(|e| e.to_string())
}

impl Database {
    pub fn open(path: impl AsRef<Path>) -> Result<Self, String> {
        let conn = Connection::open(path).map_err(|e| e.to_string())?;
        conn.execute_batch(
            "PRAGMA foreign_keys = ON;
             PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;",
        )
        .map_err(|e| e.to_string())?;

        let db = Self {
            conn: Mutex::new(conn),
        };
        db.migrate()?;
        db.seed()?;
        Ok(db)
    }

    fn migrate(&self) -> Result<(), String> {
        let conn = lock(&self.conn)?;
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS locations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                icon TEXT NOT NULL,
                color TEXT NOT NULL,
                description TEXT,
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
             );
             CREATE TABLE IF NOT EXISTS items (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                quantity REAL NOT NULL,
                unit TEXT NOT NULL,
                location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
                purchase_date TEXT,
                expiry_date TEXT,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
             );
             CREATE INDEX IF NOT EXISTS items_location_idx ON items(location_id);
             CREATE INDEX IF NOT EXISTS items_expiry_idx ON items(expiry_date);
             CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                theme TEXT NOT NULL DEFAULT 'system',
                expiry_warning_days INTEGER NOT NULL DEFAULT 5,
                sample_data INTEGER NOT NULL DEFAULT 0
             );
             INSERT OR IGNORE INTO settings (id) VALUES (1);
             CREATE TABLE IF NOT EXISTS metadata (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
             );",
        )
        .map_err(|e| e.to_string())
    }

    fn seed(&self) -> Result<(), String> {
        let conn = lock(&self.conn)?;
        let seeded: Option<String> = conn
            .query_row(
                "SELECT value FROM metadata WHERE key = 'seeded'",
                [],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| e.to_string())?;

        if seeded.is_some() {
            return Ok(());
        }

        let now = Local::now().to_rfc3339();
        let defaults = [
            ("loc-fridge", "Fridge", "fridge", "#4A9D8E"),
            ("loc-freezer", "Freezer", "freezer", "#6E9BD6"),
            ("loc-pantry", "Pantry", "pantry", "#C9A15B"),
            ("loc-counter", "Counter", "counter", "#C28072"),
            ("loc-spice", "Spice Rack", "spice", "#9B7FC4"),
        ];

        for (index, (id, name, icon, color)) in defaults.iter().enumerate() {
            conn.execute(
                "INSERT INTO locations (id, name, icon, color, description, sort_order, created_at)
                 VALUES (?1, ?2, ?3, ?4, NULL, ?5, ?6)",
                params![id, name, icon, color, index as i32, now],
            )
            .map_err(|e| e.to_string())?;
        }

        for item in sample_items() {
            conn.execute(
                "INSERT INTO items (id, name, category, quantity, unit, location_id,
                    purchase_date, expiry_date, notes, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
                params![
                    item.id, item.name, item.category, item.quantity, item.unit,
                    item.location_id, item.purchase_date, item.expiry_date, item.notes,
                    item.created_at, item.updated_at
                ],
            )
            .map_err(|e| e.to_string())?;
        }

        conn.execute("UPDATE settings SET sample_data = 1 WHERE id = 1", [])
            .map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO metadata (key, value) VALUES ('seeded', '1')",
            [],
        )
        .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn get_settings(&self) -> Result<Settings, String> {
        let conn = lock(&self.conn)?;
        conn.query_row(
            "SELECT theme, expiry_warning_days, sample_data FROM settings WHERE id = 1",
            [],
            |row| {
                Ok(Settings {
                    theme: row.get(0)?,
                    expiry_warning_days: row.get(1)?,
                    sample_data: row.get::<_, i64>(2)? != 0,
                })
            },
        )
        .map_err(|e| e.to_string())
    }
}

pub fn location_from_row(row: &Row<'_>) -> rusqlite::Result<Location> {
    Ok(Location {
        id: row.get("id")?,
        name: row.get("name")?,
        icon: row.get("icon")?,
        color: row.get("color")?,
        description: row.get("description")?,
        sort_order: row.get("sort_order")?,
        created_at: row.get("created_at")?,
    })
}

pub fn item_from_row(row: &Row<'_>) -> rusqlite::Result<FoodItem> {
    Ok(FoodItem {
        id: row.get("id")?,
        name: row.get("name")?,
        category: row.get("category")?,
        quantity: row.get("quantity")?,
        unit: row.get("unit")?,
        location_id: row.get("location_id")?,
        purchase_date: row.get("purchase_date")?,
        expiry_date: row.get("expiry_date")?,
        notes: row.get("notes")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn date(offset: i64) -> String {
    (Local::now().date_naive() + Duration::days(offset))
        .format("%Y-%m-%d")
        .to_string()
}

fn sample_items() -> Vec<FoodItem> {
    let now = Local::now().to_rfc3339();
    let data = [
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

    data.iter()
        .map(|(name, category, quantity, unit, location_id, expiry, purchased, notes)| {
            FoodItem {
                id: format!("sample-{}", Uuid::new_v4()),
                name: (*name).to_string(),
                category: (*category).to_string(),
                quantity: *quantity,
                unit: (*unit).to_string(),
                location_id: (*location_id).to_string(),
                purchase_date: Some(date(*purchased)),
                expiry_date: Some(date(*expiry)),
                notes: if notes.is_empty() {
                    None
                } else {
                    Some((*notes).to_string())
                },
                created_at: now.clone(),
                updated_at: now.clone(),
            }
        })
        .collect()
}
