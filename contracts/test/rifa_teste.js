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
    it("Deve permitir a compra de bilhetes específicos", async function () {
      await expect(
        rifa.connect(participant1).buySpecificTickets([1], { value: ticketPrice })
      ).to.emit(rifa, "TicketPurchased").withArgs(participant1.address, 1);

      expect(await rifa.soldTickets()).to.equal(1);
    });

    it("Deve falhar se o valor estiver incorreto", async function () {
      await expect(
        rifa.connect(participant1).buySpecificTickets([1], { value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("Valor incorreto");
    });

    it("Deve falhar se tentar comprar bilhete já vendido", async function () {
      await rifa.connect(participant1).buySpecificTickets([2], { value: ticketPrice });

      await expect(
        rifa.connect(participant2).buySpecificTickets([2], { value: ticketPrice })
      ).to.be.revertedWith("Bilhete ja vendido");
    });

    it("Deve falhar se tentar comprar bilhete inválido", async function () {
      await expect(
        rifa.connect(participant1).buySpecificTickets([0], { value: ticketPrice })
      ).to.be.revertedWith("Numero de bilhete invalido");
    });

    it("Deve finalizar a rifa e emitir evento quando todos os bilhetes forem vendidos", async function () {
      const tickets = [[1], [2], [3], [4], [5]];
      let tx;
      for (let i = 0; i < tickets.length; i++) {
        tx = await rifa.connect(participant1).buySpecificTickets(tickets[i], { value: ticketPrice });
      }

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment.name === "RaffleEnded");

      expect(event).to.not.be.undefined;

      const [winner, ticketNumber, prizeAmount] = event.args;

      expect(winner).to.equal(await rifa.getOwnerOfTicket(ticketNumber));

      const expectedPrize = ticketPrice * BigInt(totalTickets) * BigInt(80) / BigInt(100);
      expect(prizeAmount).to.equal(expectedPrize);

      expect(await rifa.raffleEnded()).to.be.true;
    });

    it("Deve falhar ao tentar comprar após fim da rifa", async function () {
      for (let i = 1; i <= totalTickets; i++) {
        await rifa.connect(participant1).buySpecificTickets([i], { value: ticketPrice });
      }

      await expect(
        rifa.connect(participant2).buySpecificTickets([1], { value: ticketPrice })
      ).to.be.revertedWith("Rifa ja terminou.");
    });
  });

  describe("Função Random (teste indireto)", function () {
    it("Deve escolher aleatoriamente um vencedor entre os bilhetes vendidos", async function () {
      const buyers = [participant1, participant2, owner, participant1, participant2];

      for (let i = 0; i < buyers.length; i++) {
        await rifa.connect(buyers[i]).buySpecificTickets([i + 1], { value: ticketPrice });
      }

      const receipt = await (await rifa.connect(buyers[4]).buySpecificTickets([5], { value: ticketPrice })).wait();
      const event = receipt.logs.find(log => log.fragment.name === "RaffleEnded");

      const [winner, ticketNumber] = event.args;
      const winnerAddress = await rifa.getOwnerOfTicket(ticketNumber);

      expect(winner).to.equal(winnerAddress);
    });
  });
});
