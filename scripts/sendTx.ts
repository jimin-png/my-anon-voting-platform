import 'dotenv/config';
import { ethers } from 'ethers';

async function main() {
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL;

    if (!privateKey || !rpcUrl) {
        console.error("⚠️ .env에 PRIVATE_KEY와 RPC_URL 확인 필요");
        process.exit(1);
    }

    // 지갑 생성
    const wallet = new ethers.Wallet(privateKey);

    // provider 연결
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = wallet.connect(provider);

    // 전송할 주소 & 금액
    const to = '0x0000000000000000000000000000000000000000'; // 테스트용 주소
    const amount = ethers.parseEther('0.001'); // 0.001 ETH

    try {
        const tx = await signer.sendTransaction({ to, value: amount });
        console.log("✅ 트랜잭션 전송 성공! txHash:", tx.hash);

        // 전송 완료까지 기다림
        await tx.wait();
        console.log("✅ 트랜잭션 처리 완료!");
    } catch (err) {
        console.error("❌ 전송 실패:", err);
    }
}

main();
