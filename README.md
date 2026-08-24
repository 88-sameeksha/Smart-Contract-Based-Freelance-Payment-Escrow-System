# Smart Contract-Based Freelance Payment Escrow System

![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)
![Hardhat](https://img.shields.io/badge/Hardhat-2.x-yellow)
![React](https://img.shields.io/badge/React-18-blue)
![Ethers.js](https://img.shields.io/badge/Ethers.js-6-purple)
![License](https://img.shields.io/badge/License-MIT-green)

## Overview

A blockchain-based freelance payment escrow system built with Solidity, Hardhat, Ethers.js and React.

The client deposits funds into a smart contract. The freelancer completes and submits work. The client can approve payment, while the system also supports cancellation, refunds and arbitrator-based dispute resolution.

The project is designed for educational/local/test environments and does not require real cryptocurrency.

## Problem Statement

Freelance work involves a trust problem:

- The client does not want to pay before receiving work.
- The freelancer does not want to work without payment assurance.

The smart contract acts as programmable escrow and enforces settlement rules.

## Objectives

- Implement a Solidity escrow contract.
- Lock client funds inside the contract.
- Define client/freelancer permissions.
- Track project lifecycle using contract states.
- Release payment after approval.
- Support cancellation and refunds.
- Support dispute resolution.
- Emit events for important transactions.
- Provide automated Hardhat tests.
- Provide Remix VM/local blockchain simulation.
- Provide an optional React + MetaMask frontend.

## Industry Relevance

The architecture can be adapted for:

- Freelance platforms
- Gig economy
- Outsourcing
- Remote work
- Digital marketplaces
- B2B services
- Cross-border digital services

## Technology Stack

### Smart Contract

- Solidity 0.8.20
- Ethereum-compatible execution environment

### Development

- Hardhat
- Ethers.js
- JavaScript
- Chai

### Frontend

- React
- Vite
- Ethers.js
- MetaMask

### Simulation

- Remix VM
- Hardhat local blockchain

## Architecture

```text
Client / Freelancer
        |
        v
   React DApp
        |
        v
    Ethers.js
        |
        v
 MetaMask Wallet
        |
        v
FreelanceEscrow.sol
        |
        v
Local/Test Blockchain
```

## Actors

### Client

- Creates escrow
- Funds escrow
- Approves payment
- Requests refund before work starts
- Can raise dispute

### Freelancer

- Starts work
- Submits work
- Can raise dispute

### Arbitrator

- Resolves disputed escrow
- Can release funds to freelancer
- Can refund client

## Escrow Workflow

```text
Client creates escrow
        ↓
Client funds escrow
        ↓
Smart contract locks funds
        ↓
Freelancer starts work
        ↓
Freelancer submits work
        ↓
Client approves
        ↓
Payment released
```

Alternative:

```text
FUNDED → CANCELLED/REFUNDED
IN_PROGRESS/SUBMITTED → DISPUTED
DISPUTED → COMPLETED / REFUNDED
```

## Contract States

| State | Meaning |
|---|---|
| CREATED | Escrow exists but is not funded |
| FUNDED | Client funds are locked |
| IN_PROGRESS | Freelancer started work |
| SUBMITTED | Freelancer submitted work |
| COMPLETED | Payment released |
| CANCELLED | Cancellation path reached |
| DISPUTED | Project is under dispute |
| REFUNDED | Funds returned to client |

## Main Functions

- `createEscrow()`
- `fundEscrow()`
- `startWork()`
- `submitWork()`
- `approveAndReleasePayment()`
- `cancelAndRefund()`
- `raiseDispute()`
- `resolveDispute()`
- `getEscrowDetails()`
- `getContractBalance()`

## Events

- EscrowCreated
- FundsDeposited
- WorkStarted
- WorkSubmitted
- PaymentReleased
- RefundIssued
- DisputeRaised
- DisputeResolved

## Security Features

- Client/freelancer/arbitrator access control
- Reentrancy guard
- Checks-effects-interactions pattern
- Double-payment prevention
- State validation
- Address validation
- Solidity 0.8 arithmetic checks
- Direct ETH transfer rejection

> This is an educational implementation. Do not deploy it with valuable funds without professional security auditing and additional production controls.

## Folder Structure

```text
Smart-Contract-Freelance-Escrow/
├── contracts/
│   └── FreelanceEscrow.sol
├── scripts/
│   └── deploy.js
├── test/
│   └── FreelanceEscrow.test.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── contract.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   └── package.json
├── docs/
├── reports/
├── screenshots/
├── contracts/
├── .env.example
├── .gitignore
├── hardhat.config.js
├── package.json
└── README.md
```

## Installation

### Requirements

- Node.js
- npm
- Git
- MetaMask (only for frontend/local wallet interaction)
- Remix is optional

### Backend

```bash
npm install
npm run compile
npm test
```

## Run Local Blockchain

Terminal 1:

```bash
npm run node
```

Terminal 2:

```bash
npm run deploy:local
```

Copy the deployed contract address.

## Remix Simulation

1. Open Remix IDE.
2. Create `FreelanceEscrow.sol`.
3. Paste the contract.
4. Compile using Solidity 0.8.20.
5. Open Deploy & Run Transactions.
6. Select Remix VM.
7. Use Account 1 as client.
8. Use Account 2 as freelancer.
9. Use Account 3 as arbitrator.
10. Deploy with Account 3 as constructor argument.
11. Create an escrow.
12. Fund it with the exact amount.
13. Switch to freelancer.
14. Start work.
15. Submit work.
16. Switch to client.
17. Approve and release.
18. Verify contract balance.

See `docs/simulation.md` for the complete scenario.

## Hardhat Testing

```bash
npm test
```

The suite tests:

- escrow creation
- invalid addresses
- invalid amounts
- correct funding
- incorrect funding
- freelancer authorization
- work submission
- payment release
- double-payment prevention
- refunds
- unauthorized refund
- disputes
- arbitrator resolution
- final contract balance

## Frontend

```bash
cd frontend
npm install
```

Create:

```text
frontend/.env.local
```

with:

```env
VITE_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
```

Then:

```bash
npm run dev
```

Open the Vite URL shown in the terminal.

## Connecting Frontend to Hardhat

1. Run `npm run node`.
2. Deploy using `npm run deploy:local`.
3. Add the local Hardhat network to MetaMask.
4. Import a Hardhat test account into MetaMask if needed.
5. Set `VITE_CONTRACT_ADDRESS`.
6. Start the frontend.
7. Connect MetaMask.

Never use valuable funds or real private keys in a local test setup.

## GitHub

```bash
git init
git add .
git commit -m "Initial project setup"
git branch -M main
git remote add origin <repository-url>
git push -u origin main
```

Suggested repository name:

`Smart-Contract-Freelance-Escrow`

Suggested topics:

`blockchain solidity smart-contract ethereum escrow web3 hardhat ethersjs dapp freelancing`

## Suggested Development Commits

```text
Add escrow smart contract structure
Implement client funding logic
Add freelancer work submission
Implement secure payment release
Add cancellation and refund flow
Add dispute management
Add Hardhat tests
Add Remix simulation screenshots
Add React escrow dashboard
Complete README and documentation
```

## Screenshots

Store proof in `screenshots/`.

Recommended evidence:

1. Project folder structure
2. Solidity contract
3. Successful compilation
4. Contract deployment
5. Contract address
6. Escrow creation
7. Deposit transaction
8. Contract balance
9. Freelancer starts work
10. Work submitted
11. Payment approval
12. Freelancer payment
13. Refund
14. Dispute
15. Dispute resolution
16. Event logs
17. Hardhat test output
18. Frontend dashboard
19. GitHub repository
20. README preview

Suggested filenames:

```text
01-folder-structure.png
02-contract-code.png
03-compilation-success.png
04-deployment.png
05-contract-address.png
06-escrow-created.png
07-funds-deposited.png
08-contract-balance.png
09-work-started.png
10-work-submitted.png
11-payment-released.png
12-payment-proof.png
13-refund.png
14-dispute.png
15-dispute-resolved.png
16-event-logs.png
17-hardhat-tests.png
18-frontend-dashboard.png
19-github-repository.png
20-readme-preview.png
```

## Proof-of-Work Timeline

### Day 1
Architecture + project setup

### Day 2
Escrow creation

### Day 3
Funding

### Day 4
Freelancer workflow

### Day 5
Payment release

### Day 6
Refund + dispute

### Day 7
Hardhat tests

### Day 8
Remix/local simulation

### Day 9
Frontend

### Day 10
README + report

## Limitations

- The contract does not determine work quality automatically.
- No real-world identity verification is implemented.
- No fiat payment support.
- Arbitration is represented by a trusted arbitrator address.
- This is not audited production financial software.
- Public testnet deployment is optional.

## Future Improvements

- Multi-milestone escrow
- Stablecoin support
- IPFS project documents
- Decentralized identity
- Freelancer reputation
- DAO-based arbitration
- Multisignature approval
- Deadlines and automatic timeout handling
- Production security audit
- Advanced analytics

## Learning Outcomes

By completing this project, the developer demonstrates understanding of:

- Solidity
- Smart contracts
- Ethereum-compatible blockchain development
- Wallet interaction
- `msg.sender`
- `msg.value`
- `payable`
- structs
- mappings
- enums
- modifiers
- events
- contract state
- gas and transactions
- Web3 frontend integration
- Hardhat testing
- Git/GitHub workflow
- Smart-contract security basics

## Interview Summary

**One-line explanation:**

> A Solidity-based freelance escrow DApp that locks client funds and releases, refunds, or resolves them according to verified project states.

## Author

**Sameeksha Sharma**

B.Tech Computer Science & Engineering Student

---

## License

MIT
#   S m a r t - C o n t r a c t - B a s e d - F r e e l a n c e - P a y m e n t - E s c r o w - S y s t e m  
 