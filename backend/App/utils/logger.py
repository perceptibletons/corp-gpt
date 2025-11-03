from ..models import AuditLog
from .database import SessionLocal

def log_action(user_id: int, action: str, metadata: str = None):
    db = SessionLocal()
    try:
        al = AuditLog(user_id=user_id, action=action, metadata=metadata)
        db.add(al)
        db.commit()
    except Exception as e:
        db.rollback()
        print("Failed to write audit log:", e)
    finally:
        db.close()
