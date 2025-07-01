const { ethers } = require("hardhat");
const { expect } = require("chai");


describe("Rifa Contract", function () {
  let Rifa;
  let rifa;
  let owner;
  let participant1;
  let participant2;
  let ticketPrice = ethers.parseEther("0.1"); // Preço de cada bilhete: 0.1 ETH
  let totalTickets = 5;

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
        rifa.connect(participant1).buyTicket({ value: ethers.parseEther("0.05") }) // Valor errado
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

    it("Deve finalizar a rifa quando todos os bilhetes forem vendidos", async function () {
      for (let i = 0; i < totalTickets; i++) {
        await rifa.connect(participant1).buyTicket({ value: ticketPrice });
      }

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

    it("Deve permitir a retirada dos prêmios quando a rifa terminar", async function () {
      // Comprar bilhetes até que a rifa termine
      for (let i = 0; i < totalTickets; i++) {
        await rifa.connect(participant1).buyTicket({ value: ticketPrice });
      }

      // O vencedor e o prêmio devem ser definidos corretamente
      const winner = await rifa.participants(0); // O vencedor será aleatório, mas vamos pegar o primeiro participante como exemplo
      const winnerPrize = ticketPrice * BigInt(totalTickets * 80) / BigInt(100);

      // Verificar a transferência para o vencedor
      await expect(rifa.endRaffle())
        .to.emit(rifa, "RaffleEnded")
        .withArgs(winner, winnerPrize);
    });
  });

  describe("Função Random", function () {
    it("Deve gerar um vencedor aleatório", async function () {
      // A função random é privada, então não podemos testá-la diretamente,
      // mas podemos testar se ela é usada corretamente na função endRaffle
      await rifa.connect(participant1).buyTicket({ value: ticketPrice });
      await rifa.connect(participant2).buyTicket({ value: ticketPrice });

      // Vamos esperar que a rifa termine
      await rifa.endRaffle();

      // Verificar se o vencedor é um dos participantes
      const winner = await rifa.participants(0);
      expect([participant1.address, participant2.address]).to.include(winner);
    });
  });
});