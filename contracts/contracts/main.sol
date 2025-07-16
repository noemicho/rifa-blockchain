// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Rifa {
    address public owner;
    uint256 public ticketPrice;
    uint256 public totalTickets;
    uint256 public soldTickets;
    bool public raffleEnded;

    mapping(uint256 => address) public ticketOwners;
    uint256[] public soldTicketNumbers;

    event RaffleEnded(address winner, uint256 ticketNumber, uint256 prizeAmount);

    event TicketPurchased(address buyer, uint256 ticketNumber);

    constructor(uint256 _totalTickets, uint256 _ticketPrice) {
        owner = msg.sender;
        totalTickets = _totalTickets;
        ticketPrice = _ticketPrice;
        soldTickets = 0;
        raffleEnded = false;
    }

    modifier onlyBeforeEnd() {
        require(!raffleEnded, "Rifa ja terminou.");
        _;
    }

    function buySpecificTickets(uint256[] memory ticketNumbers) external payable onlyBeforeEnd {
        require(ticketNumbers.length > 0, "Precisa escolher pelo menos um numero");
        require(soldTickets + ticketNumbers.length <= totalTickets, "Nao ha bilhetes suficientes...");
        require(msg.value == ticketPrice * ticketNumbers.length, "Valor incorreto");

        for (uint i = 0; i < ticketNumbers.length; i++) {
            uint256 number = ticketNumbers[i];
            require(number > 0 && number <= totalTickets, "Numero de bilhete invalido");
            require(ticketOwners[number] == address(0), "Bilhete ja vendido");

            ticketOwners[number] = msg.sender;
            soldTicketNumbers.push(number);
            soldTickets++;

            emit TicketPurchased(msg.sender, number);
        }

        if (soldTickets == totalTickets) {
            endRaffle();
        }
    }

    function endRaffle() private {
        require(soldTickets == totalTickets, "Rifa ainda nao terminou");

        uint256 winnerIndex = random();
        uint256 winningTicket = soldTicketNumbers[winnerIndex];
        address winner = ticketOwners[winningTicket];

        uint256 totalAmount = totalTickets * ticketPrice;
        uint256 winnerPrize = (totalAmount * 80) / 100;
        uint256 ownerPrize = totalAmount - winnerPrize;

        payable(winner).transfer(winnerPrize);
        payable(owner).transfer(ownerPrize);

        raffleEnded = true;
        emit RaffleEnded(winner, winningTicket, winnerPrize);

    }

    function random() private view returns (uint256) {
        bytes32 blockHash = blockhash(block.number - 1);
        uint256 combined = uint256(keccak256(abi.encodePacked(blockHash, block.timestamp, block.prevrandao, soldTicketNumbers)));
        return combined % soldTicketNumbers.length;
    }

    function getSoldTickets() external view returns (uint256[] memory) {
        return soldTicketNumbers;
    }

    function getOwnerOfTicket(uint256 number) external view returns (address) {
        return ticketOwners[number];
    }
}
