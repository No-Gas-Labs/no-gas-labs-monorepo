# No_Gas_Labs™ Smart Contract Documentation

## Overview
This document provides detailed documentation for the smart contracts used in No_Gas_Labs™ RPG platform and No_Gas_Slaps™ Telegram mini-app. These contracts enable gasless NFT minting and token distribution on the TON blockchain.

## Contract Architecture

### 1. NogasLabsNFTCollection Contract
- **Language**: Tact
- **Standard**: TON NFT Standard
- **Function**: Manage NFT relics collection
- **Features**: Minting, ownership tracking, metadata storage, royalty distribution

### 2. RelicToken Contract
- **Language**: Tact
- **Standard**: TON Jetton Standard
- **Function**: Manage RELIC token economy
- **Features**: Token balances, transfers, vesting schedules, earnings tracking

### 3. RelayService Contract
- **Language**: Tact
- **Function**: Enable gasless transactions
- **Features**: Fee payment, transaction validation, rate limiting, refund handling

## NogasLabsNFTCollection Contract

### Contract Initialization
```tact
init(owner: Address, royaltyAddress: Address, collectionContent: Cell, commonItemContent: Cell, nftItemCode: Cell)
```

Parameters:
- `owner`: Address of the contract owner (relay service)
- `royaltyAddress`: Address to receive royalty payments
- `collectionContent`: Collection metadata
- `commonItemContent`: Common NFT item metadata
- `nftItemCode`: Code for individual NFT items

### Key Functions

#### mintNFT
```tact
mintNFT(user: Address, metadata: Cell)
```
Mints a new NFT relic and assigns it to the user's wallet.

Parameters:
- `user`: Address of the user receiving the NFT
- `metadata`: Cell containing NFT metadata

#### getNFTMetadata
```tact
getNFTMetadata(index: Int as uint64): Cell
```
Retrieves the metadata for a specific NFT by its index.

Parameters:
- `index`: Unique identifier for the NFT

#### getUserNFTs
```tact
getUserNFTs(user: Address): list<Int as uint64>
```
Returns a list of NFT indices owned by a specific user.

Parameters:
- `user`: Address of the user

#### getRoyaltyParams
```tact
getRoyaltyParams(): (Int as uint16, Int as uint16, Address)
```
Returns the royalty parameters for the collection.

Returns:
- `royaltyBase`: Royalty percentage in basis points
- `royaltyFactor`: Royalty calculation factor
- `royaltyAddress`: Address receiving royalties

#### getCollectionData
```tact
getCollectionData(): (Int as uint64, Cell, Address)
```
Returns general collection data.

Returns:
- `nextItemIndex`: Next available NFT index
- `collectionContent`: Collection metadata
- `owner`: Collection owner address

### Contract Storage
- `owner`: Address of the contract owner
- `nextItemIndex`: Counter for next NFT index
- `collectionContent`: Collection metadata cell
- `commonItemContent`: Common item metadata cell
- `nftItemCode`: Code for NFT items
- `royaltyBase`: Base royalty percentage
- `royaltyFactor`: Royalty calculation factor
- `royaltyAddress`: Address for royalty payments
- `nftMetadata`: Map of NFT indices to metadata
- `userNFTs`: Map of user addresses to their NFT lists

## RelicToken Contract

### Contract Initialization
```tact
init(owner: Address, tokenData: Cell)
```

Parameters:
- `owner`: Address of the contract owner (relay service)
- `tokenData`: Cell containing token metadata

### Key Functions

#### distributeTokens
```tact
distributeTokens(user: Address, amount: Int as uint64, source: Slice)
```
Distributes RELIC tokens to a user's wallet.

Parameters:
- `user`: Address of the user receiving tokens
- `amount`: Number of tokens to distribute
- `source`: Source identifier for the distribution

#### createVestingSchedule
```tact
createVestingSchedule(user: Address, amount: Int as uint64, duration: Int as uint64)
```
Creates a vesting schedule for token distribution.

Parameters:
- `user`: Address of the user
- `amount`: Number of tokens in the vesting schedule
- `duration`: Vesting period in seconds

#### claimVestedTokens
```tact
claimVestedTokens(user: Address)
```
Allows a user to claim tokens that have vested.

Parameters:
- `user`: Address of the user claiming tokens

#### getBalance
```tact
getBalance(user: Address): Int as uint64
```
Returns the token balance for a user.

Parameters:
- `user`: Address of the user

#### getUserEarnings
```tact
getUserEarnings(user: Address): map<Slice, Int as uint64>
```
Returns a map of user earnings by source.

Parameters:
- `user`: Address of the user

#### getVestingSchedules
```tact
getVestingSchedules(user: Address): list<VestingInfo>
```
Returns a user's vesting schedules.

Parameters:
- `user`: Address of the user

#### getTokenData
```tact
getTokenData(): (Int as uint64, Int as uint64, Int as uint64, Cell, Address)
```
Returns general token data.

Returns:
- `totalSupply`: Total token supply
- `mintableSupply`: Mintable token supply
- `owner`: Token contract owner
- `tokenData`: Token metadata
- `content`: Token content cell

### VestingInfo Structure
```tact
struct VestingInfo {
    amount: Int as uint64;
    startTime: Int as uint64;
    endTime: Int as uint64;
    claimed: Int as uint64;
}
```

### Contract Storage
- `owner`: Address of the contract owner
- `totalSupply`: Total number of tokens in circulation
- `tokenData`: Cell containing token metadata
- `balances`: Map of user addresses to token balances
- `allowances`: Map of allowances for token transfers
- `userEarnings`: Map of user earnings by source
- `vestingSchedules`: Map of user addresses to vesting schedules

## RelayService Contract

### Contract Initialization
```tact
init(owner: Address, feeCollector: Address)
```

Parameters:
- `owner`: Address of the contract owner
- `feeCollector`: Address that collects transaction fees

### Key Functions

#### executeGaslessTransaction
```tact
executeGaslessTransaction(user: Address, transaction: Cell)
```
Executes a gasless transaction on behalf of a user.

Parameters:
- `user`: Address of the user initiating the transaction
- `transaction`: Cell containing transaction data

#### registerUserWallet
```tact
registerUserWallet(user: Address, wallet: Address)
```
Registers a user's wallet address with the relay service.

Parameters:
- `user`: Address of the user
- `wallet`: Address of the user's wallet

#### getUserWallet
```tact
getUserWallet(user: Address): Address
```
Returns a user's registered wallet address.

Parameters:
- `user`: Address of the user

#### getTransactionCount
```tact
getTransactionCount(user: Address): Int as uint64
```
Returns the number of transactions executed for a user.

Parameters:
- `user`: Address of the user

#### requestRefund
```tact
requestRefund(user: Address, amount: Int as uint64)
```
Requests a refund for a user.

Parameters:
- `user`: Address of the user
- `amount`: Amount to refund

#### getRefunds
```tact
getRefunds(user: Address): list<Int as uint64>
```
Returns a user's refund requests.

Parameters:
- `user`: Address of the user

### Contract Storage
- `owner`: Address of the contract owner
- `feeCollector`: Address that collects transaction fees
- `transactionFee`: Fee charged per transaction
- `maxTransactionsPerUser`: Maximum transactions allowed per user
- `transactionCount`: Map of user addresses to transaction counts
- `userWallets`: Map of user addresses to wallet addresses
- `refunds`: Map of user addresses to refund lists

## Deployment Addresses
- **NFT Collection Contract**: Deployed at `EQD...nft_collection_address`
- **RELIC Token Contract**: Deployed at `EQD...relic_token_address`
- **Relay Service Contract**: Deployed at `EQD...relay_service_address`

## Security Considerations
1. Only contract owners can mint NFTs or distribute tokens
2. Transaction limits prevent spamming
3. Secure key management for relay service
4. Input validation on all functions
5. Rate limiting for transaction execution

## Integration with Platforms
1. **Frontend Integration**:
   - Use TON JavaScript SDK to interact with contracts
   - Implement wallet connection through Telegram Web App SDK
   - Display NFT and token data in user profiles

2. **Backend Integration**:
   - API endpoints to trigger contract interactions
   - Database storage of transaction hashes and user data
   - Relay service coordination for gasless transactions

## Contract Upgradeability
- Contracts are designed with upgradeability in mind
- Owner can update contract code through governance mechanisms
- Storage layout is maintained during upgrades
- Users retain their NFTs and token balances during upgrades

## Testing and Validation
- Unit tests for all contract functions
- Integration tests with frontend and backend
- Security audits for critical functions
- Testnet deployment before mainnet launch

## Monitoring and Maintenance
- Contract state monitoring
- Transaction volume tracking
- Error rate monitoring
- Regular security reviews
- Performance optimization