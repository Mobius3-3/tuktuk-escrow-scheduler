import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TuktukEscrow } from "../target/types/tuktuk_escrow";
import { PublicKey } from "@solana/web3.js";
import {
  init,
  taskKey,
  taskQueueAuthorityKey,
} from "@helium/tuktuk-sdk";
import { 
  createMint, 
  getAssociatedTokenAddressSync, 
  getOrCreateAssociatedTokenAccount, 
  mintTo, 
  TOKEN_PROGRAM_ID 
} from "@solana/spl-token";

describe("tuktuk-escrow",() => {
  const provider=anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.tuktukEscrow as Program<TuktukEscrow>;
  const connection=provider.connection;
  const providerWallet=provider.wallet as anchor.Wallet;
  const payer=providerWallet.payer;
  let mintA:PublicKey;
  let mintB:PublicKey;
  let makerAtaA:any;
  const seed = new anchor.BN(Math.floor(Math.random() * 1000000));
  const seedBuf=Buffer.alloc(8);
  seedBuf.writeBigUInt64LE(BigInt(seed.toString()));
  let escrowPda:PublicKey;
  let vault:PublicKey;
  let taskId:number;
  /*
    tuktuk -u https://api.devnet.solana.com -w ~/.config/solana/id.json task-queue create   --name "escrow-af"    --capacity 100   --min-crank-reward 1000000   --funding-amount 500000000 --stale-task-age 604
  */
  const taskQueue = new anchor.web3.PublicKey("9UvbhxEdeaVJe4BZv3wxeUaMGfNWneuXc1BzQDRPEmBt");
  const queueAuthority = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("queue_authority")], program.programId)[0];
  const taskQueueAuthority = taskQueueAuthorityKey(taskQueue, queueAuthority)[0];
  
  before(async()=>{

    let tuktukProgram = await init(provider);
    mintA = await createMint(connection,payer,payer.publicKey,null,6);
    mintB =await createMint(connection,payer,payer.publicKey,null,6);
    [escrowPda]=PublicKey.findProgramAddressSync([
                                                  Buffer.from("escrow"),
                                                  payer.publicKey.toBuffer(),
                                                  seedBuf
                                                ],program.programId);
    vault=getAssociatedTokenAddressSync(mintA,
                                        escrowPda,
                                        true);
    taskId = 10; // This should match the task ID used in the `make` instruction
      //  await tuktukProgram.methods
  //       .addQueueAuthorityV0()
  //       .accounts({
  //         payer: payer.publicKey,
  //         taskQueue: taskQueue,
  //         queueAuthority,
  //       })
  //       .rpc();
    
    const makerAtaA = getAssociatedTokenAddressSync(mintA, payer.publicKey);
  
    await getOrCreateAssociatedTokenAccount(
      connection, payer, mintA, payer.publicKey
    );
    
    await mintTo(
      connection, payer, mintA, makerAtaA, 
      payer.publicKey, 1000_000_000_000
    );
  });
  
  it("Make", async () => {
    const receive=new anchor.BN(1_0000_000);
    const deposit=new anchor.BN(1_000);
    
    const makeTx=await program.methods.make(seed,deposit,receive).accounts({
      maker:payer.publicKey,
      mintA,
      mintB
    }).rpc()
    
    console.log("Make tx signature:", makeTx);
  });
  
  it("Schedule", async () => {
  let tuktukProgram = await init(provider);
  
  const [taskPda] = taskKey(taskQueue, taskId);
  
  try {
    const tx = await program.methods.schedule(taskId).accountsPartial({
      maker: payer.publicKey,
      mintA,
      makerAtaA,
      escrow: escrowPda,
      vault,
      task: taskPda,
      taskQueue,
      queueAuthority,
      systemProgram: anchor.web3.SystemProgram.programId,
      taskQueueAuthority:taskQueueAuthority,
      tuktukProgram:tuktukProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    }).rpc();
    
    console.log("Schedule completed", tx);
  } catch (error) {
    console.error("Error scheduling task:", error);
  }
});
});