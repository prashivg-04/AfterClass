-- Migration: Add class_date and summary columns to classes table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE classes ADD COLUMN class_date DATE;
ALTER TABLE classes ADD COLUMN summary TEXT;
