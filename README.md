# TCH8 Market

A wallet-gated marketplace on the **Sepolia** test network. People buy the TCH8 token with ETH, list items for
sale in TCH8, pay through an escrow, confirm delivery, redeem their earnings to their wallet, and exchange TCH8
for any currency. Live sales and TCH8 purchases scroll across the top of the site.

- Frontend: React + Vite + ethers v6 (deployed on Vercel)
- Smart contracts: Solidity 0.8.24 + OpenZeppelin 5.0.2 (deployed with Remix)
- Network: Sepolia (chain id 11155111)

---

## 1. What the app does

| Requirement | How it works |
|---|---|
| Connect wallet before entering | The whole site is hidden behind a connect screen. Wrong network shows a "Switch to Sepolia" screen. |
| Buy TCH8 with ETH | Wallet tab. **1 ETH = 10,000 TCH8** (1 TCH8 = 0.0001 ETH). Admin can change the price. |
| Send TCH8 to another address | Wallet tab. |
| Anyone can list an item | Sell tab: title, description, price in TCH8, **quantity**, optional photo. |
| Everyone sees every listing | Market tab. All data is on-chain, so all visitors see the same live list. |
| Quantity | Each purchase takes 1 unit. Quantity 1 disappears when bought. Quantity 2 shows "1 left" after one sale. |
| Seller cannot buy own item | Blocked by the contract and the Buy button is disabled. |
| Buying | Buyer signs twice (approve, then order). TCH8 moves **buyer to escrow**. |
| Delivery | Seller opens **Orders** and clicks *Mark delivered*. |
| Confirmation | Buyer opens **My Orders** and clicks *Confirm delivery*. |
| Getting paid | Seller opens **My Sales** and clicks *Redeem token*. TCH8 moves **escrow to the seller's wallet**. |
| Exchange to currency | Exchange tab. Seller picks a currency (USD, NGN, EUR, GBP, USDT, BTC, ETH, Other) and payout details. |
| Public sales record | Sales tab shows item, seller, buyer, amount and time for every completed sale. |
| Moving ticker | Top bar scrolls, for everyone: every TCH8 purchase, every successful sale and every new listing, each with a coloured tag. |
| Supply stats | Top of the site shows your TCH8 balance, total supply (all TCH8 minted minus burned), in circulation (total supply minus TCH8 locked in escrow), locked in escrow, and the max supply cap. |
| Admin only tab | Admin tab only appears for the admin or operator wallet. |
| Complaints and enquiries | Complaints tab: any member sends a complaint or enquiry and reads the admin's reply. The admin sees every message in the Admin tab and replies there. |
| Disputes | Disputes tab: buyer or seller lodges a dispute on a paid or delivered order with a written reason. The governance wallet resolves it in the same tab (pay seller or refund buyer) with a written reply that both sides can read. |
| Block design | Card/block layout, dark navy and gold, works on phones. |

### Order life cycle
```
Paid --(seller: Mark delivered)--> Delivered --(buyer: Confirm delivery)--> Confirmed
  |                                    |                                       |
  | buyer: Cancel and refund           | seller: confirm after 7 days          | seller: Redeem token
  v                                    v                                       v
Refunded                           Confirmed                               Released (TCH8 in seller wallet)

Paid or Delivered --(buyer or seller: Dispute)--> Disputed --(admin)--> Released (pay seller) or Refunded (buyer)
```
A cancelled order (refund before delivery) puts the unit back on sale. A disputed refund does not.

### Exchange life cycle
`Seller requests exchange` (TCH8 locked in escrow) -> `Operator pays the seller off-chain` -> `Operator clicks "I paid this"`
(TCH8 is burned) -> status *Paid out*. If the operator rejects, the TCH8 returns to the seller.
The website does not move real money. The operator pays the currency outside the app.

---

## 2. Architecture

There is no separate server or database. **The smart contracts are the backend**: listings, stock, orders,
sales and exchange requests are stored on-chain, so every visitor sees the same data. The frontend reads through a
public Sepolia RPC and refreshes every 15 seconds and after each action. Writes go through the user's wallet.

```
Browser (React) --reads--> Sepolia RPC --> TCH8 / Sale / Escrow contracts
       |                                         ^
       +----------writes via wallet signature----+
```

### Contracts (`contracts/src`)
- **TCH8.sol**: ERC-20 token, 6 decimals, max supply, pausable. Only "minters" can mint or burn.
  Roles: governance (admin) with a safe two-step handover (`setGovernance` then `acceptGovernance`).
- **Sale.sol**: users send ETH and receive newly minted TCH8 at `priceWeiPerToken`. Records every purchase for the ticker.
  Admin can change the price and withdraw the ETH collected.
- **Escrow.sol**: the marketplace and escrow.
  - Listings: `listItem(title, description, image, price, quantity)`, `setItemActive`, `addStock`
  - Orders: `createOrder`, `markDelivered`, `confirmDelivery`, `claimAfterWindow`, `redeem`, `refundBeforeDelivery`
  - Disputes: `raiseDispute(orderId, reason)`, `resolveDispute(orderId, releaseToSeller, reply)` (admin)
  - Complaints and enquiries: `submitTicket(kind, subject, message)`, `replyTicket(ticketId, reply)` (admin)
  - Exchange: `requestRedemption`, `confirmRedemption`, `rejectRedemption` (operator)
  - Admin: `setAutoReleaseWindow`, `setOperator`, `setGovernance`/`acceptGovernance`

### Roles
| Role | Who | Can do |
|---|---|---|
| Admin (governance) | wallet set as `_GOVERNANCE` | change price, withdraw ETH, resolve disputes, add minters, pause token |
| Operator | wallet set as `_OPERATOR` in Escrow | approve or reject exchange requests |
| Everyone else | any wallet | buy TCH8, list, buy items, redeem |

The contracts enforce roles. The Admin tab is just hidden from other wallets.

### Photos
Optional. The seller picks a photo or pastes an image link. Picked photos are shrunk in the browser to about 9 KB
(about 320 px) and stored on-chain, so no file server is needed. Listing with a photo uses more gas. Use an image link
for big, sharp pictures.

### Important design rules
- The buyer is always the wallet that signs `createOrder`, so nobody can pull tokens from another wallet.
- `Sale` and `Escrow` must both be TCH8 **minters**, or buying TCH8 and exchange confirmations will fail.
- Each purchase is one unit. Price per unit is fixed at listing time.

---

## 3. Project structure
```
tch8-market/
  README.md
  contracts/
    src/        TCH8.sol  Sale.sol  Escrow.sol          <- deploy these in Remix
    test/       *.t.sol  (optional Foundry tests, not needed for Remix)
    script/     *.s.sol  (optional Foundry scripts, not needed for Remix)
  frontend/
    index.html  package.json  vite.config.js  .env.example
    src/
      main.jsx        app entry
      App.jsx         connect gate, header, ticker, tabs
      wallet.jsx      wallet connection, contracts, error messages
      data.js         loads items, orders, exchange requests, purchases
      views.jsx       Market, Sell, Wallet, Orders, My Orders, My Sales, Exchange, Sales, Admin
      abi.js          contract interfaces
      config.js       addresses, chain, RPC
      deployed.json   <- put your 3 contract addresses here
      styles.css      design
```

---

## 4. Setup

### Prerequisites
Node.js 18+, a browser wallet (MetaMask), Sepolia test ETH from a faucet, a GitHub account and a Vercel account.

### Step 1: Deploy the contracts in Remix
1. Open https://remix.ethereum.org. Create `TCH8.sol`, `Sale.sol`, `Escrow.sol` and paste in the files from `contracts/src`.
2. Solidity compiler tab: version **0.8.24**. Open "Advanced Configurations" and tick **Enable optimization** (200 runs) so Escrow stays under the contract size limit. Compile all three. If Remix picks a newer OpenZeppelin and errors, pin it in the imports,
   for example `@openzeppelin/contracts@5.0.2/token/ERC20/ERC20.sol`.
3. Deploy & Run tab: Environment = **Injected Provider - MetaMask** on Sepolia. The selected account becomes your Admin.
4. Deploy in this order (replace YOUR_WALLET with the account address shown in Remix):

| Contract | Parameters |
|---|---|
| TCH8 | `"TCH8 Token"`, `"TCH8"`, `YOUR_WALLET`, `1000000000000000` |
| Sale | `TCH8_ADDRESS`, `YOUR_WALLET`, `100000000000000` |
| Escrow | `TCH8_ADDRESS`, `YOUR_WALLET`, `YOUR_WALLET` |

5. On the deployed **TCH8** contract call `addMinter` twice: once with the Sale address, once with the Escrow address.
   Do this from the same wallet you used as governance.

### Step 2: Configure the frontend
Edit `frontend/src/deployed.json`:
```json
{ "token": "0x...", "sale": "0x...", "escrow": "0x..." }
```
Or set `VITE_TCH8_ADDRESS`, `VITE_SALE_ADDRESS`, `VITE_ESCROW_ADDRESS` in Vercel instead.

### Step 3: Run locally
```bash
cd frontend
npm install
npm run dev
```

### Step 4: Deploy on Vercel
1. Push the project to GitHub.
2. Vercel -> Add New Project -> import the repo. Set **Root Directory = `frontend`** (framework: Vite).
3. Commit `deployed.json` with your addresses, or add the three `VITE_..._ADDRESS` variables.
4. Deploy.

### Optional environment variables (`frontend/.env.example`)
| Variable | Purpose |
|---|---|
| `VITE_TCH8_ADDRESS`, `VITE_SALE_ADDRESS`, `VITE_ESCROW_ADDRESS` | contract addresses (override `deployed.json`) |
| `VITE_RPC_URL` | your own Sepolia RPC (Alchemy or Infura) for faster, more reliable reads |

On a computer, the **Connect wallet** button uses the MetaMask extension in Chrome, Edge or Brave. On a phone, Chrome has no wallet, so use the **Open in the MetaMask app** button on the connect screen: it opens the site inside the MetaMask app browser, where Connect wallet works.

---

## 5. Test the full flow (two wallets: A = seller, B = buyer)
1. B: **Wallet** tab, buy TCH8 with ETH.
2. A: **Sell** tab, list an item with price and quantity 2.
3. B: **Market**, click Buy (approve, then confirm the order). Stock drops to "1 left" for everyone. A cannot buy it.
4. A: **Orders**, click Mark delivered.
5. B: **My Orders**, click Confirm delivery.
6. A: **My Sales**, click Redeem token. TCH8 lands in A's wallet. The sale appears in **Sales** and in the ticker.
7. A: **Exchange**, request a currency payout.
8. Admin wallet: **Admin** tab, click "I paid this" after paying A outside the app (burns the TCH8), or Reject.

---

## 6. Admin tasks
- **Change price**: Admin tab, enter "ETH per 1 TCH8" (0.0001 = 1 ETH for 10,000 TCH8).
- **Withdraw ETH** collected from TCH8 sales: Admin tab.
- **Exchange requests** and **disputes** appear in the Admin tab for the operator and admin wallets.
- Anything else (pause the token, change operator, hand over admin) is done by calling the contract functions in Remix.

---

## 7. Troubleshooting
| Symptom | Cause and fix |
|---|---|
| "Contracts not set" screen | `deployed.json` still has zero addresses. Paste your addresses and redeploy the frontend. |
| Buy TCH8 reverts or "not set up as a minter" | Call `addMinter` on TCH8 for the Sale and Escrow addresses. |
| Exchange confirmation fails | Same: Escrow is not a TCH8 minter. |
| "Not enough TCH8" when buying | Buy TCH8 first in the Wallet tab. |
| Connect button says no wallet found | The browser has no wallet. On a computer install the MetaMask extension. On a phone use "Open in the MetaMask app". |
| Page shows "Could not read the contracts" | Wrong addresses, wrong network, or the RPC is busy. Set `VITE_RPC_URL` to your own Alchemy or Infura Sepolia URL. |
| Old listings gone after redeploying | A new deployment is a fresh contract. Data does not carry over. |
| Photo rejected as too detailed | Pick a simpler image or paste an image link. |

---

## 8. Optional: Foundry tests
`contracts/test` has Solidity tests (`forge test`) and `contracts/script` has deploy scripts. You do not need them if you deploy with Remix.

## 9. Complaints, enquiries and disputes
- **Complaints tab (everyone):** choose Complaint or Enquiry, write a subject and message, send. Your messages and the admin's replies are listed on the same page.
- **Admin tab (admin wallet):** all messages, unanswered first, with a reply box. A red badge shows how many are waiting.
- **Disputes tab (buyer or seller):** pick a paid or delivered order, explain what went wrong, lodge it. The TCH8 stays frozen in escrow.
  Both parties see the dispute and, later, the admin's decision and reply.
- **Disputes tab (governance wallet):** sees every dispute, writes a reply, then clicks *Pay seller* or *Refund buyer*. A reply is required.
- Messages and replies are stored on-chain, so they are public. Do not put private details (phone numbers, bank accounts) in them.
- Updating an existing deployment: this changes `Escrow.sol`, so redeploy **Escrow only**, call `addMinter(newEscrow)` on TCH8, put the new address in `deployed.json`, and redeploy the frontend. TCH8 and Sale can stay. Orders and listings on the old Escrow do not carry over.

## 10. Security notes
This is built for a test network. Before using real money: get the contracts audited, use a multisig for admin and operator,
and note that exchange payouts depend on the operator paying off-chain honestly. Never share your wallet private key.
