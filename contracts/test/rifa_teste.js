const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Rifa Contract", function () {
  let rifa;
  let owner;
  let participant1;
  let participant2;
  const ticketPrice = ethers.parseEther("0.1"); // 0.1 ETH
  const totalTickets = 5;

  beforeEach(async function () {
    [owner, participant1, participant2] = await ethers.getSigners();
    const RifaFactory = await ethers.getContractFactory("Rifa");
    rifa = await RifaFactory.deploy(totalTickets, ticketPrice);
  });

  describe("Deployment", function () {
    it("Deve definir o proprietário corretamente", async function () {
      expect(await rifa.owner()).to.equal(owner.address);
    });

    it("Deve definir o número total de bilhetes corretamente", async function () {
      expect(await rifa.totalTickets()).to.equal(totalTickets);
    });

    it("Deve definir o preço do bilhete corretamente", async function () {
      expect(await rifa.ticketPrice()).to.equal(ticketPrice);
    });
  });

  describe("Compra de Bilhete", function () {
    it("Deve permitir a compra de bilhete", async function () {
      await rifa.connect(participant1).buyTicket({ value: ticketPrice });
      expect(await rifa.soldTickets()).to.equal(1);
    });

    it("Deve falhar se o valor do bilhete estiver incorreto", async function () {
      await expect(
        rifa.connect(participant1).buyTicket({ value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("Valor incorreto para o bilhete");
    });

    it("Deve falhar se todos os bilhetes foram vendidos", async function () {
      for (let i = 0; i < totalTickets; i++) {
        await rifa.connect(participant1).buyTicket({ value: ticketPrice });
      }

      await expect(
        rifa.connect(participant2).buyTicket({ value: ticketPrice })
      ).to.be.revertedWith("Rifa terminou");
    });

    it("Deve finalizar a rifa e emitir evento quando todos os bilhetes forem vendidos", async function () {
      let tx;

      for (let i = 0; i < totalTickets; i++) {
        tx = await rifa.connect(participant1).buyTicket({ value: ticketPrice });
      }

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment.name === "RaffleEnded");

      expect(event).to.not.be.undefined;

      const [winner, prizeAmount] = event.args;

      expect(winner).to.equal(participant1.address);

      const expectedPrize = ticketPrice * BigInt(totalTickets) * BigInt(80) / BigInt(100);
      expect(prizeAmount).to.equal(expectedPrize);

      expect(await rifa.raffleEnded()).to.be.true;
    });

    it("Deve falhar ao tentar comprar bilhete após o fim da rifa", async function () {
      for (let i = 0; i < totalTickets; i++) {
        await rifa.connect(participant1).buyTicket({ value: ticketPrice });
      }

      await expect(
        rifa.connect(participant2).buyTicket({ value: ticketPrice })
      ).to.be.revertedWith("Rifa terminou");
    });
  });

  describe("Função Random (teste indireto)", function () {
    it("Deve escolher aleatoriamente um vencedor entre os participantes", async function () {
      const allParticipants = [participant1, participant2, owner, participant1, participant2];

      let lastTx;
      for (let i = 0; i < totalTickets; i++) {
        lastTx = await rifa.connect(allParticipants[i]).buyTicket({ value: ticketPrice });
      }

      const receipt = await lastTx.wait();
      const event = receipt.logs.find(log => log.fragment.name === "RaffleEnded");

      expect(event).to.not.be.undefined;

      const [winner] = event.args;

      const participantAddresses = allParticipants.map(p => p.address);
      expect(participantAddresses).to.include(winner);
    });

  });
});
