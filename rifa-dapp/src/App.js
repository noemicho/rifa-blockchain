import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import RifaABI from "./abis/Rifa.json";
import "./App.css";

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

function App() {
  const [wallet, setWallet] = useState(null);
  const [rifa, setRifa] = useState(null);
  const [totalTickets, setTotalTickets] = useState(0);
  const [soldTicketList, setSoldTicketList] = useState([]);
  const [ticketPrice, setTicketPrice] = useState("0");
  const [raffleEnded, setRaffleEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState([]);
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
      const soldTickets = await rifa.getSoldTickets();
      const price = await rifa.ticketPrice();
      const ended = await rifa.raffleEnded();

      setTotalTickets(Number(total));
      setSoldTicketList(soldTickets.map((t) => Number(t)));
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

  const isTicketSold = (ticket) => soldTicketList.includes(ticket);

  const toggleTicket = (ticket) => {
    if (isTicketSold(ticket)) return;
    if (selectedTickets.includes(ticket)) {
      setSelectedTickets(selectedTickets.filter((t) => t !== ticket));
    } else {
      setSelectedTickets([...selectedTickets, ticket]);
    }
  };

  const buyTicket = async () => {
    try {
      setLoading(true);
      const totalValue = ethers.parseEther((ticketPrice * selectedTickets.length).toString());

      const tx = await rifa.buyTickets(selectedTickets, {
        value: totalValue,
      });

      await tx.wait();
      alert(`${selectedTickets.length} bilhete(s) comprado(s) com sucesso!`);
      setSelectedTickets([]);
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

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
          const provider = new ethers.BrowserProvider(window.ethereum);
          provider.getSigner().then((signer) => {
            const contract = new ethers.Contract(contractAddress, RifaABI.abi, signer);
            setRifa(contract);
          });
        } else {
          setWallet(null);
          setRifa(null);
        }
      };
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, []);

  const allTickets = Array.from({ length: totalTickets }, (_, i) => i + 1);

  return (
    <div className="container">
      <h1>🎟️ Rifa da Noemi e Ênnya</h1>

      {!wallet ? (
        <button onClick={connectWallet}>Conectar carteira</button>
      ) : (
        <p>Carteira conectada: {wallet}</p>
      )}

      {rifa && (
        <>
          <p>Bilhetes vendidos: {soldTicketList.length} / {totalTickets}</p>
          <p>Preço do bilhete: {ticketPrice} ETH</p>

          {!raffleEnded ? (
            <>
              <div className="ticket-grid">
                {allTickets.map((ticket) => (
                  <button
                    key={ticket}
                    className={`ticket ${
                      isTicketSold(ticket) ? "sold" : selectedTickets.includes(ticket) ? "selected" : ""
                    }`}
                    disabled={isTicketSold(ticket)}
                    onClick={() => toggleTicket(ticket)}
                  >
                    {ticket}
                  </button>
                ))}
              </div>
              <button onClick={buyTicket} disabled={loading || selectedTickets.length === 0}>
                {loading ? "Processando..." : `Comprar ${selectedTickets.length} bilhete(s)`}
              </button>
            </>
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
