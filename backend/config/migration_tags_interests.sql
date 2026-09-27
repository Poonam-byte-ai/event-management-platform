-- Run this ONCE against your existing database in MySQL Workbench
-- (adds the two new columns without touching any existing data).

ALTER TABLE events ADD COLUMN tags VARCHAR(255) AFTER event_type;
ALTER TABLE users ADD COLUMN interests VARCHAR(255) AFTER prn;
