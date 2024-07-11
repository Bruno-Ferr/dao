// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "hardhat/console.sol";

contract DAOContract is ERC721URIStorage {
    //Transfer NFT
    address public owner;
    uint256 public tokenCounter;
    uint32 public weekInSeconds = 60 * 60 * 24 * 7; //604800

    //Evento de criação de DAO
    //Evento de nftHolder adicionado
    //Evento de proposta criada
    //Evento de termino de votação
    //Evento de proposta aceita/recusada

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
        //Necessário verificar se o grupo existe
        require(bytes(daoGroups[groupNumber].name).length > 0, "DAO group didn't exist");
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
        address[] yesVotes;   //Validações devem buscar pelo endereço nos dois votos para não votar novamente. Um mesmo token não pode votar duas vezes.
        address[] noVotes;
        bool isOpen;
        uint256 createdAt;    //Horário de criação
        uint256 closeAt;      //Horário final
        bool result;
    }

    struct DAOGroup {
        string name;
        address[] nftHolders;
        uint[] daoProposals; //Contém o valor uint de todas as propostas dessa dao
    }

    mapping(uint => DAOGroup) public daoGroups;
    mapping(uint256 => Proposal) proposals;
    uint256 public proposalsCount;

    function alreadyVoted(address voter, uint256 proposalId) internal view returns(bool) {
        for (uint i = 0; i < proposals[proposalId].yesVotes.length; i++) {
            if (proposals[proposalId].yesVotes[i] == voter) {
                return false;
            }
        }
        for (uint i = 0; i < proposals[proposalId].noVotes.length; i++) {
            if (proposals[proposalId].noVotes[i] == voter) {
                return false;
            }
        }
        return true;
    }

    function checkProposalOutcome(uint256 proposalId) internal {
      if (proposals[proposalId].yesVotes.length > daoGroups[proposals[proposalId].proposalId].nftHolders.length / 2) {
          proposals[proposalId].result = true;
          proposals[proposalId].isOpen = false;
          
          // Additional logic can go here, such as emitting an event
          
          // Optionally, you can perform other actions related to proposal acceptance
      }
    }

    function registerDAOGroup(uint groupId, string memory groupName) public onlyOwner {
        //Contador de grupo para fazer automaticamente
        address[] memory nftHolders;
        uint[] memory daoProposals;
        daoGroups[groupId] = DAOGroup(groupName, nftHolders, daoProposals);
    }

    function canVote(uint256 groupId, address voter) public view returns (bool) {
        for (uint i = 0; i < daoGroups[groupId].nftHolders.length; i++) {
            if (daoGroups[groupId].nftHolders[i] == voter) {
                return true;
            }
        }
        return false;
    }

    function createProposal(uint256 groupId, string memory description) public {
        require(daoGroups[groupId].nftHolders.length > 0, "DAO group does not exist or has no NFT holders");
        require(canVote(groupId, msg.sender), "You are not a member from this DAO");
        uint256 proposalId = proposalsCount;
        proposalsCount++;
        address[] memory yesVotes;
        address[] memory noVotes;
        proposals[proposalId] = Proposal(proposalId, description, yesVotes, noVotes, true, block.timestamp, block.timestamp + weekInSeconds, false);
        daoGroups[groupId].daoProposals.push(proposalId);
    }

    function isProposalInDAOGroup(uint daoGroupId, uint proposalId) public view returns (bool) {
        for (uint i = 0; i < daoGroups[daoGroupId].daoProposals.length; i++) {
            if (daoGroups[daoGroupId].daoProposals[i] == proposalId) {
                return true;
            }
        }
        return false;
    }

    function voteOnProposal(uint256 groupId, uint256 proposalId, bool voteYes) public {
        require(canVote(groupId, msg.sender), "Address is not eligible to vote in this DAO group");
        require(isProposalInDAOGroup(groupId, proposalId), "This proposal is not in your DAO group");
        require(proposals[proposalId].isOpen, "Proposal is closed");
        require(alreadyVoted(msg.sender, proposalId), "You have already voted on this proposal");
        // Lógica para registrar o voto
        voteYes ? proposals[proposalId].yesVotes.push(msg.sender) : proposals[proposalId].noVotes.push(msg.sender);
        
        checkProposalOutcome(proposalId);
    }
    
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        return _isApprovedOrOwner(spender, tokenId);
    }
}