import { ethers } from "ethers";

export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS || "";

export const ESCROW_ABI = [
  "function createEscrow(address freelancer,uint256 amount) returns (uint256)",
  "function fundEscrow(uint256 projectId) payable",
  "function startWork(uint256 projectId)",
  "function submitWork(uint256 projectId)",
  "function approveAndReleasePayment(uint256 projectId)",
  "function cancelAndRefund(uint256 projectId)",
  "function raiseDispute(uint256 projectId)",
  "function resolveDispute(uint256 projectId,bool releaseToFreelancer)",
  "function getEscrowDetails(uint256 projectId) view returns (uint256,address,address,uint256,uint8,uint256)",
  "function getContractBalance() view returns (uint256)",
  "function getNextProjectId() view returns (uint256)",
  "event EscrowCreated(uint256 indexed projectId,address indexed client,address indexed freelancer,uint256 amount)",
  "event FundsDeposited(uint256 indexed projectId,uint256 amount)",
  "event WorkStarted(uint256 indexed projectId)",
  "event WorkSubmitted(uint256 indexed projectId)",
  "event PaymentReleased(uint256 indexed projectId,address indexed freelancer,uint256 amount)",
  "event RefundIssued(uint256 indexed projectId,address indexed client,uint256 amount)",
  "event DisputeRaised(uint256 indexed projectId,address indexed raisedBy)",
  "event DisputeResolved(uint256 indexed projectId,bool releasedToFreelancer)"
];

export async function getWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  return {
    provider,
    signer,
    address: accounts[0]
  };
}

export function getContract(signerOrProvider) {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "Set VITE_CONTRACT_ADDRESS in frontend/.env.local first."
    );
  }

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    ESCROW_ABI,
    signerOrProvider
  );
}
