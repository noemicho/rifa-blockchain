// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Rifa {
    struct RifaData {
        string name;
        address owner;
        uint256 ticketPrice;
        uint256 totalTickets;
        uint256 soldTickets;
        bool raffleEnded;
        uint256[] soldTicketNumbers;
        mapping(uint256 => address) ticketOwners;
        address winner;
        uint256 winningTicketNumber;
    }

    RifaData[] public rifas;

    event RifaCreated(uint256 rifaId, string name, address owner, uint256 totalTickets, uint256 ticketPrice);
    event TicketPurchased(uint256 rifaId, address buyer, uint256 ticketNumber);
    event RaffleEnded(uint256 rifaId, address winner, uint256 ticketNumber, uint256 prizeAmount);

    modifier onlyRifaOwner(uint256 rifaId) {
        require(rifaId < rifas.length, "Rifa inexistente");
        require(msg.sender == rifas[rifaId].owner, "Nao eh dono da rifa");
        _;
    }

    modifier onlyBeforeEnd(uint256 rifaId) {
        require(rifaId < rifas.length, "Rifa inexistente");
        require(!rifas[rifaId].raffleEnded, "Rifa ja terminou");
        _;
    }

    function createRifa(string calldata name, uint256 totalTickets, uint256 ticketPrice) external {
        require(totalTickets > 0, "Total de bilhetes deve ser > 0");
        require(ticketPrice > 0, "Preco do bilhete deve ser > 0");

        rifas.push();
        RifaData storage r = rifas[rifas.length - 1];
        r.name = name;
        r.owner = msg.sender;
        r.totalTickets = totalTickets;
        r.ticketPrice = ticketPrice;
        r.soldTickets = 0;
        r.raffleEnded = false;
        r.winner = address(0);
        r.winningTicketNumber = 0;

        emit RifaCreated(rifas.length - 1, name, msg.sender, totalTickets, ticketPrice);
    }

    function buySpecificTickets(uint256 rifaId, uint256[] calldata ticketNumbers) external payable onlyBeforeEnd(rifaId) {
        require(ticketNumbers.length > 0, "Escolha ao menos um bilhete");
        RifaData storage r = rifas[rifaId];
        require(r.soldTickets + ticketNumbers.length <= r.totalTickets, "Nao ha bilhetes suficientes");
        require(msg.value == r.ticketPrice * ticketNumbers.length, "Valor incorreto");

        for (uint i = 0; i < ticketNumbers.length; i++) {
            uint256 num = ticketNumbers[i];
            require(num > 0 && num <= r.totalTickets, "Numero de bilhete invalido");
            require(r.ticketOwners[num] == address(0), "Bilhete ja vendido");

            r.ticketOwners[num] = msg.sender;
            r.soldTicketNumbers.push(num);
            r.soldTickets++;

            emit TicketPurchased(rifaId, msg.sender, num);
        }

        if (r.soldTickets == r.totalTickets) {
            _endRaffle(rifaId);
        }
    }

    function endRaffleManually(uint256 rifaId) external onlyRifaOwner(rifaId) onlyBeforeEnd(rifaId) {
        RifaData storage r = rifas[rifaId];
        require(r.soldTickets > 0, "Nenhum bilhete vendido");
        _endRaffle(rifaId);
    }

    function _endRaffle(uint256 rifaId) internal {
        RifaData storage r = rifas[rifaId];
        require(!r.raffleEnded, "Rifa ja encerrada");
        require(r.soldTickets > 0, "Nenhum bilhete vendido");

        uint256 winnerIndex = random(r.soldTicketNumbers);
        uint256 winningTicket = r.soldTicketNumbers[winnerIndex];
        address winner = r.ticketOwners[winningTicket];

        uint256 totalAmount = r.soldTickets * r.ticketPrice;
        uint256 winnerPrize = (totalAmount * 80) / 100;
        uint256 ownerPrize = totalAmount - winnerPrize;

        payable(winner).transfer(winnerPrize);
        payable(r.owner).transfer(ownerPrize);

        r.winner = winner;
        r.winningTicketNumber = winningTicket;
        r.raffleEnded = true;

        emit RaffleEnded(rifaId, winner, winningTicket, winnerPrize);
    }

    function random(uint256[] storage soldTickets) internal view returns (uint256) {
        bytes32 blockHash = blockhash(block.number - 1);
        uint256 combined = uint256(keccak256(abi.encodePacked(blockHash, block.timestamp, block.prevrandao, soldTickets)));
        return combined % soldTickets.length;
    }

    // Getters para rifas

    function getRifasCount() external view returns (uint256) {
        return rifas.length;
    }

    function getRifaBasic(uint256 rifaId) external view returns (
        string memory name,
        address owner,
        uint256 ticketPrice,
        uint256 totalTickets,
        uint256 soldTickets,
        bool raffleEnded,
        address winner,
        uint256 winningTicketNumber
    ) {
        require(rifaId < rifas.length, "Rifa inexistente");
        RifaData storage r = rifas[rifaId];
        return (r.name, r.owner, r.ticketPrice, r.totalTickets, r.soldTickets, r.raffleEnded, r.winner, r.winningTicketNumber);
    }

    function getSoldTickets(uint256 rifaId) external view returns (uint256[] memory) {
        require(rifaId < rifas.length, "Rifa inexistente");
        return rifas[rifaId].soldTicketNumbers;
    }

    function getOwnerOfTicket(uint256 rifaId, uint256 ticketNumber) external view returns (address) {
        require(rifaId < rifas.length, "Rifa inexistente");
        return rifas[rifaId].ticketOwners[ticketNumber];
    }
}
