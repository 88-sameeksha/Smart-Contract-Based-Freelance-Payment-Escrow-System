const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FreelanceEscrow", function () {
  let escrow;
  let client;
  let freelancer;
  let arbitrator;
  let attacker;

  const amount = ethers.parseEther("1");

  beforeEach(async function () {
    [client, freelancer, arbitrator, attacker] =
      await ethers.getSigners();

    const Factory = await ethers.getContractFactory("FreelanceEscrow");
    escrow = await Factory.deploy(arbitrator.address);
    await escrow.waitForDeployment();
  });

  async function createProject() {
    await escrow
      .connect(client)
      .createEscrow(freelancer.address, amount);
  }

  async function fundProject() {
    await createProject();

    await escrow.connect(client).fundEscrow(1, {
      value: amount
    });
  }

  async function moveToSubmitted() {
    await fundProject();
    await escrow.connect(freelancer).startWork(1);
    await escrow.connect(freelancer).submitWork(1);
  }

  it("creates an escrow", async function () {
    await expect(
      escrow.connect(client).createEscrow(
        freelancer.address,
        amount
      )
    ).to.emit(escrow, "EscrowCreated");

    const details = await escrow.getEscrowDetails(1);

    expect(details.client).to.equal(client.address);
    expect(details.freelancer).to.equal(freelancer.address);
    expect(details.amount).to.equal(amount);
    expect(details.state).to.equal(0);
  });

  it("rejects zero freelancer address", async function () {
    await expect(
      escrow.connect(client).createEscrow(
        ethers.ZeroAddress,
        amount
      )
    ).to.be.revertedWith("Invalid freelancer address");
  });

  it("rejects zero amount", async function () {
    await expect(
      escrow.connect(client).createEscrow(
        freelancer.address,
        0
      )
    ).to.be.revertedWith("Amount must be greater than zero");
  });

  it("accepts the exact funding amount", async function () {
    await createProject();

    await expect(
      escrow.connect(client).fundEscrow(1, {
        value: amount
      })
    ).to.emit(escrow, "FundsDeposited");

    expect(await escrow.getContractBalance()).to.equal(amount);
  });

  it("rejects incorrect funding amount", async function () {
    await createProject();

    await expect(
      escrow.connect(client).fundEscrow(1, {
        value: ethers.parseEther("0.5")
      })
    ).to.be.revertedWith("Incorrect funding amount");
  });

  it("allows freelancer to start work", async function () {
    await fundProject();

    await escrow.connect(freelancer).startWork(1);

    const details = await escrow.getEscrowDetails(1);
    expect(details.state).to.equal(2);
  });

  it("rejects unauthorized work start", async function () {
    await fundProject();

    await expect(
      escrow.connect(attacker).startWork(1)
    ).to.be.revertedWith("Only freelancer can call");
  });

  it("allows freelancer to submit work", async function () {
    await fundProject();
    await escrow.connect(freelancer).startWork(1);

    await expect(
      escrow.connect(freelancer).submitWork(1)
    ).to.emit(escrow, "WorkSubmitted");

    const details = await escrow.getEscrowDetails(1);
    expect(details.state).to.equal(3);
  });

  it("releases payment to freelancer", async function () {
    await moveToSubmitted();

    const before = await ethers.provider.getBalance(
      freelancer.address
    );

    const tx = await escrow
      .connect(client)
      .approveAndReleasePayment(1);

    await tx.wait();

    const after = await ethers.provider.getBalance(
      freelancer.address
    );

    expect(after - before).to.equal(amount);

    const details = await escrow.getEscrowDetails(1);
    expect(details.state).to.equal(4);
    expect(details.amount).to.equal(0);
    expect(await escrow.getContractBalance()).to.equal(0);
  });

  it("prevents releasing payment twice", async function () {
    await moveToSubmitted();

    await escrow
      .connect(client)
      .approveAndReleasePayment(1);

    await expect(
      escrow
        .connect(client)
        .approveAndReleasePayment(1)
    ).to.be.revertedWith("Work has not been submitted");
  });

  it("allows client to cancel funded escrow and receive refund", async function () {
    await fundProject();

    const before = await ethers.provider.getBalance(
      client.address
    );

    const tx = await escrow
      .connect(client)
      .cancelAndRefund(1);

    const receipt = await tx.wait();

    const gasPrice = receipt.gasPrice ?? receipt.effectiveGasPrice;
    const gasCost = receipt.gasUsed * gasPrice;

    const after = await ethers.provider.getBalance(
      client.address
    );

    expect(after + gasCost - before).to.equal(amount);

    const details = await escrow.getEscrowDetails(1);
    expect(details.state).to.equal(7);
    expect(details.amount).to.equal(0);
    expect(await escrow.getContractBalance()).to.equal(0);
  });

  it("rejects unauthorized refund", async function () {
    await fundProject();

    await expect(
      escrow.connect(attacker).cancelAndRefund(1)
    ).to.be.revertedWith("Only client can call");
  });

  it("allows a participant to raise a dispute", async function () {
    await fundProject();
    await escrow.connect(freelancer).startWork(1);

    await expect(
      escrow.connect(client).raiseDispute(1)
    ).to.emit(escrow, "DisputeRaised");

    const details = await escrow.getEscrowDetails(1);
    expect(details.state).to.equal(6);
  });

  it("prevents an outsider from raising a dispute", async function () {
    await fundProject();
    await escrow.connect(freelancer).startWork(1);

    await expect(
      escrow.connect(attacker).raiseDispute(1)
    ).to.be.revertedWith("Not a project participant");
  });

  it("allows arbitrator to release disputed funds to freelancer", async function () {
    await fundProject();
    await escrow.connect(freelancer).startWork(1);
    await escrow.connect(client).raiseDispute(1);

    await expect(
      escrow.connect(arbitrator).resolveDispute(1, true)
    ).to.emit(escrow, "DisputeResolved");

    const details = await escrow.getEscrowDetails(1);
    expect(details.state).to.equal(4);
    expect(details.amount).to.equal(0);
    expect(await escrow.getContractBalance()).to.equal(0);
  });

  it("allows arbitrator to refund disputed funds to client", async function () {
    await fundProject();
    await escrow.connect(freelancer).startWork(1);
    await escrow.connect(client).raiseDispute(1);

    await escrow
      .connect(arbitrator)
      .resolveDispute(1, false);

    const details = await escrow.getEscrowDetails(1);
    expect(details.state).to.equal(7);
    expect(details.amount).to.equal(0);
    expect(await escrow.getContractBalance()).to.equal(0);
  });

  it("rejects unauthorized dispute resolution", async function () {
    await fundProject();
    await escrow.connect(freelancer).startWork(1);
    await escrow.connect(client).raiseDispute(1);

    await expect(
      escrow.connect(attacker).resolveDispute(1, true)
    ).to.be.revertedWith("Only arbitrator can call");
  });
});
