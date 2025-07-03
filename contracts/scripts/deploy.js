const { ethers } = require("hardhat");

async function main() {
  const totalTickets = 10;
  const ticketPrice = ethers.parseEther("0.01");

  const Rifa = await ethers.getContractFactory("Rifa");
  const rifa = await Rifa.deploy(totalTickets, ticketPrice);
  await rifa.waitForDeployment();

  const address = await rifa.getAddress();
  console.log("Contrato Rifa implantado em:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
