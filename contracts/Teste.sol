// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract MyContract is ERC721URIStorage {
  address owner;
  uint256 public tokenCounter;
  constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {
    // Inicialização do contrato
    owner = msg.sender;
    tokenCounter = 0;
  }

  modifier onlyOwner {
    require(msg.sender == owner, "Just the owner can do this action!");
    _;
  }

  function createNft(address _to, string memory _tokenURI, uint groupNumber) public onlyOwner returns (uint256) {
    uint256 newItemId = tokenCounter;
    _safeMint(_to, newItemId);
    _setTokenURI(newItemId, _tokenURI);
    tokenCounter = tokenCounter + 1;
    daoGroups[groupNumber].nftHolders.push(_to);
    return newItemId;
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

  function registerDAOGroup(uint groupId, string memory groupName) public onlyOwner {
    address[] memory nftHolders;
    uint[] memory daoProposals;
    daoGroups[groupId] = DAOGroup(groupName, nftHolders, daoProposals);
  }
}