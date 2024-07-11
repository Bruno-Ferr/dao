import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("myDAO", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deploy() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();
    const tokenName = 'myDAO';
    const tokenSymbol = 'DAO';

    const Lock = await hre.ethers.getContractFactory("DAOContract");
    const lock = await Lock.deploy(tokenName, tokenSymbol);

    return { lock, owner, otherAccount, tokenName, tokenSymbol };
  }

  async function createDAOGroup() {
    const { lock, owner, otherAccount, tokenName, tokenSymbol } = await loadFixture(deploy);
    const groupId = 1;
    const groupName = "meu Teste";

    await lock.registerDAOGroup(groupId, groupName);

    return { lock, owner, otherAccount, tokenName, tokenSymbol, groupId, groupName };
  }

  async function createProposal() {
    const { lock, owner, otherAccount, tokenName, tokenSymbol, groupId, groupName } = await loadFixture(createDAOGroup);
    const description = 'Minha proposta X';
    const proposalId = await lock.proposalsCount()

    await lock.createNft(otherAccount, 'URI', groupId);
    await lock.connect(otherAccount).createProposal(groupId, description);

    return { lock, owner, otherAccount, tokenName, tokenSymbol, groupId, groupName, proposalId };
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { lock, tokenName } = await loadFixture(deploy);

      expect(await lock.name()).to.equal(tokenName);
    });

    it("Should set the right owner", async function () {
      const { lock, owner } = await loadFixture(deploy);

      expect(await lock.owner()).to.equal(owner.address);
    });
  });

  describe("Organization", function () {
    describe("Group", function () {
      it("Should revert if mint an NFT without a group", async function () {
        const { lock, owner, otherAccount } = await loadFixture(deploy);

        await expect(lock.connect(owner).createNft(otherAccount, 'URIteste', 1)).to.revertedWith("DAO group didn't exist");
      });

      it("Should revert if NFT 'minter' is not owner", async function () {
        const { lock, otherAccount } = await loadFixture(deploy);

        await expect(lock.connect(otherAccount).createNft(otherAccount, 'teste', 1)).to.revertedWith('Just the owner can do this action!')
      });

      it("Should not create a group if msg.sender is not the owner", async function () {
        const { lock, otherAccount } = await loadFixture(deploy);
        const groupId = 1;
        const groupName = "meu Teste";

        await expect(lock.connect(otherAccount).registerDAOGroup(groupId, groupName)).to.be.revertedWith('Just the owner can do this action!');
      })

      it("Should create a group", async function () {
        const { lock } = await loadFixture(deploy);
        const groupId = 1;
        const groupName = "meu Teste";

        await lock.registerDAOGroup(groupId, groupName);

        expect(await lock.daoGroups(1)).to.equal(groupName); //It is returning an array
      })

      it("Should mint an NFT", async function () {
        const { lock, otherAccount, groupId } = await loadFixture(createDAOGroup);

        const nftId = await lock.tokenCounter();
        await lock.createNft(otherAccount, 'URI', groupId);

        expect(await lock.ownerOf(nftId)).to.be.equal(otherAccount.address)
      })
    });

    describe("Proposals", function () {
      it("Should revert if DAO didn't exist or has no NFT holders", async function () {
        const { lock, groupId } = await loadFixture(createDAOGroup);
        const description = 'Minha proposta X';

        await expect(lock.createProposal(groupId, description)).to.be.revertedWith("DAO group does not exist or has no NFT holders")
      });

      it("Should revert if msg.sender is not a member from the DAO", async function () {
        const { lock, groupId, otherAccount } = await loadFixture(createDAOGroup);
        const description = 'Minha proposta X';

        await lock.createNft(otherAccount, 'URI', groupId);

        await expect(lock.createProposal(groupId, description)).to.be.revertedWith("You are not a member from this DAO")
      });

      it("Should create a proposal", async function () {
        const { lock, groupId, otherAccount } = await loadFixture(createDAOGroup);
        const description = 'Minha proposta X';

        await lock.createNft(otherAccount, 'URI', groupId);
        await lock.connect(otherAccount).createProposal(groupId, description);

        expect(await lock.isProposalInDAOGroup(groupId, 0)).to.be.true
      });

      it("Should revert vote if msg.sender is not a member from the DAO", async function () {
        const { lock, groupId, proposalId } = await loadFixture(createProposal);

        await expect(lock.voteOnProposal(groupId, proposalId, true)).to.be.revertedWith('Address is not eligible to vote in this DAO group');
      });

      it("Should revert vote if proposal is not in msg.sender DAO", async function () {
        const { lock, owner, groupId, proposalId } = await loadFixture(createProposal);
        const secondGroupId = 2;
        const secondGoupName = "meu Teste2";

        await lock.registerDAOGroup(secondGroupId, secondGoupName);
        await lock.createNft(owner, 'URI', groupId);

        await expect(lock.voteOnProposal(secondGroupId, proposalId, true)).to.be.revertedWith('Address is not eligible to vote in this DAO group');
      });

      it("Should revert vote if proposal is already closed", async function () {
        const { lock, owner, otherAccount, groupId, proposalId } = await loadFixture(createProposal);
        await lock.connect(otherAccount).voteOnProposal(groupId, proposalId, true);

        await lock.createNft(owner, 'URI', groupId);
        await lock.connect(owner).voteOnProposal(groupId, proposalId, true);

        await expect(lock.connect(owner).voteOnProposal(groupId, proposalId, true)).to.be.revertedWith('Proposal is closed');
      });

      it("Should register msg.sender vote", async function () {
        const { lock, otherAccount, groupId, proposalId } = await loadFixture(createProposal);
        await lock.connect(otherAccount).voteOnProposal(groupId, proposalId, true);

        const [yesVotes] = await lock.seeProposalVotes(proposalId)
        expect(Number(yesVotes)).to.be.equal(1);
      });

      it("Should revert vote if msg.sender try to vote multiple times", async function () {
        const { lock, otherAccount, groupId, proposalId } = await loadFixture(createProposal);
        await lock.connect(otherAccount).voteOnProposal(groupId, proposalId, true);

        await expect(lock.connect(otherAccount).voteOnProposal(groupId, proposalId, true)).to.be.revertedWith('You have already voted on this proposal');
      });
    });
  });
});
