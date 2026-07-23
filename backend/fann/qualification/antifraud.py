"""
Lightweight anti-fraud helpers for the pre-launch funnel.

Disposable-email blocking at registration, signup IP/UA fingerprinting, and a
soft duplicate-IP-burst flag (logged to AuditLog, not blocking). All best-effort
and guarded — never break the registration path.
"""
import logging
from datetime import timedelta

from django.utils import timezone

logger = logging.getLogger(__name__)

# Small built-in disposable-domain blocklist. Extend as needed (or move to a
# config/DB table later).
DISPOSABLE_DOMAINS = {
    "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
    "temp-mail.org", "trashmail.com", "yopmail.com", "throwawaymail.com",
    "getnada.com", "sharklasers.com", "dispostable.com", "maildrop.cc",
    "fakeinbox.com", "mailnesia.com", "mintemail.com", "mohmal.com",
    "moakt.com", "emailondeck.com", "spamgourmet.com", "tempail.com",
    "discard.email", "fakemail.net", "tmpmail.org", "mailcatch.com",
}

DUP_IP_WINDOW = timedelta(hours=24)
DUP_IP_THRESHOLD = 3
# Enh-1: same-device signup burst — tighter than IP (shared NAT inflates IPs,
# a device fingerprint repeating is a stronger multi-account signal).
DUP_DEVICE_WINDOW = timedelta(hours=24)
DUP_DEVICE_THRESHOLD = 2


def is_disposable_email(email):
    if not email or "@" not in email:
        return False
    domain = email.rsplit("@", 1)[1].strip().lower()
    return domain in DISPOSABLE_DOMAINS


def client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR") or None


def _device_fingerprint(request):
    """Enh-1: client-supplied device fingerprint (best-effort).

    The SPA computes a stable hash (canvas/UA/screen/timezone) and sends it as
    `device_fingerprint` in the register body or an `X-Device-Fingerprint`
    header. Never trusted for auth — only a soft anti-fraud signal. Returns a
    trimmed value or None.
    """
    fp = None
    data = getattr(request, "data", None)
    if isinstance(data, dict):
        fp = data.get("device_fingerprint")
    if not fp:
        fp = request.META.get("HTTP_X_DEVICE_FINGERPRINT")
    if not fp:
        return None
    return str(fp).strip()[:128] or None


def record_signup_fingerprint(user, request):
    """Store signup IP/UA on the RoleProfile + AuditLog; soft-flag IP bursts.

    Best-effort: any failure is logged and swallowed so registration is never
    affected.
    """
    # Imported lazily to avoid any app-loading order issues.
    from fann.qualification.models import AuditLog, RoleProfile

    try:
        ip = client_ip(request)
        ua = (request.META.get("HTTP_USER_AGENT") or "")[:255]
        device_fp = _device_fingerprint(request)
        rp = RoleProfile.objects.filter(user=user).first()
        if rp is not None:
            details = dict(rp.details or {})
            details["signup_ip"] = ip
            details["signup_ua"] = ua
            if device_fp:
                details["device_fingerprint"] = device_fp
            RoleProfile.objects.filter(pk=rp.pk).update(details=details)
        AuditLog.objects.create(
            actor=user,
            action="signup",
            target_type="user",
            target_id=str(user.pk),
            metadata={"ip": ip, "ua": ua, "device_fp": device_fp},
        )
        if ip:
            recent = AuditLog.objects.filter(
                action="signup",
                metadata__ip=ip,
                created_at__gte=timezone.now() - DUP_IP_WINDOW,
            ).count()
            if recent >= DUP_IP_THRESHOLD:
                AuditLog.objects.create(
                    action="fraud_flag",
                    target_type="user",
                    target_id=str(user.pk),
                    metadata={"reason": "duplicate_ip_signup", "ip": ip, "count": recent},
                )
        # Enh-1: same device fingerprint reused across signups → multi-account flag.
        if device_fp:
            dev_recent = AuditLog.objects.filter(
                action="signup",
                metadata__device_fp=device_fp,
                created_at__gte=timezone.now() - DUP_DEVICE_WINDOW,
            ).count()
            if dev_recent >= DUP_DEVICE_THRESHOLD:
                AuditLog.objects.create(
                    action="fraud_flag",
                    target_type="user",
                    target_id=str(user.pk),
                    metadata={
                        "reason": "duplicate_device_fingerprint",
                        "device_fp": device_fp,
                        "count": dev_recent,
                    },
                )
    except Exception:
        logger.exception(
            "record_signup_fingerprint failed for user=%s", getattr(user, "pk", None)
        )
