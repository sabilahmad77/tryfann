from web3 import Web3

# RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/PITvP4RwOKxCZyXDY-URRPe4RRu7Wopb"
RPC_URL = "https://sepolia.infura.io/v3/07d85d4f9de74f81b1e6afc653983322"
PRIVATE_KEY = "b0c533c665afd2076487ec9e11f4fa938404bc186e5d853fe08f58a5202bd68a"
CONTRACT_ADDRESS = "0xBd4bfA2E111201bFbf5534185f4D82A4Bd250937"
CHAIN_ID = 11155111


ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "_identityRegistry", "type": "address"}
        ],
        "stateMutability": "nonpayable",
        "type": "constructor",
    },
    {"inputs": [], "name": "AccessControlBadConfirmation", "type": "error"},
    {
        "inputs": [
            {"internalType": "address", "name": "account", "type": "address"},
            {"internalType": "bytes32", "name": "neededRole", "type": "bytes32"},
        ],
        "name": "AccessControlUnauthorizedAccount",
        "type": "error",
    },
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "internalType": "uint256",
                "name": "claimTopic",
                "type": "uint256",
            }
        ],
        "name": "ClaimTopicAdded",
        "type": "event",
    },
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "internalType": "uint256",
                "name": "claimTopic",
                "type": "uint256",
            }
        ],
        "name": "ClaimTopicRemoved",
        "type": "event",
    },
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32",
            },
            {
                "indexed": True,
                "internalType": "bytes32",
                "name": "previousAdminRole",
                "type": "bytes32",
            },
            {
                "indexed": True,
                "internalType": "bytes32",
                "name": "newAdminRole",
                "type": "bytes32",
            },
        ],
        "name": "RoleAdminChanged",
        "type": "event",
    },
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32",
            },
            {
                "indexed": True,
                "internalType": "address",
                "name": "account",
                "type": "address",
            },
            {
                "indexed": True,
                "internalType": "address",
                "name": "sender",
                "type": "address",
            },
        ],
        "name": "RoleGranted",
        "type": "event",
    },
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32",
            },
            {
                "indexed": True,
                "internalType": "address",
                "name": "account",
                "type": "address",
            },
            {
                "indexed": True,
                "internalType": "address",
                "name": "sender",
                "type": "address",
            },
        ],
        "name": "RoleRevoked",
        "type": "event",
    },
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "internalType": "address",
                "name": "issuer",
                "type": "address",
            }
        ],
        "name": "TrustedIssuerAdded",
        "type": "event",
    },
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "internalType": "address",
                "name": "issuer",
                "type": "address",
            }
        ],
        "name": "TrustedIssuerRemoved",
        "type": "event",
    },
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "internalType": "address",
                "name": "user",
                "type": "address",
            }
        ],
        "name": "UserBlocked",
        "type": "event",
    },
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "internalType": "address",
                "name": "user",
                "type": "address",
            }
        ],
        "name": "UserRevoked",
        "type": "event",
    },
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "internalType": "address",
                "name": "user",
                "type": "address",
            }
        ],
        "name": "UserUnblocked",
        "type": "event",
    },
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "internalType": "address",
                "name": "user",
                "type": "address",
            }
        ],
        "name": "UserVerified",
        "type": "event",
    },
    {
        "inputs": [],
        "name": "ADMIN_ROLE",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "DEFAULT_ADMIN_ROLE",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "IDENTITY_REGISTRAR_ROLE",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "KYC_MANAGER_ROLE",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "claimTopic", "type": "uint256"}
        ],
        "name": "addClaimTopic",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "issuer", "type": "address"}],
        "name": "addTrustedIssuer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address[]", "name": "users", "type": "address[]"}],
        "name": "batchRevokeUsers",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "address[]", "name": "users", "type": "address[]"},
            {"internalType": "uint16[]", "name": "countries", "type": "uint16[]"},
        ],
        "name": "batchVerifyUsers",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
        "name": "blockUser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "getClaimTopics",
        "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}],
        "name": "getRoleAdmin",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "getTrustedIssuers",
        "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "role", "type": "bytes32"},
            {"internalType": "address", "name": "account", "type": "address"},
        ],
        "name": "grantRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
        "name": "hasIdentity",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "role", "type": "bytes32"},
            {"internalType": "address", "name": "account", "type": "address"},
        ],
        "name": "hasRole",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
        "name": "identity",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "identityRegistry",
        "outputs": [
            {
                "internalType": "contract IIdentityRegistry",
                "name": "",
                "type": "address",
            }
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
        "name": "investorCountry",
        "outputs": [{"internalType": "uint16", "name": "", "type": "uint16"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "issuer", "type": "address"}],
        "name": "isTrustedIssuer",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
        "name": "isUserBlocked",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
        "name": "isUserVerified",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
        "name": "isVerifiedERC3643",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "claimTopic", "type": "uint256"}
        ],
        "name": "removeClaimTopic",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "issuer", "type": "address"}],
        "name": "removeTrustedIssuer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "role", "type": "bytes32"},
            {
                "internalType": "address",
                "name": "callerConfirmation",
                "type": "address",
            },
        ],
        "name": "renounceRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "role", "type": "bytes32"},
            {"internalType": "address", "name": "account", "type": "address"},
        ],
        "name": "revokeRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
        "name": "revokeUser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "bytes4", "name": "interfaceId", "type": "bytes4"}],
        "name": "supportsInterface",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
        "name": "unblockUser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "address", "name": "user", "type": "address"},
            {"internalType": "uint16", "name": "country", "type": "uint16"},
        ],
        "name": "verifyUser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
]


def verify_blockchain_kyc(
    wallet: str = "0xC7cACA6385A40677C440ccADE513D972F7a82171",
    country: int = 92,
    wait_timeout: int = 180,
):
    user = Web3.to_checksum_address(wallet)

    w3 = Web3(Web3.HTTPProvider(RPC_URL, request_kwargs={"timeout": 60}))
    acct = w3.eth.account.from_key(PRIVATE_KEY)
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=ABI
    )

    # Pre-checks (avoid revert / wasted gas)
    if contract.functions.isUserBlocked(user).call():
        raise SystemExit("Target user is blocked; unblock first.")

    # if not contract.functions.hasIdentity(user).call():
    #     raise SystemExit("Target user has no identity registered in the identity registry.")

    if contract.functions.isUserVerified(user).call():
        return 1  # already verified

    # EIP-1559 fees (with fallback if RPC doesn't support maxPriorityFeePerGas)
    latest_block = w3.eth.get_block("latest")
    base_fee = int(latest_block.get("baseFeePerGas", 0) or 0)

    try:
        priority_fee = int(w3.eth.max_priority_fee)
    except Exception:
        try:
            fh = w3.eth.fee_history(5, "latest", [50])
            reward = fh["reward"]  # list[list[int]]
            priority_fee = (
                int(sum(r[0] for r in reward) / len(reward))
                if reward
                else w3.to_wei(2, "gwei")
            )
        except Exception:
            priority_fee = w3.to_wei(2, "gwei")

    max_fee = (base_fee * 2) + priority_fee

    nonce = w3.eth.get_transaction_count(acct.address, "pending")

    fncall = contract.functions.verifyUser(user, int(country))
    gas_est = fncall.estimate_gas({"from": acct.address})
    gas = int(gas_est * 1.20)

    tx = fncall.build_transaction(
        {
            "from": acct.address,
            "chainId": CHAIN_ID,
            "nonce": nonce,
            "type": 2,
            "maxPriorityFeePerGas": priority_fee,
            "maxFeePerGas": max_fee,
            "gas": gas,
        }
    )

    signed = acct.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    rcpt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=wait_timeout)
    return rcpt.status


def _get_clients():
    w3 = Web3(Web3.HTTPProvider(RPC_URL, request_kwargs={"timeout": 60}))
    acct = w3.eth.account.from_key(PRIVATE_KEY)
    c = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=ABI)
    return w3, acct, c


def _build_send_wait(w3, acct, fncall):
    latest = w3.eth.get_block("latest")
    base_fee = latest["baseFeePerGas"]
    priority_fee = w3.eth.max_priority_fee  # int (wei)
    max_fee = base_fee * 2 + priority_fee

    nonce = w3.eth.get_transaction_count(acct.address)
    gas_est = fncall.estimate_gas({"from": acct.address})
    gas = int(gas_est * 1.20)  # 20% headroom

    tx = fncall.build_transaction(
        {
            "from": acct.address,
            "chainId": CHAIN_ID,
            "nonce": nonce,
            "type": 2,
            "maxPriorityFeePerGas": priority_fee,
            "maxFeePerGas": max_fee,
            "gas": gas,
        }
    )
    signed = acct.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    rcpt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)
    return rcpt, tx_hash.hex()


def block_user(wallet):
    """
    Blocks a user. Requires KYC_MANAGER_ROLE or ADMIN_ROLE.
    No-ops if already blocked.
    """
    w3, acct, c = _get_clients()
    user = Web3.to_checksum_address(wallet)

    if c.functions.isUserBlocked(user).call():
        return {"status": "already_blocked", "user": user}

    rcpt, txh = _build_send_wait(w3, acct, c.functions.blockUser(user))
    ev = [e["args"]["user"] for e in c.events.UserBlocked().process_receipt(rcpt)]
    return {"ok": rcpt.status == 1, "tx": txh, "event_users": ev}


def unblock_user(wallet):
    """
    Unblocks a user. Requires KYC_MANAGER_ROLE or ADMIN_ROLE.
    No-ops if not blocked.
    """
    w3, acct, c = _get_clients()
    user = Web3.to_checksum_address(wallet)

    rcpt, txh = _build_send_wait(w3, acct, c.functions.unblockUser(user))
    ev = [e["args"]["user"] for e in c.events.UserUnblocked().process_receipt(rcpt)]
    return {"ok": rcpt.status == 1, "tx": txh, "event_users": ev}
