## CRM moderation integration

The backend accepts authenticated house and land submissions from
`crm.evtenia.ru` at `POST /api/crm/realty-submissions`. Set
`CRM_SUBMISSION_SECRET` to the same value as `DOM_REALTY_SUBMISSION_SECRET` on
the CRM server. When `CRM_SUBMISSION_SECRET` is omitted, the backend reuses the
existing `CRM_API_SECRET` value/file.

Submissions enter `pendingHomes` or `pendingLands`. Re-sending the same CRM
object updates its current pending item instead of creating a duplicate.

## CRM journal integration

The same authenticated integration exposes:

- `GET /api/crm/journal/categories` for the CRM category selector;
- `PUT /api/crm/journal/articles/:sourceId` for idempotent article publishing.

Set `CRM_SUBMISSION_SECRET` on this backend and
`DOM_JOURNAL_PUBLICATION_SECRET` on the CRM server to the same value. The CRM
can reuse its existing `DOM_REALTY_SUBMISSION_SECRET`. Re-publishing an article
with the same CRM ID updates it instead of creating a duplicate.
