import 'dotenv/config';
import { ethers } from 'ethers';

async function main() {
    const privateKey = process.env.RELAYER_PRIVATE_KEY;  // 🔥 수정
    const rpcUrl = process.env.RPC_URL;

    if (!privateKey || !rpcUrl) {
        console.error("⚠️ .env에 RELAYER_PRIVATE_KEY와 RPC_URL 확인 필요");
        process.exit(1);
    }

    const wallet = new ethers.Wallet(privateKey);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = wallet.connect(provider);

    const to = '0x0000000000000000000000000000000000000000';
    const amount = ethers.parseEther('0.001');

    try {
        const tx = await signer.sendTransaction({ to, value: amount });
        console.log("✅ 전송 성공! txHash:", tx.hash);

        await tx.wait();
        console.log("✅ 트랜잭션 처리 완료!");
    } catch (err) {
        console.error("❌ 전송 실패:", err);
    }
}

main();
