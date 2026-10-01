# ZecPass // Native Shielded Admittance Protocol

> Fair-price event ticketing, native shielded admittance, and zero bot scalping. Built for Zecathon.

## Overview
ZecPass eliminates bot-driven ticket scalping and invasive biometric gate checks by combining Zcash Shielded Assets (ZSAs) with client-side zero-knowledge proofs.

## The Problem
- **Web2 Gatekeepers:** Rely on invasive biometric surveillance, strict lead-booker policies, and dynamic surge pricing while locking fans into proprietary ecosystems.
- **Transparent Web3:** Public smart contracts leak wallet balances, allow MEV bots to frontrun primary drops, and fail to prevent off-chain scalping when peer-to-peer transfers are enabled.

## Protocol Architecture & Defense Model
- **Sealed Mempool Minting (Orchard Pool):** Transactions remain fully encrypted within shielded notes, neutralizing frontrunning and bot sniping.
- **1-Ticket-Per-Human Sybil Resistance:** Enforces allocation limits via blind zero-knowledge nullifiers without requiring KYC or identity doxing.
- **Automated Burn-and-Refund Secondary Engine:** Unilateral peer-to-peer transfers are disabled. Pass holders unable to attend burn their pass back to the protocol treasury for an instant, 100% face-value refund. The pass is automatically reallocated to verified fans on the encrypted waitlist, eliminating secondary markups.
- **Offline Turnstile Verification:** Gates verify ephemeral, 60-second client-side zero-knowledge proofs locally against a cached Merkle root, ensuring zero turnstile downtime during stadium cellular outages.

## Interactive Reviewer Controls
Use the floating **Demo Control** console in the application to evaluate all core protocol states:
- **State A (Fresh Buyer):** Primary drop minting flow.
- **State B (Ticket Holder):** Vault inspection and Burn-and-Refund execution.
- **State C (Turnstile Gate):** Dynamic 60-second QR generation and offline bouncer scanner verification.
- **State D (Sybil Rejection):** Duplicate purchase defense simulation.

## Tech Stack
- **Framework:** Next.js, React, Tailwind CSS
- **Design System:** Radix UI / Shadcn
- **Architecture:** Client-side zero-knowledge state machine specification
- **Deployment:** Vercel

## Local Setup
```bash
pnpm install
pnpm dev
