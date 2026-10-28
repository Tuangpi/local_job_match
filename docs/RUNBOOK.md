# Operations Runbook

## Health
- API health endpoint: GET /api/v1/health
- Monitor failed authentication, unusual request volume, and storage failures.

## Backups
- Run scripts/backup.sh with DATABASE_URL and UPLOAD_DIR configured.
- Test restoration periodically in staging.

## Recovery
1. Restore PostgreSQL from the latest successful dump.
2. Restore uploaded files archive to UPLOAD_DIR.
3. Apply pending migrations with npm run prisma:migrate:deploy.
4. Start the API and verify /api/v1/health.
5. Confirm a controlled test login and job view.

## Incident Contacts
- Maintain an on-call contact list outside the repository.
