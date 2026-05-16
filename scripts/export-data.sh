#!/bin/bash
# Export local data เป็น INSERT statements สำหรับ Supabase
# Usage: bash scripts/export-data.sh [db_name] [db_user] [db_host]

DB_NAME="${1:-kindergarten}"
DB_USER="${2:-postgres}"
DB_HOST="${3:-localhost}"
OUTPUT="local_data.sql"

echo "Exporting from $DB_HOST/$DB_NAME as $DB_USER..."

echo "-- KinderCare Data Export $(date)" > $OUTPUT
echo "-- Paste ทั้งหมดนี้ใน Supabase SQL Editor แล้วกด Run" >> $OUTPUT
echo "" >> $OUTPUT

# ลำดับตาม FK dependencies
TABLES=(
  "app_user"
  "child"
  "cohort"
  "parent_child"
  "teacher_permission"
  "enrollment"
  "daily"
  "attendance"
  "daily_report"
  "behavior_category"
  "behavior_item"
  "child_behavior_score"
  "child_excretion"
)

for TABLE in "${TABLES[@]}"; do
  COUNT=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM $TABLE" 2>/dev/null || echo "0")
  if [ "$COUNT" = "0" ] || [ -z "$COUNT" ]; then
    echo "  skip $TABLE (empty)"
    continue
  fi
  echo "  export $TABLE ($COUNT rows)"
  echo "-- $TABLE" >> $OUTPUT
  pg_dump \
    --data-only \
    --column-inserts \
    --no-owner \
    --no-privileges \
    --no-comments \
    -h $DB_HOST \
    -U $DB_USER \
    -d $DB_NAME \
    -t $TABLE 2>/dev/null \
    | grep -v "^SET " \
    | grep -v "^SELECT pg_catalog" \
    | grep -v "^--" \
    | grep -v "^$" \
    >> $OUTPUT
  echo "" >> $OUTPUT
done

echo ""
echo "Done → $OUTPUT"
wc -l $OUTPUT
