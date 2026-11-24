use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Location {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub color: String,
    pub description: Option<String>,
    pub sort_order: i32,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocationInput {
    pub name: String,
    pub icon: String,
    pub color: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FoodItem {
    pub id: String,
    pub name: String,
    pub category: String,
    pub quantity: f64,
    pub unit: String,
    pub location_id: String,
    pub purchase_date: Option<String>,
    pub expiry_date: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemInput {
    pub name: String,
    pub category: String,
    pub quantity: f64,
    pub unit: String,
    pub location_id: String,
    pub purchase_date: Option<String>,
    pub expiry_date: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub theme: String,
    pub expiry_warning_days: i32,
    pub sample_data: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsInput {
    pub theme: Option<String>,
    pub expiry_warning_days: Option<i32>,
    pub sample_data: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Bootstrap {
    pub locations: Vec<Location>,
    pub items: Vec<FoodItem>,
    pub settings: Settings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Backup {
    pub version: i32,
    pub exported_at: String,
    pub locations: Vec<Location>,
    pub items: Vec<FoodItem>,
    pub settings: Settings,
}
