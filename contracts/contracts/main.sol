// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Rifa {
    address public owner;
    uint256 public ticketPrice;
    uint256 public totalTickets;
    uint256 public soldTickets;
    bool public raffleEnded;

    mapping(uint256 => address) public ticketOwner;
    mapping(uint256 => bool) public isTicketSold;
    mapping(address => bool) public hasParticipated;

    address[] public participants;

    event RaffleEnded(address winner, uint256 prizeAmount);
    event TicketsBought(address buyer, uint256[] ticketNumbers);

    constructor(uint256 _totalTickets, uint256 _ticketPrice) {
        owner = msg.sender;
        totalTickets = _totalTickets;
        ticketPrice = _ticketPrice;
        soldTickets = 0;
        raffleEnded = false;
    }

    function buyTickets(uint256[] memory _ticketNumbers) public payable {
        require(!raffleEnded, "Rifa terminou...");
        uint256 quantity = _ticketNumbers.length;
        require(quantity > 0, "Precisa comprar pelo menos 1 bilhete");
        require(soldTickets + quantity <= totalTickets, "Nao ha bilhetes suficientes...");
        require(msg.value == ticketPrice * quantity, "Valor incorreto para os bilhetes");

        for (uint i = 0; i < quantity; i++) {
            uint256 ticketNumber = _ticketNumbers[i];
            require(ticketNumber > 0 && ticketNumber <= totalTickets, "Numero de bilhete invalido");
            require(!isTicketSold[ticketNumber], "Bilhete ja vendido");

            isTicketSold[ticketNumber] = true;
            ticketOwner[ticketNumber] = msg.sender;
        }

        if (!hasParticipated[msg.sender]) {
            participants.push(msg.sender);
            hasParticipated[msg.sender] = true;
        }

        soldTickets += quantity;
        emit TicketsBought(msg.sender, _ticketNumbers);

        if (soldTickets == totalTickets) {
            endRaffle();
        }
    }

    function endRaffle() private {
        require(!raffleEnded, "Rifa ja finalizada");
        require(soldTickets == totalTickets, "Rifa ainda em andamento");

        uint256 winnerIndex = random();
        address winner = participants[winnerIndex];

        uint256 totalAmount = totalTickets * ticketPrice;
        uint256 winnerPrize = (totalAmount * 80) / 100;
        uint256 ownerPrize = totalAmount - winnerPrize;

        payable(winner).transfer(winnerPrize);
        payable(owner).transfer(ownerPrize);

        raffleEnded = true;

        emit RaffleEnded(winner, winnerPrize);
    }

    function random() private view returns (uint256) {
        return uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, participants))
        ) % participants.length;
    }

    function getSoldTickets() public view returns (uint256[] memory) {
        uint256[] memory sold = new uint256[](soldTickets);
        uint256 counter = 0;
        for (uint256 i = 1; i <= totalTickets; i++) {
            if (isTicketSold[i]) {
                sold[counter] = i;
                counter++;
            }
        }
        return sold;
    }
}
