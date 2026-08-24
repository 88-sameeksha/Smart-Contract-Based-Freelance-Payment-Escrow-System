import { useState } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  getContract,
  getWallet
} from "./contract";

const STATES = [
  "CREATED",
  "FUNDED",
  "IN_PROGRESS",
  "SUBMITTED",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
  "REFUNDED"
];

function short(address) {
  if (!address) return "-";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function App() {
  const [account, setAccount] = useState("");
  const [status, setStatus] = useState("Connect MetaMask to begin.");
  const [projectId, setProjectId] = useState("1");
  const [freelancer, setFreelancer] = useState("");
  const [amount, setAmount] = useState("1");
  const [details, setDetails] = useState(null);
  const [balance, setBalance] = useState("0");

  async function connect() {
    try {
      const wallet = await getWallet();
      setAccount(wallet.address);
      setStatus(`Connected: ${wallet.address}`);
    } catch (error) {
      setStatus(error.shortMessage || error.message);
    }
  }

  async function withContract(action, successMessage) {
    try {
      const { signer } = await getWallet();
      setAccount(await signer.getAddress());
      const contract = getContract(signer);
      const tx = await action(contract);
      setStatus(`Transaction submitted: ${tx.hash}`);
      await tx.wait();
      setStatus(successMessage);
    } catch (error) {
      setStatus(error.shortMessage || error.message);
    }
  }

  async function createEscrow() {
    if (!ethers.isAddress(freelancer)) {
      setStatus("Enter a valid freelancer wallet address.");
      return;
    }

    await withContract(
      (contract) =>
        contract.createEscrow(
          freelancer,
          ethers.parseEther(amount)
        ),
      "Escrow created."
    );
  }

  async function fundEscrow() {
    await withContract(
      (contract) =>
        contract.fundEscrow(projectId, {
          value: ethers.parseEther(amount)
        }),
      "Escrow funded."
    );
  }

  async function startWork() {
    await withContract(
      (contract) => contract.startWork(projectId),
      "Work started."
    );
  }

  async function submitWork() {
    await withContract(
      (contract) => contract.submitWork(projectId),
      "Work submitted."
    );
  }

  async function approve() {
    await withContract(
      (contract) =>
        contract.approveAndReleasePayment(projectId),
      "Payment released."
    );
  }

  async function refund() {
    await withContract(
      (contract) => contract.cancelAndRefund(projectId),
      "Refund issued."
    );
  }

  async function dispute() {
    await withContract(
      (contract) => contract.raiseDispute(projectId),
      "Dispute raised."
    );
  }

  async function loadDetails() {
    try {
      const { provider } = await getWallet();
      setAccount(await provider.getSigner().then((s) => s.getAddress()));

      const contract = getContract(provider);
      const result = await contract.getEscrowDetails(projectId);
      const contractBalance = await contract.getContractBalance();

      setDetails({
        id: result[0].toString(),
        client: result[1],
        freelancer: result[2],
        amount: ethers.formatEther(result[3]),
        state: STATES[Number(result[4])],
        createdAt: new Date(
          Number(result[5]) * 1000
        ).toLocaleString()
      });

      setBalance(ethers.formatEther(contractBalance));
      setStatus("Escrow details loaded.");
    } catch (error) {
      setStatus(error.shortMessage || error.message);
    }
  }

  return (
    <main className="container">
      <header className="hero">
        <div>
          <p className="eyebrow">WEB3 PROJECT</p>
          <h1>Freelance Payment Escrow</h1>
          <p>
            A Solidity smart contract that locks client funds and
            releases, refunds, or resolves them according to project
            state.
          </p>
        </div>
        <button onClick={connect}>
          {account ? short(account) : "Connect Wallet"}
        </button>
      </header>

      <section className="notice">
        <strong>Contract:</strong>{" "}
        {CONTRACT_ADDRESS || "Not configured"}
        <br />
        <span>{status}</span>
      </section>

      <section className="grid">
        <div className="card">
          <h2>Create Escrow</h2>
          <label>Freelancer address</label>
          <input
            value={freelancer}
            onChange={(e) => setFreelancer(e.target.value)}
            placeholder="0x..."
          />

          <label>Amount (ETH)</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1"
          />

          <button onClick={createEscrow}>Create Escrow</button>
        </div>

        <div className="card">
          <h2>Escrow Actions</h2>
          <label>Project ID</label>
          <input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          />

          <div className="button-grid">
            <button onClick={fundEscrow}>Fund</button>
            <button onClick={startWork}>Start Work</button>
            <button onClick={submitWork}>Submit Work</button>
            <button onClick={approve}>Approve & Release</button>
            <button onClick={refund}>Cancel & Refund</button>
            <button onClick={dispute}>Raise Dispute</button>
          </div>

          <button className="secondary" onClick={loadDetails}>
            Load Details
          </button>
        </div>
      </section>

      <section className="dashboard">
        <h2>Project Dashboard</h2>

        {details ? (
          <div className="details">
            <div><span>Project</span><strong>#{details.id}</strong></div>
            <div><span>Client</span><strong>{short(details.client)}</strong></div>
            <div><span>Freelancer</span><strong>{short(details.freelancer)}</strong></div>
            <div><span>Amount</span><strong>{details.amount} ETH</strong></div>
            <div><span>Status</span><strong>{details.state}</strong></div>
            <div><span>Created</span><strong>{details.createdAt}</strong></div>
            <div><span>Contract Balance</span><strong>{balance} ETH</strong></div>
          </div>
        ) : (
          <p>No project loaded yet.</p>
        )}
      </section>

      <footer>
        Educational project — use Remix VM or a local Hardhat network
        for testing without real cryptocurrency.
      </footer>
    </main>
  );
}
