// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PhoneHash {
    bytes32 public storedHash;
    string public phoneNumber;

    // Função para armazenar o número de telefone (cripto-hash)
    function storePhoneNumber(string memory _phoneNumber) public {
        // Gera o hash do número de telefone usando keccak256
        bytes32 phoneHash = keccak256(abi.encodePacked(_phoneNumber));
        
        // Armazena o hash do telefone
        storedHash = phoneHash;
        
        // Armazenar o número de telefone (em um estado seguro)
        phoneNumber = _phoneNumber;
        
        emit HashGenerated(storedHash);
    }

    // Função para verificar se o número fornecido pelo usuário corresponde ao hash armazenado
    function verifyPhoneNumber(string memory _phoneNumber) public view returns (bool) {
        // Gera o hash do número de telefone fornecido pelo usuário
        bytes32 userHash = keccak256(abi.encodePacked(_phoneNumber));
        
        // Compara o hash gerado com o hash armazenado
        return userHash == storedHash;
    }

    // Evento para notificar o hash gerado
    event HashGenerated(bytes32 hash);
}
