// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract MyContract is ERC721 {
  address owner;

  constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {
    // Inicialização do contrato
    owner = msg.sender;
  }

  modifier onlyOwner {
    require(msg.sender == owner, "Just the owner can do this action!");
    _;
  }

  function mint(address _to, uint256 _tokenId) public onlyOwner {
    _mint(_to, _tokenId);
}

  struct Proposal {
    uint256 proposalId;
    string description;
    uint256 yesVotes;
    uint256 noVotes;
    bool isOpen;
  }

  struct DAOGroup {
    string name;
    address[] nftHolders;
    uint[] daoProposals; //Contém o valor uint de todas as propostas dessa dao
  }

  mapping(uint => DAOGroup) public daoGroups;
  mapping(uint256 => Proposal) proposals;

  function registerDAOGroup(uint groupId, string memory groupName) public {
    address[] memory nftHolders;
    uint[] memory daoProposals;
    daoGroups[groupId] = DAOGroup(groupName, nftHolders, daoProposals);
  }
}