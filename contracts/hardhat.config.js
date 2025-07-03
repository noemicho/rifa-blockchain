require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/SUA_INFURA_KEY", // ou Alchemy
      accounts: ["0xSUA_PRIVATE_KEY"], // sem 0x se preferir
    },
  },
};
