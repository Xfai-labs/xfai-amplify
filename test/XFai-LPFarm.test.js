// const { expectRevert, time } = require("@openzeppelin/test-helpers");
// const { web3 } = require("hardhat");
// const MockERC20 = artifacts.require("MockERC20");
// const XFai = artifacts.require("XFai");
// const XFIT = artifacts.require("Xfit");
// const MockLp = artifacts.require("MockLp");

// describe("XFai", async function () {
//   let alice, bob, carol, dev, minter;
//   beforeEach(async () => {
//     this.XFIT = await XFIT.new("Mettalex", "XFIT", {
//       from: alice,
//     });
//     [alice, bob, carol, dev, minter] = await web3.eth.getAccounts();
//     await this.XFIT.mint(alice, "1000000", { from: alice });
//   });

//   it("should set correct state variables", async () => {
//     this.xfai = await XFai.new(
//       this.XFIT.address,
//       dev,
//       "1000",
//       "2000000000000000000",
//       "0",
//       "1000",
//       "5000000000000000000000", // xFitThreeshold
//       "500000000000000000" , { from: alice }
//     );
//     await this.XFIT.transferOwnership(this.xfai.address, { from: alice });
//     const XFIT = await this.xfai.XFIT();
//     const devaddr = await this.xfai.devaddr();
//     const owner = await this.XFIT.owner();
//     assert.equal(XFIT.valueOf(), this.XFIT.address);
//     assert.equal(devaddr.valueOf(), dev);
//     assert.equal(owner.valueOf(), this.xfai.address);
//   });

//   it("should allow admin and only admin to update dev", async () => {
//     this.xfai = await XFai.new(
//       this.XFIT.address,
//       dev,
//       "1000",
//       "2000000000000000000",
//       "0",
//       "1000",
//       "5000000000000000000000", // xFitThreeshold
//       "500000000000000000" / { from: alice }
//     );
//     assert.equal((await this.xfai.devaddr()).valueOf(), dev);
//     await expectRevert(
//       this.xfai.dev(bob, { from: bob }),
//       "Ownable: caller is not the owner"
//     );
//     await this.xfai.dev(bob, { from: alice });
//     assert.equal((await this.xfai.devaddr()).valueOf(), bob);
//     await this.xfai.dev(dev, { from: alice });
//     assert.equal((await this.xfai.devaddr()).valueOf(), dev);
//   });

//   it("should allow admin and only admin to update XFIT rewards per block", async () => {
//     this.xfai = await XFai.new(
//       this.XFIT.address,
//       dev,
//       "1000",
//       "2000000000000000000",
//       "0",
//       "1000",
//       "5000000000000000000000", // xFitThreeshold
//       "500000000000000000" / { from: alice }
//     );
//     assert.equal((await this.xfai.devaddr()).valueOf(), dev);
//     await expectRevert(
//       this.xfai.setXFITRewardPerBlock("1234", { from: bob }),
//       "Ownable: caller is not the owner"
//     );
//     await this.xfai.setXFITRewardPerBlock("1234", { from: alice });
//     assert.equal((await this.xfai.XFITPerBlock()).valueOf(), "1234");
//   });

//   context("With ERC/LP token added to the field", () => {
//     beforeEach(async () => {
//       this.lp = await MockLp.new("LPToken", "LP", "10000000000", {
//         from: minter,
//       });
//       await this.lp.transfer(alice, "1000", { from: minter });
//       await this.lp.transfer(bob, "1000", { from: minter });
//       await this.lp.transfer(carol, "1000", { from: minter });
//       this.lp2 = await MockLp.new("LPToken2", "LP2", "10000000000", {
//         from: minter,
//       });
//       await this.lp2.transfer(alice, "1000", { from: minter });
//       await this.lp2.transfer(bob, "1000", { from: minter });
//       await this.lp2.transfer(carol, "1000", { from: minter });
//     });

//     it("should not allow deposit and withdraw methods after pauinsg the contracts", async () => {
//       this.xfai = await XFai.new(
//         this.XFIT.address,
//         dev,
//         "100",
//         "2000000000000000000",
//         "100",
//         "1000",
//         "5000000000000000000000", // xFitThreeshold
//         "500000000000000000" / { from: alice }
//       );
//       await this.xfai.add("100", this.lp.address, true);
//       await this.lp.approve(this.xfai.address, "1000", { from: bob });
//       await this.xfai.deposit(0, "100", { from: bob });
//       await this.xfai.pauseDistribution({ from: alice });
//       await expectRevert(
//         this.xfai.deposit(0, "100", { from: bob }),
//         "Pausable: paused"
//       );
//       await expectRevert(
//         this.xfai.withdraw(0, "100", { from: bob }),
//         "Pausable: paused"
//       );
//       await this.xfai.resumeDistribution({ from: alice });
//       await this.xfai.withdraw(0, "100", { from: bob });
//     });

//     it("should allow emergency withdraw", async () => {
//       // 100 per block farming rate starting at block 100 with bonus until block 1000
//       this.xfai = await XFai.new(
//         this.XFIT.address,
//         dev,
//         "100",
//         "2000000000000000000",
//         "100",
//         "1000",
//         "5000000000000000000000", // xFitThreeshold
//         "500000000000000000" / { from: alice }
//       );
//       await this.xfai.add("100", this.lp.address, true);
//       await this.lp.approve(this.xfai.address, "1000", { from: bob });
//       await this.xfai.deposit(0, "100", { from: bob });
//       assert.equal((await this.lp.balanceOf(bob)).valueOf(), "900");
//       await this.xfai.emergencyWithdraw(0, { from: bob });
//       assert.equal((await this.lp.balanceOf(bob)).valueOf(), "1000");
//     });

//     it("should give out XFITs only after farming time", async () => {
//       // 100 per block farming rate starting at block 100 with bonus until block 1000
//       this.xfai = await XFai.new(
//         this.XFIT.address,
//         dev,
//         "100",
//         "2000000000000000000",
//         "100",
//         "1000",
//         "5000000000000000000000", // xFitThreeshold
//         "500000000000000000" / { from: alice }
//       );
//       await this.XFIT.transfer(this.xfai.address, "1000000", {
//         from: alice,
//       });
//       await this.xfai.add("100", this.lp.address, true);
//       await this.lp.approve(this.xfai.address, "1000", { from: bob });
//       await this.xfai.deposit(0, "100", { from: bob });
//       await time.advanceBlockTo("89");
//       await this.xfai.deposit(0, "0", { from: bob }); // block 90
//       assert.equal((await this.XFIT.balanceOf(bob)).valueOf(), "0");
//       await time.advanceBlockTo("94");
//       await this.xfai.deposit(0, "0", { from: bob }); // block 95
//       assert.equal((await this.XFIT.balanceOf(bob)).valueOf(), "0");
//       await time.advanceBlockTo("99");
//       await this.xfai.deposit(0, "0", { from: bob }); // block 100
//       assert.equal((await this.XFIT.balanceOf(bob)).valueOf(), "0");
//       await time.advanceBlockTo("100");
//       await this.xfai.deposit(0, "0", { from: bob }); // block 101
//       assert.equal((await this.XFIT.balanceOf(bob)).valueOf(), "1000");
//       await time.advanceBlockTo("104");
//       await this.xfai.deposit(0, "0", { from: bob }); // block 105
//       assert.equal((await this.XFIT.balanceOf(bob)).valueOf(), "5000");
//       assert.equal((await this.XFIT.balanceOf(dev)).valueOf(), "500");
//       assert.equal((await this.XFIT.totalSupply()).valueOf(), "1000000");
//     });

//     it("should not distribute XFITs if no one deposit", async () => {
//       // 100 per block farming rate starting at block 200 with bonus until block 1000
//       this.xfai = await XFai.new(
//         this.XFIT.address,
//         dev,
//         "100",
//         "2000000000000000000",
//         "200",
//         "1000",
//         "5000000000000000000000", // xFitThreeshold
//         "500000000000000000" / { from: alice }
//       );
//       await this.XFIT.transfer(this.xfai.address, "1000000", {
//         from: alice,
//       });
//       await this.xfai.add("100", this.lp.address, true);
//       await this.lp.approve(this.xfai.address, "1000", { from: bob });
//       await time.advanceBlockTo("199");
//       assert.equal((await this.XFIT.totalSupply()).valueOf(), "1000000");
//       await time.advanceBlockTo("209");
//       await this.xfai.deposit(0, "10", { from: bob }); // block 210
//       assert.equal((await this.XFIT.totalSupply()).valueOf(), "1000000");
//       assert.equal((await this.XFIT.balanceOf(bob)).valueOf(), "0");
//       assert.equal((await this.XFIT.balanceOf(dev)).valueOf(), "0");
//       assert.equal((await this.lp.balanceOf(bob)).valueOf(), "990");
//       await time.advanceBlockTo("219");
//       await this.xfai.withdraw(0, "10", { from: bob }); // block 220
//       assert.equal((await this.XFIT.totalSupply()).valueOf(), "1000000");
//       assert.equal((await this.XFIT.balanceOf(bob)).valueOf(), "10000");
//       assert.equal((await this.XFIT.balanceOf(dev)).valueOf(), "1000");
//       assert.equal((await this.lp.balanceOf(bob)).valueOf(), "1000");
//     });

//     it("should distribute XFITs properly for each staker", async () => {
//       // 100 per block farming rate starting at block 300 with bonus until block 1000
//       this.xfai = await XFai.new(
//         this.XFIT.address,
//         dev,
//         "100",
//         "2000000000000000000",
//         "300",
//         "1000",
//         "5000000000000000000000", // xFitThreeshold
//         "500000000000000000" / { from: alice }
//       );
//       await this.XFIT.transfer(this.xfai.address, "1000000", {
//         from: alice,
//       });
//       await this.xfai.add("100", this.lp.address, true);
//       await this.lp.approve(this.xfai.address, "1000", { from: alice });
//       await this.lp.approve(this.xfai.address, "1000", { from: bob });
//       await this.lp.approve(this.xfai.address, "1000", { from: carol });
//       // Alice deposits 10 LPs at block 310
//       await time.advanceBlockTo("309");
//       await this.xfai.deposit(0, "10", { from: alice });
//       // 4 * 1000 / 10 -> Dev
//       // Bob deposits 20 LPs at block 314
//       await time.advanceBlockTo("313");
//       await this.xfai.deposit(0, "20", { from: bob });
//       // 4 * 1000 / 10 -> Dev
//       // Carol deposits 30 LPs at block 318

//       await time.advanceBlockTo("317");
//       await this.xfai.deposit(0, "30", { from: carol });
//       // Alice deposits 10 more LPs at block 320. At this point:
//       //   Alice should have: 4*1000 + 4*1/3*1000 + 2*1/6*1000 = 5666
//       //   XFai should have the remaining: 1000000 - 5666 = 994334
//       // 2 * 1000 / 10 -> Dev

//       await time.advanceBlockTo("319");
//       await this.xfai.deposit(0, "10", { from: alice });
//       assert.equal((await this.XFIT.totalSupply()).valueOf(), "1000000");
//       assert.equal((await this.XFIT.balanceOf(alice)).valueOf(), "5666");
//       assert.equal((await this.XFIT.balanceOf(bob)).valueOf(), "0");
//       assert.equal((await this.XFIT.balanceOf(carol)).valueOf(), "0");
//       assert.equal(
//         (await this.XFIT.balanceOf(this.xfai.address)).valueOf(),
//         "993334"
//       );
//       assert.equal((await this.XFIT.balanceOf(dev)).valueOf(), "1000");
//       // Bob withdraws 5 LPs at block 330. At this point:
//       //   Bob should have: 4*2/3*1000 + 2*2/6*1000 + 10*2/7*1000 = 6190
//       //   XFai should have the remaining: 994334 - 6190 = 988144
//       await time.advanceBlockTo("329");
//       await this.xfai.withdraw(0, "5", { from: bob });
//       assert.equal((await this.XFIT.totalSupply()).valueOf(), "1000000");
//       assert.equal((await this.XFIT.balanceOf(alice)).valueOf(), "5666");
//       assert.equal((await this.XFIT.balanceOf(bob)).valueOf(), "6190");
//       assert.equal((await this.XFIT.balanceOf(carol)).valueOf(), "0");
//       assert.equal(
//         (await this.XFIT.balanceOf(this.xfai.address)).valueOf(),
//         "986144"
//       );
//       assert.equal((await this.XFIT.balanceOf(dev)).valueOf(), "2000");
//       // Alice withdraws 20 LPs at block 340.
//       // Bob withdraws 15 LPs at block 350.
//       // Carol withdraws 30 LPs at block 360.
//       await time.advanceBlockTo("339");
//       await this.xfai.withdraw(0, "20", { from: alice });
//       await time.advanceBlockTo("349");
//       await this.xfai.withdraw(0, "15", { from: bob });
//       await time.advanceBlockTo("359");
//       await this.xfai.withdraw(0, "30", { from: carol });
//       assert.equal((await this.XFIT.totalSupply()).valueOf(), "1000000");
//       assert.equal((await this.XFIT.balanceOf(dev)).valueOf(), "5000");
//       // Alice should have: 5666 + 10*2/7*1000 + 10*2/6.5*1000 = 11600
//       assert.equal((await this.XFIT.balanceOf(alice)).valueOf(), "11600");
//       // Bob should have: 6190 + 10*1.5/6.5 * 1000 + 10*1.5/4.5*1000 = 11831
//       assert.equal((await this.XFIT.balanceOf(bob)).valueOf(), "11831");
//       // Carol should have: 2*3/6*1000 + 10*3/7*1000 + 10*3/6.5*1000 + 10*3/4.5*1000 + 10*1000 = 26568
//       assert.equal((await this.XFIT.balanceOf(carol)).valueOf(), "26568");
//       // All of them should have 1000 LPs back.
//       assert.equal((await this.lp.balanceOf(alice)).valueOf(), "1000");
//       assert.equal((await this.lp.balanceOf(bob)).valueOf(), "1000");
//       assert.equal((await this.lp.balanceOf(carol)).valueOf(), "1000");
//     });

//     it("should give proper XFITs allocation to each pool", async () => {
//       // 100 per block farming rate starting at block 400 with bonus until block 1000
//       this.xfai = await XFai.new(
//         this.XFIT.address,
//         dev,
//         "100",
//         "2000000000000000000",
//         "400",
//         "1000",
//         "5000000000000000000000", // xFitThreeshold
//         "500000000000000000" / { from: alice }
//       );
//       await this.XFIT.transfer(this.xfai.address, "1000000", {
//         from: alice,
//       });
//       await this.lp.approve(this.xfai.address, "1000", { from: alice });
//       await this.lp2.approve(this.xfai.address, "1000", { from: bob });
//       // Add first LP to the pool with allocation 1
//       await this.xfai.add("10", this.lp.address, true);
//       // Alice deposits 10 LPs at block 410
//       await time.advanceBlockTo("409");
//       await this.xfai.deposit(0, "10", { from: alice });
//       // Add LP2 to the pool with allocation 2 at block 420
//       await time.advanceBlockTo("419");
//       await this.xfai.add("20", this.lp2.address, true);
//       // Alice should have 10*1000 pending reward
//       assert.equal((await this.xfai.pendingXFIT(0, alice)).valueOf(), "10000");
//       // Bob deposits 10 LP2s at block 425
//       await time.advanceBlockTo("424");
//       await this.xfai.deposit(1, "5", { from: bob });
//       // Alice should have 10000 + 5*1/3*1000 = 11666 pending reward
//       assert.equal((await this.xfai.pendingXFIT(0, alice)).valueOf(), "11666");
//       await time.advanceBlockTo("430");
//       // At block 430. Bob should get 5*2/3*1000 = 3333. Alice should get ~1666 more.
//       assert.equal((await this.xfai.pendingXFIT(0, alice)).valueOf(), "13333");
//       assert.equal((await this.xfai.pendingXFIT(1, bob)).valueOf(), "3333");
//     });

//     it("should stop giving bonus XFITs after the bonus period ends", async () => {
//       // 100 per block farming rate starting at block 500 with bonus until block 600
//       this.xfai = await XFai.new(
//         this.XFIT.address,
//         dev,
//         "100",
//         "2000000000000000000",
//         "500",
//         "600",
//         "5000000000000000000000", // xFitThreeshold
//         "500000000000000000" / { from: alice }
//       );
//       await this.XFIT.transfer(this.xfai.address, "1000000", {
//         from: alice,
//       });
//       await this.lp.approve(this.xfai.address, "1000", { from: alice });
//       await this.xfai.add("1", this.lp.address, true);
//       // Alice deposits 10 LPs at block 590
//       await time.advanceBlockTo("589");
//       await this.xfai.deposit(0, "10", { from: alice });
//       // At block 605, she should have 1000*10 + 100*5 = 10500 pending.
//       await time.advanceBlockTo("605");
//       assert.equal((await this.xfai.pendingXFIT(0, alice)).valueOf(), "10500");
//       // At block 606, Alice withdraws all pending rewards and should get 10600.
//       await this.xfai.deposit(0, "0", { from: alice });
//       assert.equal((await this.xfai.pendingXFIT(0, alice)).valueOf(), "0");
//       assert.equal((await this.XFIT.balanceOf(alice)).valueOf(), "10600");
//     });

//     it("should charge a exit fee when withdrawing", async () => {
//       this.xfai = await XFai.new(
//         this.XFIT.address,
//         dev,
//         "100",
//         "2000000000000000000",
//         "500",
//         "600",
//         "5000000000000000000000", // xFitThreeshold
//         "500000000000000000" / { from: alice }
//       );
//       await this.XFIT.transfer(this.xfai.address, "1000000", {
//         from: alice,
//       });
//       await this.xfai.add("1", this.lp.address, true);
//       await this.lp.approve(this.xfai.address, "1000", { from: bob });
//       await this.xfai.deposit(0, "1000", { from: bob });

//       await this.xfai.withdraw(0, "1000", { from: bob });

//       assert.equal((await this.lp.balanceOf(bob)).valueOf(), "980");
//       assert.equal((await this.lp.balanceOf(dev)).valueOf(), "20");
//     });

//     it("should stop generating new rewards when the XFITRewardPerBlock is set to zero", async () => {
//       // 100 per block farming rate starting at block 500 with bonus until block 600
//       this.xfai = await XFai.new(
//         this.XFIT.address,
//         dev,
//         "100",
//         "2000000000000000000",
//         "700",
//         "800",
//         "5000000000000000000000", // xFitThreeshold
//         "500000000000000000" / { from: alice }
//       );
//       await this.XFIT.transfer(this.xfai.address, "1000000", {
//         from: alice,
//       });
//       await this.lp.approve(this.xfai.address, "1000", { from: bob });
//       await this.xfai.add("1", this.lp.address, true);
//       // Bob deposits 10 LPs at block 790
//       await time.advanceBlockTo("789");
//       await this.xfai.deposit(0, "10", { from: bob });
//       // At block 605, bob should have 1000*10 + 100*5 = 10500 pending.
//       await time.advanceBlockTo("805");
//       assert.equal((await this.xfai.pendingXFIT(0, bob)).valueOf(), "10500");

//       //Set reward to zero
//       await this.xfai.setXFITRewardPerBlock(0, { from: alice });

//       // At block 806, reward should stay the same.
//       assert.equal((await this.xfai.pendingXFIT(0, bob)).valueOf(), "10600");
//       assert.equal((await this.XFIT.balanceOf(bob)).toString(), "0");

//       // Things
//       await time.advanceBlockTo("890");
//       assert.equal((await this.xfai.pendingXFIT(0, bob)).valueOf(), "10600");
//       await this.xfai.withdraw(0, "0", { from: bob });
//       assert.equal((await this.xfai.pendingXFIT(0, bob)).valueOf(), "0");
//       assert.equal((await this.XFIT.balanceOf(bob)).toString(), "10600");

//       await time.advanceBlockTo("900");
//       await this.xfai.deposit(0, "100", { from: bob });

//       await time.advanceBlockTo("910");

//       assert.equal((await this.xfai.pendingXFIT(0, bob)).valueOf(), "0");
//       await this.xfai.withdraw(0, "0", { from: bob });
//       assert.equal((await this.XFIT.balanceOf(bob)).toString(), "10600");
//     });

//     it("should maintain appropriate list of user addresses which are enrolled", async () => {
//       this.xfai = await XFai.new(
//         this.XFIT.address,
//         dev,
//         "100",
//         "2000000000000000000",
//         "500",
//         "600",
//         "5000000000000000000000", // xFitThreeshold
//         "500000000000000000" / { from: alice }
//       );
//       await this.XFIT.transfer(this.xfai.address, "1000000", {
//         from: alice,
//       });
//       await this.xfai.add("1", this.lp.address, true);

//       // Alice deposits
//       await this.lp.approve(this.xfai.address, "1000", { from: alice });
//       await this.xfai.deposit(0, "10", { from: alice });

//       // Bob deposits
//       await this.lp.approve(this.xfai.address, "1000", { from: bob });
//       await this.xfai.deposit(0, "10", { from: bob });

//       // Carol deposits
//       await this.lp.approve(this.xfai.address, "1000", { from: carol });
//       await this.xfai.deposit(0, "10", { from: carol });

//       // bob again deposits
//       await this.lp.approve(this.xfai.address, "1000", { from: bob });
//       await this.xfai.deposit(0, "10", { from: bob });

//       // Alice again deposits
//       await this.lp.approve(this.xfai.address, "1000", { from: alice });
//       await this.xfai.deposit(0, "10", { from: alice });

//       // bob withdraws
//       await this.lp.approve(this.xfai.address, "1000", { from: bob });
//       await this.xfai.withdraw(0, "20", { from: bob });

//       const length = await this.xfai.userAddressesLength();
//       const userAddress1 = await this.xfai.userAddresses(0);
//       const userAddress2 = await this.xfai.userAddresses(1);
//       assert.equal(userAddress1, alice);
//       assert.equal(userAddress2, bob);
//       assert.equal(length, 3);
//     });
//   });
// });
