import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import MultiRifaABI from "./abis/Rifa.json";
import "./App.css";

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

function App() {
  const [wallet, setWallet] = useState(null);
  const [contract, setContract] = useState(null);
  const [rifas, setRifas] = useState([]);
  const [selectedRifaId, setSelectedRifaId] = useState(null);
  const [rifaDetails, setRifaDetails] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newName, setNewName] = useState("");
  const [newTotalTickets, setNewTotalTickets] = useState(10);
  const [newTicketPrice, setNewTicketPrice] = useState("0.01");

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Instale o Metamask");
      return;
    }
    const prov = new ethers.BrowserProvider(window.ethereum);
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setWallet(accounts[0]);
    const signer = await prov.getSigner();
    const contractInstance = new ethers.Contract(contractAddress, MultiRifaABI.abi, signer);
    setContract(contractInstance);
  };

  const loadRifas = async () => {
    if (!contract) return;
    const count = await contract.getRifasCount();
    const temp = [];
    for (let i = 0; i < count; i++) {
      const r = await contract.getRifaBasic(i);
      temp.push({
        id: i,
        name: r[0],
        owner: r[1],
        ticketPrice: ethers.formatEther(r[2]),
        totalTickets: Number(r[3]),
        soldTickets: Number(r[4]),
        raffleEnded: r[5],
        winner: r[6],
        winningTicketNumber: Number(r[7]),
      });
    }
    setRifas(temp);
  };

  const selectRifa = async (rifaId) => {
    setSelectedRifaId(rifaId);
    setSelectedTickets([]);
    if (!contract) return;

    const r = await contract.getRifaBasic(rifaId);
    const sold = await contract.getSoldTickets(rifaId);

    setRifaDetails({
      id: rifaId,
      name: r[0],
      owner: r[1],
      ticketPrice: ethers.formatEther(r[2]),
      totalTickets: Number(r[3]),
      soldTickets: Number(r[4]),
      raffleEnded: r[5],
      winner: r[6],
      winningTicketNumber: Number(r[7]),
      soldTicketNumbers: sold.map(n => Number(n)),
    });
  };

  const createRifa = async () => {
    if (!contract) return alert("Conecte carteira");
    if (!newName) return alert("Informe o nome da rifa");

    setLoading(true);
    try {
      const tx = await contract.createRifa(
        newName,
        Number(newTotalTickets),
        ethers.parseEther(newTicketPrice)
      );
      await tx.wait();
      alert("Rifa criada!");
      setNewName("");
      setNewTotalTickets(10);
      setNewTicketPrice("0.01");
      await loadRifas();
    } catch (e) {
      alert("Erro: " + (e?.reason || e?.message || e));
    }
    setLoading(false);
  };

  const toggleTicket = (num) => {
    if (!rifaDetails) return;
    if (rifaDetails.soldTicketNumbers.includes(num)) return;
    if (rifaDetails.raffleEnded) return;

    if (selectedTickets.includes(num)) {
      setSelectedTickets(selectedTickets.filter(n => n !== num));
    } else {
      setSelectedTickets([...selectedTickets, num]);
    }
  };

  const buyTickets = async () => {
    if (!contract || !rifaDetails) return;
    if (selectedTickets.length === 0) return alert("Selecione pelo menos um bilhete");

    setLoading(true);
    try {
      const totalPrice = ethers.parseEther((rifaDetails.ticketPrice * selectedTickets.length).toString());
      const tx = await contract.buySpecificTickets(rifaDetails.id, selectedTickets, { value: totalPrice });
      await tx.wait();
      alert("Bilhetes comprados: " + selectedTickets.join(", "));
      setSelectedTickets([]);
      await selectRifa(rifaDetails.id);
      await loadRifas();
    } catch (e) {
      alert("Erro ao comprar: " + (e?.reason || e?.message || e));
    }
    setLoading(false);
  };

  const endRaffleManually = async () => {
    if (!contract || !rifaDetails) return;
    setLoading(true);
    try {
      const tx = await contract.endRaffleManually(rifaDetails.id);
      await tx.wait();
      alert("Rifa encerrada manualmente!");
      await selectRifa(rifaDetails.id);
      await loadRifas();
    } catch (e) {
      alert("Erro ao encerrar: " + (e?.reason || e?.message || e));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (contract) {
      loadRifas();
    }
  }, [contract]);

  return (
    <div className="container">
      <h1>🎟️ Multi Rifa</h1>

      {!wallet ? (
        <button className="btn" onClick={connectWallet}>Conectar carteira</button>
      ) : (
        <p>Carteira conectada: <b>{wallet}</b></p>
      )}

      <hr />

      <h3>Criar nova rifa</h3>
      <div className="input-group">
        <label htmlFor="nomeRifa">Nome da Rifa:</label>
        <input
          id="nomeRifa"
          className="select"
          placeholder="Ex: Rifa de bicicleta"
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label htmlFor="totalBilhetes">Quantidade total de bilhetes:</label>
        <input
          id="totalBilhetes"
          className="select"
          type="number"
          min={1}
          value={newTotalTickets}
          onChange={e => setNewTotalTickets(Number(e.target.value))}
        />
      </div>

<div className="input-group">
  <label htmlFor="precoBilhete">Preço do bilhete (em ETH):</label>
  <input
    id="precoBilhete"
    className="select"
    placeholder="Ex: 0.01"
    value={newTicketPrice}
    onChange={e => setNewTicketPrice(e.target.value)}
  />
</div>

      <hr />

      <h3>Rifas existentes</h3>
      <ul className="rifa-list">
        {rifas.length === 0 && <p>Nenhuma rifa criada ainda.</p>}
        {rifas.map(r => (
          <li key={r.id} className="rifa-item">
            <div>
              <b>{r.name}</b> </div> 
              <div> </div>Status: 
              {r.raffleEnded ? " Encerrada" : " Aberta"} 
            
            <button className="btn" onClick={() => selectRifa(r.id)}>Visualizar</button>
          </li>
        ))}
      </ul>

      {rifaDetails && (
        <div className="rifa-details">
          <h3>Rifa: {rifaDetails.name}</h3>
          <p>Dono: {rifaDetails.owner}</p>
          <p>Bilhetes vendidos: {rifaDetails.soldTickets} / {rifaDetails.totalTickets}</p>
          <p>Preço do bilhete: {rifaDetails.ticketPrice} ETH</p>

          {rifaDetails.raffleEnded ? (
            <>
              <p className="raffle-ended">🎉 Rifa encerrada!</p>
              <p><b>🏆 Vencedor:</b> {rifaDetails.winner}</p>
              <p><b>🎟 Número sorteado:</b> {rifaDetails.winningTicketNumber}</p>
            </>
          ) : (
            <>
              {wallet?.toLowerCase() === rifaDetails.owner.toLowerCase() && (
                <button className="btn" style={{ backgroundColor: "#f44336", marginBottom: 15 }} onClick={endRaffleManually} disabled={loading}>
                  {loading ? "Encerrando..." : "Encerrar Rifa Manualmente"}
                </button>
              )}

              {selectedTickets.length > 0 && (
                <button className="btn buy-btn" onClick={buyTickets} disabled={loading}>
                  {loading ? "Comprando..." : `Comprar ${selectedTickets.length} bilhete(s)`}
                </button>
              )}
            </>
          )}

          <div className="ticket-list">
            {Array.from({ length: rifaDetails.totalTickets }, (_, i) => i + 1).map(num => {
              const sold = rifaDetails.soldTicketNumbers.includes(num);
              const selected = selectedTickets.includes(num);
              return (
                <button
                  key={num}
                  className={`ticket-button ${sold ? "sold" : selected ? "selected" : ""}`}
                  disabled={sold || rifaDetails.raffleEnded}
                  onClick={() => toggleTicket(num)}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
