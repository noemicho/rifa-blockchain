import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import RifaABI from "./abis/Rifa.json";
import './App.css';
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
  const [qtd, setQtd] = useState(1);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [soldTicketNumbers, setSoldTicketNumbers] = useState([]);
  const [winningTicketNumber, setWinningTicketNumber] = useState(null);


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
  
      const vendidos = await rifa.getSoldTickets();
      const vendidosNumeros = vendidos.map((v) => Number(v));
  
      setTotalTickets(Number(total));
      setSoldTickets(Number(sold));
      setTicketPrice(ethers.formatEther(price));
      setRaffleEnded(ended);
      setSoldTicketNumbers(vendidosNumeros);
  
      if (ended) {
        const filtro = rifa.filters.RaffleEnded();
        const eventos = await rifa.queryFilter(filtro);
        const ultimo = eventos[eventos.length - 1];
        if (ultimo) {
          setWinner(ultimo.args[0]);
          setWinningTicketNumber(Number(ultimo.args[1])); 
        }
      }
    }
  };
  

  const toggleTicket = (num) => {
    if (selectedTickets.includes(num)) {
      setSelectedTickets(selectedTickets.filter((n) => n !== num));
    } else {
      setSelectedTickets([...selectedTickets, num]);
    }
  };
  

  const buyTicket = async () => {
    if (!rifa) return;
  
    if (selectedTickets.length === 0) {
      alert("Selecione ao menos um bilhete.");
      return;
    }
  
    try {
      setLoading(true);
  
      // Calcula o preço total com base na quantidade de bilhetes
      const totalPrice = ethers.parseEther(
        (Number(ticketPrice) * selectedTickets.length).toString()
      );
  
      // Envia a transação para a função nova do contrato
      const tx = await rifa.buySpecificTickets(selectedTickets, {
        value: totalPrice,
      });
  
      await tx.wait();
  
      alert(`Bilhetes comprados com sucesso: ${selectedTickets.join(", ")}`);
  
      // Limpa seleção e recarrega dados
      setSelectedTickets([]);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Erro ao comprar bilhetes: " + (err?.reason || err?.message || "erro desconhecido"));
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
          <p>Bilhetes vendidos: {soldTickets} / {totalTickets}</p>
          <p>Preço do bilhete: {ticketPrice} ETH</p>
          <div className="tickets">
            <h3>Escolha seus bilhetes:</h3>
            <div className="ticket-list">
              {Array.from({ length: totalTickets }, (_, i) => i + 1).map((num) => {
                const isSold = soldTicketNumbers.includes(num);
                const isSelected = selectedTickets.includes(num);

                return (
                  <button
                    key={num}
                    className={`ticket-button ${isSold ? "sold" : isSelected ? "selected" : ""}`}
                    onClick={() => !isSold && toggleTicket(num)}
                    disabled={isSold || raffleEnded}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          {!raffleEnded ? (
            <>
              {selectedTickets.length > 0 && (
                <button onClick={buyTicket} disabled={loading}>
                  {loading ? "Processando..." : `Comprar ${selectedTickets.length} bilhete(s)`}
                </button>
              )}

            </>
          ) : (
            <div>
              <h3>🏆 Rifa encerrada!</h3>
              <p>Vencedor: {winner}</p>
              <p>🎉 Número sorteado: {winningTicketNumber}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
