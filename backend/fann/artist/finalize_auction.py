from datetime import datetime, timedelta

from fann.artist.models import Order, AuctionBid, PaymentTransaction, Payout

AUCTION_CONTRACT_ADDRESS = "0xeafc605282BEfdC12CE73917b72fBCe8c2d93Ac2"
from web3 import Web3

RPC_URL = "https://sepolia.infura.io/v3/07d85d4f9de74f81b1e6afc653983322"
PRIVATE_KEY = "e014604101adb6de41cdfbe950a3a42bd7ca1b4a5a7330c7fea20cc1bfd65483"
CONTRACT_ADDRESS = "0x2ff598aaab89aa39dfe597a9546a4d9b9f6a8b99"
CHAIN_ID = 11155111


AUCTION_ABI = [
    {
        "inputs": [
            {"internalType": "uint256", "name": "auctionId", "type": "uint256"},
        ],
        "name": "finalizeAuction",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "internalType": "uint256",
                "name": "auctionId",
                "type": "uint256",
            },
            {
                "indexed": True,
                "internalType": "address",
                "name": "winner",
                "type": "address",
            },
            {
                "indexed": False,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256",
            },
        ],
        "name": "Finalized",
        "type": "event",
    },
]


def finalize_auction_generate_order(auction):
    finalize = finalize_auction(auction_id=auction.id)
    if finalize and finalize["ok"]:
        generate_order(auction=auction.id)


def finalize_auction(auction_id: int, from_private_key: str | None = None):
    """
    Directly calls finalizeAuction(auctionId) using the given private key
    (or the global PRIVATE_KEY if from_private_key is None).

    After your Solidity change, caller can be seller OR admin.
    """
    # 1) Set up web3, account, contract
    w3 = Web3(Web3.HTTPProvider(RPC_URL, request_kwargs={"timeout": 60}))
    acct = w3.eth.account.from_key(PRIVATE_KEY)
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(AUCTION_CONTRACT_ADDRESS),
        abi=AUCTION_ABI,
    )

    # 2) Prepare function call
    fncall = contract.functions.finalizeAuction(int(auction_id))

    # 3) Gas + fee setup (EIP-1559)
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

    # 4) Sign + send + wait
    signed = acct.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    rcpt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)

    # 5) Decode Finalized events (if any)
    finalized_events = []
    for e in contract.events.Finalized().process_receipt(rcpt):
        args = e["args"]
        finalized_events.append(
            {
                "auctionId": int(args["auctionId"]),
                "winner": args["winner"],
                "amount": int(args["amount"]),
            }
        )

    return {
        "ok": rcpt.status == 1,
        "tx": tx_hash.hex(),
        "events": finalized_events,
    }


def generate_order(auction):
    shipping_cost = 2
    tax_amount = 2
    platform_fee = 3
    bidder = AuctionBid.objects.filter(auction_id=auction).order_by("-amount").first()
    if bidder:
        price = bidder.amount
        order = Order.objects.create(
            buyer=bidder.bidder,
            art=bidder.auction.art,
            auction=bidder.auction,
            artist=bidder.auction.art.artist,
            status="Pending",
            no_of_fractions=1,
            shipping_cost=shipping_cost,
            tax_amount=tax_amount,
            platform_fee=platform_fee,
            discount_total=0,
            total=price + shipping_cost + tax_amount + platform_fee,
            payment_status="Captured",
            paid_at=datetime.now(),
            eta=datetime.now() + timedelta(days=15),
        )
        PaymentTransaction.objects.create(
            order=order,
            amount=order.total,
            status="Captured",
        )
        Payout.objects.create(
            order=order,
            art=bidder.auction.art,
            artist=bidder.auction.art.artist,
            scheduled_for=datetime.now() + timedelta(days=15),
            amount=price,
        )
