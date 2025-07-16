import React, { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import RifaABI from "./abis/Rifa.json";
import './App.css';
const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

function App() {
  const [numbers] = useState(Array.from({ length: 100 }, (_, i) => i + 1));
  const [wallet, setWallet] = useState(null);
  const [rifa, setRifa] = useState(null);
  const [totalTickets, setTotalTickets] = useState(0);
  const [soldTickets, setSoldTickets] = useState(0);
  const [ticketPrice, setTicketPrice] = useState(0n); // Alterado para BigInt, o 'n' no final é importante
  const [raffleEnded, setRaffleEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [soldTicketNumbers, setSoldTicketNumbers] = useState([]);

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

  const loadData = useCallback(async () => {
    if (rifa) {
      const total = await rifa.totalTickets();
      const sold = await rifa.soldTickets();
      const price = await rifa.ticketPrice();
      const ended = await rifa.raffleEnded();
      setTotalTickets(Number(total));
      setSoldTickets(Number(sold));
      setTicketPrice(price); // Armazena o preço em Wei como BigInt
      setRaffleEnded(ended);

      // Carrega os números de bilhetes que já foram vendidos fazendo chamadas em paralelo
      const promises = [];
      const totalAsNumber = Number(total);
      for (let i = 1; i <= totalAsNumber; i++) {
        promises.push(rifa.isTicketSold(i));
      }

      const results = await Promise.all(promises);
      const soldNumbers = [];
      results.forEach((isSold, index) => {
        if (isSold) {
          soldNumbers.push(index + 1); // Números dos bilhetes são base 1 (index + 1)
        }
      });
      setSoldTicketNumbers(soldNumbers);
      if (ended) {
        const filtro = rifa.filters.RaffleEnded();
        const eventos = await rifa.queryFilter(filtro);
        const ultimo = eventos[eventos.length - 1];
        if (ultimo) {
          setWinner(ultimo.args[0]);
        }
      }
    }
  }, [rifa]);

  const buyTicket = async (numbersToBuy) => {
    try {
      setLoading(true);

      const quantity = numbersToBuy.length;

      // Lógica de cálculo corrigida para usar BigInt, evitando erros de ponto flutuante
      const totalPriceInWei = ticketPrice * BigInt(quantity);

      // Passa o array de números selecionados para o contrato
      const tx = await rifa.buyTicket(numbersToBuy, {
        value: totalPriceInWei,
      });

      await tx.wait();
      alert(`${quantity} bilhete(s) comprado(s) com sucesso!`);
      loadData();
      setSelectedNumbers([]);
    } catch (err) {
      alert("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleNumber = (number) => {
    // Impede a seleção de um número que já foi vendido
    if (soldTicketNumbers.includes(number)) return;

    setSelectedNumbers((prevSelected) =>
      prevSelected.includes(number)
        ? prevSelected.filter((num) => num !== number)
        : [...prevSelected, number]
    );
  };

  useEffect(() => {
    if (rifa) {
      loadData();
    }
  }, [rifa, loadData]);

  const buySelectedTickets = async () => {
    if (selectedNumbers.length === 0) {
      alert("Selecione pelo menos um número para comprar.");
      return;
    }
    await buyTicket(selectedNumbers);
  };

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
          {/* Formatando o preço para exibição, convertendo de Wei para ETH */}
          <p>Preço do bilhete: {ethers.formatEther(ticketPrice)} ETH</p>

          {!raffleEnded ? (
            <>
              <div className="number-grid">
                {numbers.map((number) => {
                  const isSold = soldTicketNumbers.includes(number);
                  const isSelected = selectedNumbers.includes(number);
                  return (
                    <button
                      key={number}
                      className={`number-button ${isSold ? "sold" : ""} ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleNumber(number)}
                      disabled={loading || isSold}
                    >{number}</button>
                  );
                })}
              </div>
              <button
                onClick={buySelectedTickets}
                disabled={loading || selectedNumbers.length === 0}
              >
                {loading
                  ? "Processando..."
                  : `Comprar ${selectedNumbers.length} bilhete(s)`
                }
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
