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
        const { lock, owner } = await loadFixture(deploy);
      });

      it("Should revert if NFT 'minter' is not owner", async function () {
        const { lock, otherAccount } = await loadFixture(deploy);

        expect(await lock.connect(otherAccount).createNft(otherAccount, 'teste', 1)).to.be.revertedWith('Just the owner can do this action!')
      });

      it("Should create a group", async function () {
        const { lock, owner } = await loadFixture(deploy);
        const groupId = 1;
        const groupName = "meu Teste";

        await lock.registerDAOGroup(groupId, groupName);

        console.log(await lock.daoGroups(2));
        expect((await lock.daoGroups(1))).to.equal(groupName); //It is returning an array
      })
    })
  });

  // describe("Withdrawals", function () {
  //   describe("Validations", function () {
  //     it("Should revert with the right error if called too soon", async function () {
  //       const { lock } = await loadFixture(deployOneYearLockFixture);

  //       await expect(lock.withdraw()).to.be.revertedWith(
  //         "You can't withdraw yet"
  //       );
  //     });

  //     it("Should revert with the right error if called from another account", async function () {
  //       const { lock, unlockTime, otherAccount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // We can increase the time in Hardhat Network
  //       await time.increaseTo(unlockTime);

  //       // We use lock.connect() to send a transaction from another account
  //       await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
  //         "You aren't the owner"
  //       );
  //     });

  //     it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
  //       const { lock, unlockTime } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // Transactions are sent using the first signer by default
  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).not.to.be.reverted;
  //     });
  //   });

//     describe("Events", function () {
//       it("Should emit an event on withdrawals", async function () {
//         const { lock, unlockTime, lockedAmount } = await loadFixture(
//           deployOneYearLockFixture
//         );

//         await time.increaseTo(unlockTime);

//         await expect(lock.withdraw())
//           .to.emit(lock, "Withdrawal")
//           .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
//       });
//     });

//     describe("Transfers", function () {
//       it("Should transfer the funds to the owner", async function () {
//         const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
//           deployOneYearLockFixture
//         );

//         await time.increaseTo(unlockTime);

//         await expect(lock.withdraw()).to.changeEtherBalances(
//           [owner, lock],
//           [lockedAmount, -lockedAmount]
//         );
//       });
//     });
//   });
});
