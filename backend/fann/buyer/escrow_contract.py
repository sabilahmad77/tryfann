from web3 import Web3

RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/PITvP4RwOKxCZyXDY-URRPe4RRu7Wopb"
CONTRACT = "0x91fAEf98C1a639A27d67a3d3DFe659D885eAB1EA"
PRIVATE_KEY = "e014604101adb6de41cdfbe950a3a42bd7ca1b4a5a7330c7fea20cc1bfd65483"

ESCROW_ABI = [
    {
        "inputs": [{"internalType": "uint256", "name": "_saleId", "type": "uint256"}],
        "name": "releaseToSeller",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "uint256", "name": "saleId", "type": "uint256"}],
        "name": "getPayment",
        "outputs": [
            {"internalType": "uint256", "name": "_saleId", "type": "uint256"},
            {"internalType": "address", "name": "_payer", "type": "address"},
            {"internalType": "address", "name": "_beneficiary", "type": "address"},
            {"internalType": "uint256", "name": "_amount", "type": "uint256"},
            {"internalType": "uint256", "name": "_releaseAfter", "type": "uint256"},
            {"internalType": "uint8", "name": "_status", "type": "uint8"},
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "internalType": "uint256",
                "name": "saleId",
                "type": "uint256",
            },
            {
                "indexed": True,
                "internalType": "address",
                "name": "to",
                "type": "address",
            },
            {
                "indexed": False,
                "internalType": "uint256",
                "name": "priceAmount",
                "type": "uint256",
            },
        ],
        "name": "PaymentReleased",
        "type": "event",
    },
]


def release_to_seller(sale_id: int, chain_id: int = 11155111, wait_timeout: int = 180):
    w3 = Web3(Web3.HTTPProvider(RPC_URL, request_kwargs={"timeout": 60}))
    acct = w3.eth.account.from_key(PRIVATE_KEY)
    escrow = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT), abi=ESCROW_ABI)
    try:
        _saleId, _payer, _beneficiary, _amount, _releaseAfter, _status = (
            escrow.functions.getPayment(sale_id).call()
        )
        precheck = {"status": int(_status), "amount": int(_amount)}
        if int(_status) != 1:  # not Locked
            return {"ok": False, "error": "Escrow not Locked", "precheck": precheck}
        if int(_amount) == 0:
            return {"ok": False, "error": "No amount to release", "precheck": precheck}
    except Exception as e:
        precheck = {"error": f"getPayment failed: {e}"}

    latest = w3.eth.get_block("latest")
    base_fee = latest.get("baseFeePerGas", 0)
    priority_fee = w3.eth.max_priority_fee  # wei
    max_fee = base_fee * 2 + priority_fee  # simple headroom

    fn = escrow.functions.releaseToSeller(sale_id)
    gas_est = fn.estimate_gas({"from": acct.address})
    gas_limit = int(gas_est * 1.15)

    tx = fn.build_transaction(
        {
            "from": acct.address,
            "chainId": chain_id,
            "nonce": w3.eth.get_transaction_count(acct.address),
            "type": 2,
            "maxPriorityFeePerGas": priority_fee,
            "maxFeePerGas": max_fee,
            "gas": gas_limit,
        }
    )
    signed = acct.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    rcpt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=wait_timeout)

    try:
        logs = escrow.events.PaymentReleased().process_receipt(rcpt)
        ev = None
        if logs:
            e = logs[0]["args"]
            ev = {
                "saleId": int(e["saleId"]),
                "to": e["to"],
                "priceAmount": int(e["priceAmount"]),
            }
    except Exception:
        ev = None
    return {
        "ok": rcpt.status == 1,
        "tx": tx_hash.hex(),
        "blockNumber": rcpt.blockNumber,
        "gasUsed": rcpt.gasUsed,
        "event": ev,
        "precheck": precheck,
    }


def release_to_buyer(sale_id: int, chain_id: int = 11155111, wait_timeout: int = 180):
    from web3 import Web3

    ADMIN_WITHDRAW_ABI = [
        {
            "inputs": [
                {"internalType": "address", "name": "to", "type": "address"},
                {"internalType": "uint256", "name": "amount", "type": "uint256"},
            ],
            "name": "adminWithdraw",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function",
        }
    ]

    w3 = Web3(Web3.HTTPProvider(RPC_URL, request_kwargs={"timeout": 60}))
    acct = w3.eth.account.from_key(PRIVATE_KEY)

    combined_abi = ESCROW_ABI + ADMIN_WITHDRAW_ABI
    escrow = w3.eth.contract(
        address=Web3.to_checksum_address(CONTRACT), abi=combined_abi
    )

    try:
        _saleId, _payer, _beneficiary, _amount, _releaseAfter, _status = (
            escrow.functions.getPayment(sale_id).call()
        )
        precheck = {
            "payer": _payer,
            "amount": int(_amount),
            "status": int(_status),  # EscrowStatus: 0=None, 1=Locked, 2=Released
        }
    except Exception as e:
        return {"ok": False, "error": f"getPayment failed: {e}"}

    if int(_amount) == 0:
        return {"ok": False, "error": "No amount to refund", "precheck": precheck}

    if int(_status) != 1:
        return {
            "ok": False,
            "error": "Escrow not Locked (cannot refund)",
            "precheck": precheck,
        }

    # 2) Build EIP-1559 tx for adminWithdraw(payer, amount)
    latest = w3.eth.get_block("latest")
    base_fee = latest.get("baseFeePerGas", 0)
    priority_fee = w3.eth.max_priority_fee  # wei
    max_fee = base_fee * 2 + priority_fee

    fn = escrow.functions.adminWithdraw(_payer, int(_amount))
    gas_est = fn.estimate_gas({"from": acct.address})
    gas_limit = int(gas_est * 1.15)

    tx = fn.build_transaction(
        {
            "from": acct.address,
            "chainId": chain_id,
            "nonce": w3.eth.get_transaction_count(acct.address),
            "type": 2,
            "maxPriorityFeePerGas": priority_fee,
            "maxFeePerGas": max_fee,
            "gas": gas_limit,
        }
    )

    signed = acct.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    rcpt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=wait_timeout)

    return {
        "ok": rcpt.status == 1,
        "tx": tx_hash.hex(),
        "blockNumber": rcpt.blockNumber,
        "gasUsed": rcpt.gasUsed,
        "refundedTo": _payer,
        "refundedAmount": int(_amount),
        "precheck": precheck,
    }
