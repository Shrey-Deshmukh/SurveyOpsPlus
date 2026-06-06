import type { Migration } from "@/db/migrations/types";

const createProjects = `CREATE TABLE projects (
  id TEXT PRIMARY KEY NOT NULL,
  ref TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  survey_details TEXT,
  instructions TEXT,
  status TEXT NOT NULL,
  location TEXT NOT NULL,
  date TEXT NOT NULL,
  representing_party TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);`;

const createProjectMetadata = `CREATE TABLE IF NOT EXISTS project_metadata (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  container_id TEXT,
  vessel_name TEXT,
  voyage_no TEXT,
  operator TEXT,
  port_of_loading TEXT,
  port_of_discharge TEXT,
  inspection_date TEXT,
  inspection_time TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);`;

const createImages = `CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  local_url TEXT NOT NULL,
  size_bytes INTEGER,
  format TEXT,
  notes TEXT,
  longitude REAL,
  latitude REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uploaded_at INTEGER,
  is_image_included INTEGER NOT NULL DEFAULT 0,
  tagging_status TEXT NOT NULL DEFAULT 'untagged',
  tagging_last_error TEXT,
  citations_json TEXT
);`;

const createImagesIndex = `CREATE INDEX IF NOT EXISTS idx_images_project_id ON images(project_id);`;

const createImageMetadata = `CREATE TABLE IF NOT EXISTS image_metadata (
  id TEXT PRIMARY KEY NOT NULL,
  image_id TEXT NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  tag_id TEXT,
  label TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);`;

const createImageTags = `CREATE TABLE IF NOT EXISTS image_tags (
  id TEXT PRIMARY KEY NOT NULL,
  label TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);`;

const createReports = `CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT,
  local_url TEXT,
  size_bytes INTEGER,
  status TEXT,
  created_at INTEGER,
  updated_at INTEGER
);`;

const createContextDocs = `CREATE TABLE IF NOT EXISTS context_docs (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT,
  type TEXT,
  local_url TEXT,
  size_bytes INTEGER,
  created_at INTEGER,
  updated_at INTEGER
);`;

export const migrationStatements: Migration = {
  version: 1,
  statements: [
    createProjects,
    createProjectMetadata,
    createImages,
    createImagesIndex,
    createImageMetadata,
    createImageTags,
    createReports,
    createContextDocs,
  ],
};
