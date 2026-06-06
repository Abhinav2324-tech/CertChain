from datetime import datetime, timezone
from sqlalchemy.orm import Session

from .. import models


def log_action(
    db: Session,
    certificate_id: str,
    action: str,
    details: str | None = None,
) -> None:
    audit_entry = models.AuditLog(
        certificate_id=certificate_id,
        action=action,
        timestamp=datetime.now(timezone.utc).isoformat(),
        details=details,
    )
    db.add(audit_entry)
