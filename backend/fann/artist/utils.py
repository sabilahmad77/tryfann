import string, secrets
import os
import uuid
import requests

CHARS = string.ascii_uppercase + string.digits


def generateLabel(length: int = 8) -> str:
    return "".join(secrets.choice(CHARS) for _ in range(length))


CIRCLE_API_KEY = (
    "SAND_API_KEY:5a2abe0340324f9a4084f491fe632ccd:8a53c43dee0515be2b8fcd2678b9cc15"
)
CIRCLE_BASE_URL = "https://api-sandbox.circle.com"

url = f"{CIRCLE_BASE_URL}/v1/businessAccount/banks/wires"

headers = {
    "Authorization": f"Bearer {CIRCLE_API_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}


def create_circle_bank_account(
    *,
    country: str,
    bank_city: str,
    bank_name: str,
    nick_name: str,
    bic_swift: str,
    account_number: str,
    bank_holder_name: str,
    street_address: str | None = None,
    zip_code: str | None = None,
    city: str | None = None,
    state_province: str | None = None,
):
    """
    Create a NON-US wire bank account in Circle (IBAN not used).
    This mirrors the fields you see in the Circle dashboard UI.
    """

    body = {
        "idempotencyKey": str(uuid.uuid4()),
        # non-US, IBAN NOT supported:
        "accountNumber": account_number,
        "routingNumber": bic_swift,  # this is your BIC / SWIFT
        "billingDetails": {
            "name": bank_holder_name,  # account holder
            "city": city,
            "country": country,  # e.g. "KW" for Kuwait
            "line1": street_address,
            "postalCode": zip_code,
        },
        "bankAddress": {
            "bankName": bank_name,
            "city": bank_city,
            "country": country,
            # optional:
            "line1": street_address or "",
            "district": state_province or "",
        },
    }

    resp = requests.post(url, json=body, headers=headers)
    resp.raise_for_status()
    data = resp.json()["data"]
    bank_account_id = data["id"]
    print("Created Circle bank account:", bank_account_id, "nickname:", nick_name)

    return data


# resp = create_circle_bank_account(
#     country="KW",                  #
#     bank_city="Kuwait City",
#     bank_name="National Bank of Kuwait",
#     nick_name="Main Kuwait Account",
#     bic_swift="NBOKKWKW",
#     account_number="123456789012",
#     bank_holder_name="Ninja",
#     street_address="Block 1, Test Street",
#     zip_code="00000",
#     city="Kuwait City",
#     state_province="Al Asimah"
# )


def create_seller_payout(
    bank_account_id: str,
    amount: str = "1.00",
    currency: str = "USD",
) -> dict:
    url = f"{CIRCLE_BASE_URL}/v1/businessAccount/payouts"

    body = {
        "destination": {
            "type": "wire",
            "id": bank_account_id,
        },
        "amount": {
            "currency": currency,
            "amount": amount,  # as string, e.g. "1.00"
        },
        "idempotencyKey": str(uuid.uuid4()),
    }

    resp = requests.post(url, json=body, headers=headers)
    resp.raise_for_status()
    data = resp.json()["data"]

    print("Created payout:", data["id"], "status:", data["status"])
    return data


# create_seller_payout(
#     bank_account_id="f4926c20-99aa-4afc-9263-d85adaa8b936",
#     amount="1.00",
#     currency="USD",
# )
