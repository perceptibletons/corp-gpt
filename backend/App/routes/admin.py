from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas
from ..utils.logger import log_action
from ..utils.jwt_handler import decode_access_token
from datetime import datetime

router = APIRouter(prefix="/api/admin", tags=["admin"])
http_bearer = HTTPBearer(auto_error=True)


# ---------------------------
# Helper: get current user from JWT
# ---------------------------
def get_current_user_from_token(creds: HTTPAuthorizationCredentials = Depends(http_bearer), db: Session = Depends(get_db)):
    """
    Expects Authorization: Bearer <token>
    decode_access_token should return payload with 'sub' (user id) and 'role'
    """
    token = creds.credentials
    try:
        payload = decode_access_token(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = payload.get("sub")
    role = payload.get("role")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {"user": user, "role": role, "payload": payload}


# ---------------------------
# RBAC dependency factory
# ---------------------------
def role_required(allowed_roles: List[str]):
    def dependency(current=Depends(get_current_user_from_token)):
        role = current.get("role") or (current["user"].role.value if hasattr(current["user"].role, "value") else current["user"].role)
        if role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Access denied")
        return current
    return dependency


# ---------------------------
# Admin: Approve User
# - Allowed: admin, superadmin
# ---------------------------
@router.post("/approve-user", summary="Approve a user account", dependencies=[Depends(role_required(["admin", "superadmin"]))])
def approve_user(payload: schemas.ApproveUserIn, current=Depends(get_current_user_from_token), db: Session = Depends(get_db), request: Request = None):
    """
    payload: { user_id: int, approve: bool }
    """
    actor = current["user"]
    actor_role = current["role"]

    target = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent approving superadmin/admin by admin if business rule requires superadmin only for certain actions.
    # Approve action itself is allowed, but changing role to admin is handled separately.
    target.is_approved = bool(payload.approve)
    db.add(target)
    db.commit()

    log_action(actor.id, "approve_user" if payload.approve else "unapprove_user", metadata=f"target={target.id},by_role={actor_role}")
    return {"message": f"User {'approved' if payload.approve else 'unapproved'} successfully", "user_id": target.id, "is_approved": target.is_approved}


# ---------------------------
# Admin: Change User Role
# - admin can change roles BUT cannot promote someone to 'admin' (only superadmin can)
# - superadmin can change any role
# ---------------------------
@router.post("/change-role", summary="Change a user's role", dependencies=[Depends(role_required(["admin", "superadmin"]))])
def change_role(payload: schemas.ChangeRoleIn, current=Depends(get_current_user_from_token), db: Session = Depends(get_db), request: Request = None):
    """
    payload: { user_id: int, new_role: str }
    """
    actor = current["user"]
    actor_role = current["role"]

    # Validate requested role
    try:
        new_role_enum = models.RoleEnum(payload.new_role)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid role requested")

    # Fetch target
    target = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # Business rule: Only superadmin can assign 'admin'
    if new_role_enum == models.RoleEnum.admin and actor_role != "superadmin":
        raise HTTPException(status_code=403, detail="Only superadmin can promote to admin")

    # Business rule: Only superadmin can change role of a superadmin
    if target.role == models.RoleEnum.superadmin and actor_role != "superadmin":
        raise HTTPException(status_code=403, detail="Cannot change role of a superadmin")

    # Prevent self-demotion of last superadmin (optional safety) - not implemented here but recommended to check
    # Apply change
    target.role = new_role_enum
    db.add(target)
    db.commit()

    log_action(actor.id, "change_role", metadata=f"target={target.id},from={target.role},to={new_role_enum},by={actor_role}")
    return {"message": "Role changed successfully", "user_id": target.id, "new_role": new_role_enum.value}


# ---------------------------
# Admin: Get users list (filtering)
# - Allowed: admin, superadmin
# ---------------------------
@router.get("/users", summary="List or filter users", dependencies=[Depends(role_required(["admin", "superadmin"]))])
def list_users(
    role: Optional[str] = Query(None, description="Filter by role"),
    status: Optional[str] = Query(None, description="Filter by status: pending | approved"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current=Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Example queries:
    - /api/admin/users?status=pending
    - /api/admin/users?role=employee
    """
    q = db.query(models.User)
    if role:
        try:
            role_enum = models.RoleEnum(role)
            q = q.filter(models.User.role == role_enum)
        except:
            raise HTTPException(status_code=400, detail="Invalid role filter")

    if status:
        if status == "pending":
            q = q.filter(models.User.is_approved == False)
        elif status == "approved":
            q = q.filter(models.User.is_approved == True)
        else:
            raise HTTPException(status_code=400, detail="Invalid status filter")

    total = q.count()
    users = q.order_by(models.User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    # Format minimal user view (avoid sending sensitive fields)
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role.value if hasattr(u.role, "value") else str(u.role),
            "is_verified": bool(u.is_verified),
            "is_approved": bool(u.is_approved),
            "created_at": u.created_at,
        })

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "users": result
    }
