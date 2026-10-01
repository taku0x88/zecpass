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
The web interface features an interactive Demo Control Console allowing reviewers to test all protocol states and attack defenses in real-time:
- **State A (Fresh Buyer):** Clean state with an empty vault to test primary pass minting.
- **State B (Active Ticket Holder):** Pass holder state to inspect credentials and trigger the 100% face-value Burn-and-Refund engine.
- **State C (Venue Turnstile Gate):** Live bouncer view simulating guest check-in via ephemeral dynamic proofs.
- **State D (Duplicate / Sybil Rejection):** Simulates an attack where a user attempts a second mint with the same identity nullifier, demonstrating immediate protocol rejection.
- **State E (Turnstile Fraud Attempt):** Simulates a static screenshot or replayed expired QR attempt, demonstrating turnstile gate denial.

## Tech Stack
- **Framework:** Next.js, React, Tailwind CSS
- **Design System:** Radix UI / Shadcn
- **Architecture:** Client-side zero-knowledge state machine specification
- **Deployment:** Vercel

## Local Setup
```bash
pnpm install
pnpm dev

## Protocol Architecture & Defense Model
- **Sealed Mempool Minting (Orchard Pool):** Transactions remain fully encrypted within shielded notes, neutralizing frontrunning and bot sniping.
- **1-Ticket-Per-Human Sybil Resistance:** Enforces allocation limits via blind zero-knowledge nullifiers without requiring KYC or identity doxing.
- **Automated Burn-and-Refund Secondary Engine:** Unilateral peer-to-peer transfers are disabled. Pass holders unable to attend burn their pass back to the protocol treasury for an instant, 100% face-value refund. The pass is automatically reallocated to verified fans on the encrypted waitlist, eliminating secondary markups.
- **Offline Turnstile Verification:** Gates verify ephemeral, 60-second client-side zero-knowledge proofs locally against a cached Merkle root, ensuring zero turnstile downtime during stadium cellular outages.

## Standards & ZIP Reference Architecture
ZecPass is architected around current and emerging Zcash network standards:
- **ZIP 227 (ZSA Issuance):** Powers sealed primary minting and fixed supply caps within the Orchard pool.
- **ZIP 226 (ZSA Transfer & Burn):** Cryptographic primitive used by the automated Burn-and-Refund treasury sink.
- **ZIP 224 (Orchard Shielded Protocol):** Implements Halo 2 ZK-SNARK proving mechanics without a trusted setup.
- **ZIP 225 (Orchard Nullifier Sets):** Enforces 1-pass-per-attendee Sybil resistance without identity disclosure.
- **ZIP 316 (Unified Addresses):** Strict shielded routing via Orchard receiver formats (`u1...`).
