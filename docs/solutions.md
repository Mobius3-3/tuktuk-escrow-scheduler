let txn = await tuktukSdk.methods
        .addQueueAuthorityV0()
        .accounts({
          payer: payer.publicKey,
          taskQueue: taskQueue,
          queueAuthority,
        })
        .rpc();

tuktuk -u https://api.devnet.solana.com -w ~/.config/solana/id.json task-queue create \
  --name " "  \
  --capacity 100 \
  --min-crank-reward 1000000 \
  --funding-amount 500000000 \
--stale-task-age 60400

tuktuk -u https://api.devnet.solana.com -w ~/.config/solana/id.json task-queue create   --name "escrow-af3"    --capacity 100   --min-crank-reward 1000000   --funding-amount 500000000 --stale-task-age 604
00
{
  "pubkey": "GGM49zNHzQGPM3aftwmTBGNKokYVSR3QSRV1unYmQ6Et",
  "id": 226,
  "capacity": 100,
  "update_authority": "Agmw8g8yLE47c5jZextRBBdQPZdJYJuzTLV6ndJPnmiu",
  "name": "escrow-af",
  "min_crank_reward": 1000000,
  "balance": 1500000000,
  "stale_task_age": 60400
}