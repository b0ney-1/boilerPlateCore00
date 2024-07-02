const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CoreLoanPlatform", function () {
  let CoreLoanPlatform, loanPlatform, MockERC20, tUSDT, tCORE;
  let owner, borrower, lender;

  it("Should transfer tokens to lenders and borrowers", async function () {
    [owner, borrower, lender] = await ethers.getSigners();

    MockERC20 = await ethers.getContractFactory("MockERC20");
    tUSDT = await MockERC20.deploy("Test USDT", "tUSDT", 1000000);
    tCORE = await MockERC20.deploy("Test CORE", "tCORE", 1000000);

    CoreLoanPlatform = await ethers.getContractFactory("CoreLoanPlatform");
    loanPlatform = await CoreLoanPlatform.deploy(await tUSDT.getAddress(),await tCORE.getAddress());
    console.log(await tUSDT.getAddress(), await tCORE.getAddress());

    // Transfer some tokens to borrower and lender
    await tUSDT.transfer(await borrower.getAddress(), 10000);
    await tCORE.transfer(await lender.getAddress(), 10000);

    // Approve contract to spend tokens
    await tUSDT.connect(borrower).approve(await loanPlatform.getAddress(), 10000);
    await tCORE.connect(lender).approve(await loanPlatform.getAddress(), 10000);
  });

  describe("Deposit and Withdraw Collateral", function () {
    it("should allow depositing collateral", async function () {
      await loanPlatform.connect(borrower).depositCollateral(1000);
      const balance = await tUSDT.balanceOf(loanPlatform.getAddress());
      expect(balance).to.equal("1000");
    });

    it("should allow withdrawing collateral", async function () {
      await loanPlatform.connect(borrower).depositCollateral(1000);
      await loanPlatform.connect(borrower).withdrawCollateral(500);
      const balance = await tUSDT.balanceOf(loanPlatform.getAddress());
      expect(balance).to.equal("500");
    });
  });

  describe("Borrow CORE", function () {
    beforeEach(async function () {
      await loanPlatform.connect(borrower).depositCollateral(1500);
      await loanPlatform.connect(lender).depositCORE(1000);
    });

    it("should allow borrowing CORE", async function () {
      await loanPlatform.connect(borrower).borrowCORE(1000);
      const loan = await loanPlatform.getLoanDetails(borrower.getAddress());
      expect(loan.amount).to.equal("1000");
      expect(loan.collateral).to.equal("1500");
      expect(loan.active).to.be.true;
    });

    it("should not allow borrowing more than collateral allows", async function () {
      await expect(
        loanPlatform.connect(borrower).borrowCORE(1001)
      ).to.be.revertedWith("Insufficient collateral");
    });
  });

  describe("Repay Loan", function () {
    beforeEach(async function () {
      await loanPlatform.connect(borrower).depositCollateral(1500);
      await loanPlatform.connect(lender).depositCORE(1000);
      await loanPlatform.connect(borrower).borrowCORE(1000);
      await tCORE.connect(lender).transfer(borrower.getAddress(), 50); // For interest
    });

    it("should allow repaying the loan", async function () {
      await tCORE.connect(borrower).approve(loanPlatform.getAddress(), 1050);
      await loanPlatform.connect(borrower).repayLoan();
      const loan = await loanPlatform.getLoanDetails(borrower.getAddress());
      expect(loan.active).to.be.false;
    });

    it("should not allow repaying after loan duration", async function () {
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]); // 31 days
      await ethers.provider.send("evm_mine");
      
      await expect(
        loanPlatform.connect(borrower).repayLoan()
      ).to.be.revertedWith("Loan duration exceeded");
    });
  });

  describe("Lender Operations", function () {
    it("should allow depositing CORE", async function () {
      await loanPlatform.connect(lender).depositCORE(1000);
      const balance = await loanPlatform.getLenderBalance(lender.getAddress());
      expect(balance).to.equal("1000");
    });

    it("should allow withdrawing CORE", async function () {
      await loanPlatform.connect(lender).depositCORE(1000);
      await loanPlatform.connect(lender).withdrawCORE(500);
      const balance = await loanPlatform.getLenderBalance(lender.getAddress());
      expect(balance).to.equal("500");
    });
  });
});