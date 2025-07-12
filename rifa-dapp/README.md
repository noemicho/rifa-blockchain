
BackEnd
1. `cd contracts`
2. `npx hardhat node` (Deixe este terminal rodando)
3. Em um **novo terminal**: `npx hardhat run scripts/deploy.js --network localhost`
   - **IMPORTANTE:** Este comando irá imprimir o endereço do contrato no terminal. **Copie este endereço.**
4. Copiar o endereço gerado e atualizar no .env

Frontend
1. `cd rifa-dapp`
2. `npm install` (Apenas na primeira vez ou se adicionar novas dependências)
3. `npm start`


Toda vez que você reiniciar o nó do Hardhat, você precisará repetir os passos para fazer o deploy e atualizar o endereço no front-end.
---

**Dependências (instalar se necessário):**
`npm install web3`
`npm install ethers`
`npm install ajv@latest`