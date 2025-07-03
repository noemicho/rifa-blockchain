const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Contrato Lock", function () {
  async function deployOneYearLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const lockedAmount = ONE_GWEI;
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    const [owner, otherAccount] = await ethers.getSigners();

    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

    return { lock, unlockTime, lockedAmount, owner, otherAccount };
  }

  describe("Implantação", function () {
    it("deve definir corretamente o unlockTime", async function () {
      const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });

    it("deve definir corretamente o proprietário", async function () {
      const { lock, owner } = await loadFixture(deployOneYearLockFixture);
      expect(await lock.owner()).to.equal(owner.address);
    });

    it("deve receber e armazenar os fundos bloqueados", async function () {
      const { lock, lockedAmount } = await loadFixture(deployOneYearLockFixture);
      expect(await ethers.provider.getBalance(lock.target)).to.equal(lockedAmount);
    });

    it("deve falhar se o unlockTime não estiver no futuro", async function () {
      const latestTime = await time.latest();
      const Lock = await ethers.getContractFactory("Lock");
      await expect(
        Lock.deploy(latestTime, { value: 1 })
      ).to.be.revertedWith("Unlock time should be in the future");
    });
  });

  describe("Saques", function () {
    describe("Validações", function () {
      it("deve falhar com o erro correto se for chamado antes do tempo", async function () {
        const { lock } = await loadFixture(deployOneYearLockFixture);
        await expect(lock.withdraw()).to.be.revertedWith("You can't withdraw yet");
      });

      it("deve falhar com o erro correto se for chamado por outra conta", async function () {
        const { lock, unlockTime, otherAccount } = await loadFixture(deployOneYearLockFixture);
        await time.increaseTo(unlockTime);
        await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith("You aren't the owner");
      });

      it("não deve falhar se o tempo tiver chegado e o proprietário chamar", async function () {
        const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);
        await time.increaseTo(unlockTime);
        await expect(lock.withdraw()).not.to.be.reverted;
      });
    });

    describe("Eventos", function () {
      it("deve emitir um evento ao sacar", async function () {
        const { lock, unlockTime, lockedAmount } = await loadFixture(deployOneYearLockFixture);
        await time.increaseTo(unlockTime);
        await expect(lock.withdraw())
          .to.emit(lock, "Withdrawal")
          .withArgs(lockedAmount, anyValue);
      });
    });

    describe("Transferências", function () {
      it("deve transferir os fundos para o proprietário", async function () {
        const { lock, unlockTime, lockedAmount, owner } = await loadFixture(deployOneYearLockFixture);
        await time.increaseTo(unlockTime);
        await expect(lock.withdraw()).to.changeEtherBalances(
          [owner, lock],
          [lockedAmount, -lockedAmount]
        );
      });
    });
  });
});
