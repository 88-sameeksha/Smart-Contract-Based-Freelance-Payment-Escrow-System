const hre = require("hardhat");

async function main() {
  const [deployer, , arbitrator] = await hre.ethers.getSigners();

  const arbitratorAddress = arbitrator
    ? arbitrator.address
    : deployer.address;

  console.log("Deploying with:", deployer.address);
  console.log("Arbitrator:", arbitratorAddress);

  const FreelanceEscrow = await hre.ethers.getContractFactory(
    "FreelanceEscrow"
  );

  const escrow = await FreelanceEscrow.deploy(arbitratorAddress);
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();

  console.log("FreelanceEscrow deployed to:", address);
  console.log("Network:", hre.network.name);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
