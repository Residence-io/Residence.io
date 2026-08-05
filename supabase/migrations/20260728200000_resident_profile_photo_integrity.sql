WITH ranked_photographs AS (
  SELECT
    id,
    resident_id,
    object_key,
    ROW_NUMBER() OVER (
      PARTITION BY resident_id
      ORDER BY created_at DESC, id DESC
    ) AS row_number
  FROM resident_document
  WHERE category = 'PROFILE_PHOTOGRAPH'
    AND status = 'ACTIVE'
),
reconciled AS (
  UPDATE resident_document AS document
  SET
    status = 'REPLACED',
    archived_at = COALESCE(document.archived_at, CURRENT_TIMESTAMP),
    version = document.version + 1
  FROM ranked_photographs AS ranked
  WHERE document.id = ranked.id
    AND ranked.row_number > 1
  RETURNING document.id
)
UPDATE resident AS resident_record
SET profile_photograph_object_key = latest.object_key
FROM ranked_photographs AS latest
WHERE resident_record.id = latest.resident_id
  AND latest.row_number = 1;

CREATE UNIQUE INDEX resident_document_one_active_profile_photograph
  ON resident_document (resident_id)
  WHERE category = 'PROFILE_PHOTOGRAPH'
    AND status = 'ACTIVE';
