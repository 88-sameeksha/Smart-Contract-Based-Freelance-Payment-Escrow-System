// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FreelanceEscrow
 * @notice Educational freelance payment escrow smart contract.
 * @dev Holds ETH until work is approved, refunded, or resolved by an arbitrator.
 */
contract FreelanceEscrow {
    enum EscrowState {
        CREATED,
        FUNDED,
        IN_PROGRESS,
        SUBMITTED,
        COMPLETED,
        CANCELLED,
        DISPUTED,
        REFUNDED
    }

    struct Escrow {
        uint256 projectId;
        address payable client;
        address payable freelancer;
        uint256 amount;
        EscrowState state;
        uint256 createdAt;
    }

    uint256 private nextProjectId = 1;
    address public immutable arbitrator;
    mapping(uint256 => Escrow) private escrows;
    bool private locked;

    event EscrowCreated(
        uint256 indexed projectId,
        address indexed client,
        address indexed freelancer,
        uint256 amount
    );

    event FundsDeposited(uint256 indexed projectId, uint256 amount);
    event WorkStarted(uint256 indexed projectId);
    event WorkSubmitted(uint256 indexed projectId);

    event PaymentReleased(
        uint256 indexed projectId,
        address indexed freelancer,
        uint256 amount
    );

    event RefundIssued(
        uint256 indexed projectId,
        address indexed client,
        uint256 amount
    );

    event DisputeRaised(uint256 indexed projectId, address indexed raisedBy);
    event DisputeResolved(uint256 indexed projectId, bool releasedToFreelancer);

    modifier nonReentrant() {
        require(!locked, "Reentrancy detected");
        locked = true;
        _;
        locked = false;
    }

    modifier validProject(uint256 projectId) {
        require(projectId > 0 && projectId < nextProjectId, "Invalid project ID");
        _;
    }

    modifier onlyClient(uint256 projectId) {
        require(msg.sender == escrows[projectId].client, "Only client can call");
        _;
    }

    modifier onlyFreelancer(uint256 projectId) {
        require(
            msg.sender == escrows[projectId].freelancer,
            "Only freelancer can call"
        );
        _;
    }

    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "Only arbitrator can call");
        _;
    }

    constructor(address _arbitrator) {
        require(_arbitrator != address(0), "Invalid arbitrator address");
        arbitrator = _arbitrator;
    }

    function createEscrow(
        address payable freelancer,
        uint256 amount
    ) external returns (uint256) {
        require(freelancer != address(0), "Invalid freelancer address");
        require(freelancer != msg.sender, "Client and freelancer must differ");
        require(amount > 0, "Amount must be greater than zero");

        uint256 projectId = nextProjectId;

        escrows[projectId] = Escrow({
            projectId: projectId,
            client: payable(msg.sender),
            freelancer: freelancer,
            amount: amount,
            state: EscrowState.CREATED,
            createdAt: block.timestamp
        });

        nextProjectId++;

        emit EscrowCreated(projectId, msg.sender, freelancer, amount);
        return projectId;
    }

    function fundEscrow(
        uint256 projectId
    )
        external
        payable
        validProject(projectId)
        onlyClient(projectId)
        nonReentrant
    {
        Escrow storage escrow = escrows[projectId];

        require(
            escrow.state == EscrowState.CREATED,
            "Escrow is not awaiting funding"
        );
        require(msg.value == escrow.amount, "Incorrect funding amount");

        escrow.state = EscrowState.FUNDED;
        emit FundsDeposited(projectId, msg.value);
    }

    function startWork(
        uint256 projectId
    )
        external
        validProject(projectId)
        onlyFreelancer(projectId)
    {
        Escrow storage escrow = escrows[projectId];
        require(escrow.state == EscrowState.FUNDED, "Escrow must be funded");

        escrow.state = EscrowState.IN_PROGRESS;
        emit WorkStarted(projectId);
    }

    function submitWork(
        uint256 projectId
    )
        external
        validProject(projectId)
        onlyFreelancer(projectId)
    {
        Escrow storage escrow = escrows[projectId];
        require(
            escrow.state == EscrowState.IN_PROGRESS,
            "Work is not in progress"
        );

        escrow.state = EscrowState.SUBMITTED;
        emit WorkSubmitted(projectId);
    }

    function approveAndReleasePayment(
        uint256 projectId
    )
        external
        validProject(projectId)
        onlyClient(projectId)
        nonReentrant
    {
        Escrow storage escrow = escrows[projectId];
        require(
            escrow.state == EscrowState.SUBMITTED,
            "Work has not been submitted"
        );

        uint256 payment = escrow.amount;
        escrow.amount = 0;
        escrow.state = EscrowState.COMPLETED;

        (bool success, ) = escrow.freelancer.call{value: payment}("");
        require(success, "Payment transfer failed");

        emit PaymentReleased(projectId, escrow.freelancer, payment);
    }

    function cancelAndRefund(
        uint256 projectId
    )
        external
        validProject(projectId)
        onlyClient(projectId)
        nonReentrant
    {
        Escrow storage escrow = escrows[projectId];
        require(
            escrow.state == EscrowState.FUNDED,
            "Cannot cancel at this stage"
        );

        uint256 refund = escrow.amount;
        escrow.amount = 0;
        escrow.state = EscrowState.REFUNDED;

        (bool success, ) = escrow.client.call{value: refund}("");
        require(success, "Refund transfer failed");

        emit RefundIssued(projectId, escrow.client, refund);
    }

    function raiseDispute(uint256 projectId)
        external
        validProject(projectId)
    {
        Escrow storage escrow = escrows[projectId];

        require(
            msg.sender == escrow.client || msg.sender == escrow.freelancer,
            "Not a project participant"
        );

        require(
            escrow.state == EscrowState.IN_PROGRESS ||
                escrow.state == EscrowState.SUBMITTED,
            "Dispute cannot be raised now"
        );

        escrow.state = EscrowState.DISPUTED;
        emit DisputeRaised(projectId, msg.sender);
    }

    function resolveDispute(
        uint256 projectId,
        bool releaseToFreelancer
    )
        external
        validProject(projectId)
        onlyArbitrator
        nonReentrant
    {
        Escrow storage escrow = escrows[projectId];
        require(escrow.state == EscrowState.DISPUTED, "Escrow is not disputed");

        uint256 amount = escrow.amount;
        escrow.amount = 0;

        if (releaseToFreelancer) {
            escrow.state = EscrowState.COMPLETED;

            (bool success, ) = escrow.freelancer.call{value: amount}("");
            require(success, "Payment transfer failed");
        } else {
            escrow.state = EscrowState.REFUNDED;

            (bool success, ) = escrow.client.call{value: amount}("");
            require(success, "Refund transfer failed");
        }

        emit DisputeResolved(projectId, releaseToFreelancer);
    }

    function getEscrowDetails(uint256 projectId)
        external
        view
        validProject(projectId)
        returns (
            uint256 id,
            address client,
            address freelancer,
            uint256 amount,
            EscrowState state,
            uint256 createdAt
        )
    {
        Escrow memory escrow = escrows[projectId];

        return (
            escrow.projectId,
            escrow.client,
            escrow.freelancer,
            escrow.amount,
            escrow.state,
            escrow.createdAt
        );
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getNextProjectId() external view returns (uint256) {
        return nextProjectId;
    }

    receive() external payable {
        revert("Use fundEscrow");
    }

    fallback() external payable {
        revert("Invalid function");
    }
}
