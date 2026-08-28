## CRM moderation integration

The backend accepts authenticated house and land submissions from
`crm.evtenia.ru` at `POST /api/crm/realty-submissions`. Set
`CRM_SUBMISSION_SECRET` to the same value as `DOM_REALTY_SUBMISSION_SECRET` on
the CRM server. When `CRM_SUBMISSION_SECRET` is omitted, the backend reuses the
existing `CRM_API_SECRET` value/file.

Submissions enter `pendingHomes` or `pendingLands`. Re-sending the same CRM
object updates its current pending item instead of creating a duplicate.
