import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("----------------------------------------------------");
  console.log("Deploying Artfolio smart contract to network...");

  const [deployer] = await ethers.getSigners();
  if (deployer) {
    console.log(`Deployer address: ${deployer.address}`);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Deployer balance: ${ethers.formatEther(balance)} native tokens`);
  }

  const Artfolio = await ethers.getContractFactory("Artfolio");
  const artfolio = await Artfolio.deploy();

  await artfolio.waitForDeployment();
  const address = await artfolio.getAddress();

  console.log("----------------------------------------------------");
  console.log(`Artfolio contract successfully deployed to: ${address}`);
  console.log("----------------------------------------------------");
  console.log("Next steps:");
  console.log(`1. Copy this address into your .env.local file:`);
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log(`2. Verify on Botchain Explorer: https://scan.bohr.life/address/${address}`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
