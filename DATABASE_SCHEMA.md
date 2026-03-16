# NutriTech Database Schema Documentation

This document provides a detailed overview of the database tables and columns used in the NutriTech Application, hosted on Supabase.

## Schemas Used
- `public`: General application tables.
- `experiment`: Tables specific to experimental data, tubs, and sensing.

---

## 1. Core Tables

### Table: `experiments` (Schema: `experiment`)
Stores metadata about agricultural experiments.

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `id` | `bigint` | Primary Key (Manually incremented in backend) |
| `title` | `text` | Name of the experiment (e.g., "Tomato Loam Growth") |
| `description` | `text` | Detailed notes about the experiment |
| `status` | `text` | Current state: `planned`, `active`, `paused`, `completed` |
| `started_at` | `timestamp` | When the experiment changed to `active` |
| `ended_at` | `timestamp` | When the experiment changed to `completed` |
| `created_at` | `timestamp`| Record creation time |

### Table: `tubs` (Schema: `experiment`)
Represents physical containers (buckets) equipped with sensors.

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `id` | `bigint` | Primary Key |
| `label` | `text` | Human-readable name (e.g., "Tub 1", "Bucket A") |
| `experiment_id`| `bigint` | Foreign Key to `experiments.id`. Null if tub is free. |
| `soil_type` | `text` | Type of soil currently in the tub |
| `plant_name` | `text` | Type of plant being grown |
| `growth_rate` | `text` | (Metadata) Expected growth rate |

### Table: `sensor_data` (Schema: `experiment`)
Logs all readings captured by the ESP32 sensors.

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `id` | `bigint` | Primary Key |
| `tub_id` | `bigint` | Link to the specific physical tub |
| `sensor_id` | `text` | ID of the hardware unit (e.g., `esp32-001`) |
| `soil_ph` | `real` | Soil acidity/alkalinity |
| `soil_moisture`| `real` | Moisture percentage |
| `soil_temp` | `real` | Temperature of the soil (°C) |
| `nitrogen` | `real` | Nitrogen level (mg/kg) |
| `phosphorus` | `real` | Phosphorus level (mg/kg) |
| `potassium` | `real` | Potassium level (mg/kg) |
| `soil_ec` | `real` | Electrical conductivity |
| `air_temp` | `real` | Ambient air temperature |
| `air_humidity` | `real` | Ambient air humidity |
| `health` | `real` | Manual score (0.0 - 1.0) entered by the user |
| `created_at` | `timestamp`| Time of reading |

### Table: `sensor_status` (Schema: `public`)
Control table for hardware communication (ESP32).

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `sensor_id` | `text` | Primary Key (e.g., `esp32-001`) |
| `is_active` | `boolean`| Whether the sensor is powered on |
| `is_locked` | `boolean`| Set to `true` by backend to trigger a reading |
| `tub_id` | `bigint` | The tub the sensor is currently placed in |
| `last_seen` | `timestamp`| Heartbeat from the hardware |

---

## 2. Utility & View Tables

### Table: `wifi_status` (Schema: `public`)
Tracks connectivity status of the sensing units.

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `location` | `text` | Physical installation location |
| `is_online` | `boolean`| Connectivity status |
| `updated_at` | `timestamp`| Last status check |

### Database Views (Read-Only)
The following views aggregate data for the Analytics dashboard:
- `v_experiment_summary`: Totals and averages per experiment.
- `v_raw_dataset`: Joins sensors, experiments, and weather data for analysis.
- `v_ml_dataset`: Cleaned data specifically formatted for the ML training pipeline.
- `v_tub_lock_status`: Real-time status of all tubs and their current locks.
