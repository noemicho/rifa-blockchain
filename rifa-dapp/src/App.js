import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import RifaABI from "./abis/Rifa.json";
const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

function App() {
  const [wallet, setWallet] = useState(null);
  const [rifa, setRifa] = useState(null);
  const [totalTickets, setTotalTickets] = useState(0);
  const [soldTickets, setSoldTickets] = useState(0);
  const [ticketPrice, setTicketPrice] = useState("0");
  const [raffleEnded, setRaffleEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    if (window.ethereum) {
      const [account] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setWallet(account);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, RifaABI.abi, signer);
      setRifa(contract);
    } else {
      alert("Metamask não encontrado");
    }
  };

  const loadData = async () => {
    if (rifa) {
      const total = await rifa.totalTickets();
      const sold = await rifa.soldTickets();
      const price = await rifa.ticketPrice();
      const ended = await rifa.raffleEnded();
      setTotalTickets(Number(total));
      setSoldTickets(Number(sold));
      setTicketPrice(ethers.formatEther(price));
      setRaffleEnded(ended);

      if (ended) {
        const filtro = rifa.filters.RaffleEnded();
        const eventos = await rifa.queryFilter(filtro);
        const ultimo = eventos[eventos.length - 1];
        if (ultimo) {
          setWinner(ultimo.args[0]);
        }
      }
    }
  };

  const buyTicket = async () => {
    try {
      setLoading(true);
      const tx = await rifa.buyTicket({
        value: ethers.parseEther(ticketPrice),
      });
      await tx.wait();
      alert("Bilhete comprado com sucesso!");
      loadData();
    } catch (err) {
      alert("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rifa) {
      loadData();
    }
  }, [rifa]);

  return (
    <div style={{ padding: 20 }}>
      <h1>🎟️ Rifa da Noemi e Ênnya</h1>

      {!wallet ? (
        <button onClick={connectWallet}>Conectar carteira</button>
      ) : (
        <p>Carteira conectada: {wallet}</p>
      )}

      {rifa && (
        <>
          <p>Bilhetes vendidos: {soldTickets} / {totalTickets}</p>
          <p>Preço do bilhete: {ticketPrice} ETH</p>

          {!raffleEnded ? (
            <button onClick={buyTicket} disabled={loading}>
              {loading ? "Processando..." : "Comprar Bilhete"}
            </button>
          ) : (
            <div>
              <h3>🏆 Rifa encerrada!</h3>
              <p>Vencedor: {winner}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
