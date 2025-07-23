# Rifa de Noemi e Ênnya

Um projeto Web3 com Solidity, Hardhat e React.
Os usuários podem conectar a carteira MetaMask, comprar bilhetes e concorrer a uma rifa.

## Tecnologias 

- Solidity
- Hardhat
- ethers.js
- React 
- MetaMask

## Como rodar o projeto localmente

### Clone o repositório

```bash
git clone https://github.com/noemicho/rifa-blockchain.git
cd rifa-blockchain
```

### Instale as dependências

```bash
npm install
npm install --save-dev hardhat
```

### Inicie a blockchain local com Hardhat

```bash
cd contracts
npx hardhat node
```

### Faça o deploy do contrato

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Crie um arquivo .env dentro da pasta do frontend
#### Insira o endereço gerado após o deploy

```bash
REACT_APP_CONTRACT_ADDRESS=0x...seu-endereco-do-contrato
```

### Conecte o MetaMask à rede local

#### I) Abra o MetaMask

#### II) Adicionar rede manualmente

```bash
Nome da rede: localhost
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
```

### Importe uma conta gerada pelo "npx hardhat node"

### Rode o frontend

```bash
npm start
```


