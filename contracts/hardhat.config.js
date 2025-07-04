require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/SUA_INFURA_KEY", // ou Alchemy
      accounts: [], // sem 0x se preferir
    },
  },
};
