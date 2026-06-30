import hmac, hashlib, json, urllib.parse, time
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.conf import settings
from django.http import HttpResponse, HttpResponseForbidden


def canonicalize(params: dict) -> str:
    # Sort keys, URL-encode values only (MoonPay requirement)
    pairs = []
    for k in sorted(params.keys()):
        v = "" if params[k] is None else str(params[k])
        pairs.append(f"{k}={urllib.parse.quote(v, safe='')}")
    return "&".join(pairs)


@csrf_exempt
@require_POST
def sign_widget_url(request):
    """
    Body: { "params": { "currencyCode": "eth",
                        "walletAddress": "0x...",
                        "baseCurrencyCode": "usd",
                        "baseCurrencyAmount": "50",
                        "redirectURL": "http://127.0.0.1:8002/admin",
                        "failureRedirectURL": "http://127.0.0.1:8002/" } }
    Returns: { "signedUrl": "...", "signature": "..." }
    """
    import json, hmac, hashlib, base64
    from urllib.parse import urlencode, quote

    try:
        body = json.loads(request.body.decode("utf-8"))
        params = dict(body.get("params", {}))
    except Exception:
        return HttpResponseBadRequest("invalid json")

    # 1) Inject publishable key
    params["apiKey"] = settings.MOONPAY_PUBLISHABLE_KEY

    # 2) Ensure correct param name (backwards-compat for callers sending baseAmount)
    if "baseAmount" in params and "baseCurrencyAmount" not in params:
        params["baseCurrencyAmount"] = params.pop("baseAmount")

    # 3) Build the EXACT query you'll send (values URL-encoded, stable order)
    # Sorting helps avoid gateway re-ordering issues.
    query = "?" + urlencode(sorted(params.items()), doseq=True)

    # 4) Sign: HMAC-SHA256 over the query string, BASE64 encode
    digest = hmac.new(
        settings.MOONPAY_SECRET_KEY.encode("utf-8"),
        query.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    signature_b64 = base64.b64encode(digest).decode("ascii")

    # 5) Append URL-encoded signature
    signed_url = f"{settings.MOONPAY_WIDGET_BASE}/{query}&signature={quote(signature_b64, safe='')}"

    return JsonResponse({"signedUrl": signed_url, "signature": signature_b64})


@csrf_exempt
def moonpay_webhook(request):
    """
    Validate MoonPay webhook header and handle buy transaction events.
    MoonPay uses header Moonpay-Signature-V2 (t=TIMESTAMP,s=HEX_SIGNATURE).
    The signed payload is: "<t>.<body>" HMAC-SHA256 using your MOONPAY_WEBHOOK_KEY.
    """
    header = request.headers.get("Moonpay-Signature-V2") or request.headers.get(
        "X-Signature-V2"
    )
    if not header:
        return HttpResponseForbidden("missing signature header")

    try:
        parts = dict(p.split("=", 1) for p in header.split(","))
        ts = parts.get("t")
        sig = parts.get("s")
    except Exception:
        return HttpResponseForbidden("bad signature header")

    payload = request.body.decode("utf-8")
    signed = f"{ts}.{payload}".encode("utf-8")
    expected = hmac.new(
        settings.MOONPAY_WEBHOOK_KEY.encode("utf-8"), signed, hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(expected, sig):
        return HttpResponseForbidden("invalid signature")

    event = json.loads(payload)
    etype = event.get("type")
    data = event.get("data", {})

    # Example: handle buy events
    if etype in (
        "transaction_created",
        "transaction_updated",
        "buy_transaction_updated",
    ):
        tx = data.get("transaction") or data.get("buy")
        status = tx.get("status")
        external_id = tx.get("externalId") or tx.get("externalCustomerId")
        moonpay_tx_id = tx.get("id")
        # tx may include a chain tx hash, e.g. tx.get("txHash") or tx.get("cryptoTransactionHash")
        tx_hash = tx.get("txHash") or tx.get("cryptoTransactionHash") or tx.get("hash")

        # Map externalId to your order and update status
        # Example logic:
        # order = Order.objects.filter(external_id=external_id).first()
        # if status in ("crypto_sent", "completed"): mark pending->complete and optionally verify on-chain tx_hash
        # if status in ("failed","cancelled"): mark failed and notify user
        pass

    return HttpResponse(status=200)
