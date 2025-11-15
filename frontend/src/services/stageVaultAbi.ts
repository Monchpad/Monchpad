export const STAGE_VAULT_ABI = [
  "function deposit(uint256 amount) external",
  "function claimAllocation(address recipient) external",
  "function refundExcess(address recipient) external",
  "function recordAllocations(address[] users, uint256[] allocationAmounts) external",
  "function getDepositInfo(address user) external view returns (tuple(uint256 deposited,uint256 allocation,uint256 claimedAllocation,bool excessRefunded))",
  "function allocator() external view returns (address)",
  "function depositWindowClose() external view returns (uint64)"
];

