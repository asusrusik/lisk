/*
  DESCRIPTION: Counts duplicated delegates.

  PARAMETERS: None
*/

WITH duplicates AS
  (
    SELECT count(1)
    FROM delegates
    GROUP BY "transactionId"
    HAVING count(1) > 1
  )
SELECT count(1)
FROM duplicates
