-- Migration 002: Per-Terminal Besuchertypen
ALTER TABLE terminals
  ADD COLUMN IF NOT EXISTS allowed_visitor_types TEXT DEFAULT '["truck","visitor","service"]';
