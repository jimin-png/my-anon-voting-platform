import { ethers } from 'ethers';
const RPC = process.env.RPC_URL!;
const provider = new ethers.JsonRpcProvider(RPC);

export async function getConfirmations(txHash: string): Promise<number | null> {
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) return null;
    if (!receipt.blockNumber) return 0;
    const currentBlock = await provider.getBlockNumber();
    return Math.max(0, currentBlock - Number(receipt.blockNumber) + 1);
  } catch (err) {
    console.error('getConfirmations err', err);
    throw err;
  }
}
