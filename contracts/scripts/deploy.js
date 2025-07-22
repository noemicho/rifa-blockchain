const { ethers } = require("hardhat");

async function main() {
  const totalTickets = 20;
  const ticketPrice = ethers.parseEther("0.002");

  const Rifa = await ethers.getContractFactory("Rifa");
  const rifa = await Rifa.deploy();
  await rifa.waitForDeployment();

  const address = await rifa.getAddress();
  console.log("Contrato Rifa implantado em:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
