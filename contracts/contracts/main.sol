// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Rifa {
    address public owner;
    uint256 public ticketPrice;
    uint256 public totalTickets;
    uint256 public soldTickets;
    address[] public participants;
    bool public raffleEnded;

    event RaffleEnded(address winner, uint256 prizeAmount);

    constructor(uint256 _totalTickets, uint256 _ticketPrice) {
        owner = msg.sender;  
        totalTickets = _totalTickets;
        ticketPrice = _ticketPrice;
        soldTickets = 0;
        raffleEnded = false;
    }

    function buyTicket(uint qtd) external payable {
        require(!raffleEnded, "Rifa terminou...");
        require(qtd > 0, "Precisa comprar pelo menos 1 bilhete!");
        require(soldTickets + qtd <= totalTickets, "Nao ha bilhetes suficientes...");
        require(msg.value == ticketPrice * qtd, "Valor incorreto para os bilhetes");

        for (uint i = 0; i < qtd; i++) {
            participants.push(msg.sender);
            soldTickets++;
        }   
        
        if (soldTickets == totalTickets) {
            endRaffle();  
        }
    }

    function random() private view returns (uint256) {
        bytes32 blockHash = blockhash(block.number - 1);
        
        // Combina o blockhash, o timestamp e a dificuldade do bloco com a lista de participantes
        uint256 combinedData = uint256(keccak256(abi.encodePacked(blockHash, block.timestamp, block.prevrandao, participants)));
        uint256 randomIndex = combinedData % participants.length; 
        
        return randomIndex;
    }

    function endRaffle() private {
        require(soldTickets == totalTickets, "Rifa nao terminou");

        uint256 winnerIndex = random();
        address winner = participants[winnerIndex]; 

        uint256 totalAmount = totalTickets * ticketPrice;
        uint256 winnerPrize = (totalAmount * 80) / 100; // 80% para o vencedor
        uint256 ownerPrize = (totalAmount * 20) / 100;  // 20% para o dono

        payable(winner).transfer(winnerPrize);
        payable(owner).transfer(ownerPrize);

        raffleEnded = true;

        emit RaffleEnded(winner, winnerPrize);
    }

    function getRaffleStatus() external view returns (uint256, uint256, bool) {
        return (soldTickets, totalTickets, raffleEnded);
    }
}
