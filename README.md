# tuktuk-escrow

It demonstrates an escrow program that integrates with TukTuk (Helium's on-chain task queue) to schedule an `auto_refund` instruction when an escrow expires.

The program lets a maker create an `Escrow` PDA, deposit tokens into a vault, and later schedule an on-chain TukTuk task that will call `auto_refund` to return funds to the maker and close the escrow when the expiry timestamp is reached.

**Key files**
- `programs/tuktuk-escrow/src/` – program implementation (`make`, `take`, `refund`, `auto_refund`, `schedule`).
- `programs/tuktuk-escrow/src/state.rs` – `Escrow` account definition.
- `tests/tuktuk-escrow.ts` – integration tests that call `make` and `schedule`.
- `target/idl/tuktuk_escrow.json` – generated IDL (program address is recorded here).

**Escrow state (summary)**
- `seed: u64` – seed used to derive the escrow PDA.
- `maker: Pubkey` – maker wallet that created the escrow.
- `mint_a`, `mint_b` – token mints involved.
- `receive: u64` – expected receive amount.
- `created_at`, `expires_at` – timestamps.
- `bump: u8` – PDA bump.

## Common instructions
- `make(seed, deposit, receive)` – initializes `Escrow` PDA with `seed`, mints, and deposits tokens into a vault (an associated token account owned by the escrow PDA).
- `schedule(task_id)` – compiles an `auto_refund` instruction and submits it to TukTuk via CPI (`queue_task_v0`) with the provided `task_id` and trigger timestamp `escrow.expires_at`.
- `auto_refund()` – callable (by the scheduled TukTuk task) to transfer vault tokens back to the maker and close the `Escrow` account.

## Usage
Build the program:

```bash
anchor build
```

Run tests (local or against a cluster as configured in `Anchor.toml`):

```bash
anchor test --skip-deploy
```

The tests demonstrate creating mints, funding the maker's ATA, calling `make(...)` and then `schedule(taskId)` to queue an `auto_refund` task.

## Notes and gotchas
- Task PDA consistency: TukTuk derives task PDAs from `("task", task_queue, task_id)`. Use the same numeric `task_id` when creating/deriving the task PDA in tests or other code so both sides point to the same account.
- If you want to avoid hard-coding `task_id`, persist it in `Escrow` during `make` and read it back when calling `schedule`.
- `Anchor.toml` must map the program name used in code/IDL to the on-chain ID. This repo's IDL lists the address `C3PV8WPsjiRENFpQmh48ZeGrL3cCzJ23LRD82jCUVV2r` for `tuktuk_escrow`.
- Anchor safety: unchecked accounts passed through CPIs require `/// CHECK:` doc comments explaining why no typed validation is needed (see `schedule.rs` and `auto_refund.rs`).

## Example test flow (what the tests do)
1. Create token mints and mint tokens to the test payer.
2. Call `make(seed, deposit, receive)` to create `Escrow` PDA and vault and deposit tokens.
3. Call `schedule(taskId)` to compile the `auto_refund` instruction and queue it on TukTuk for `escrow.expires_at`.

## Troubleshooting
- DeclaredProgramIdMismatch: ensure `Anchor.toml` program entry matches the ID in `target/idl/tuktuk_escrow.json`.
- Anchor safety errors: add `/// CHECK:` comments above `AccountInfo` fields that Anchor flags as unsafe and document why they're safe.