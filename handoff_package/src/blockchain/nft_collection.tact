// NFT Collection Contract for No_Gas_Labs™ & No_Gas_Slaps™
// Using Tact language for TON blockchain

import "@stdlib/deploy";
import "@stdlib/ownable";

contract NogasLabsNFTCollection with Deploy, Ownable {
    // Contract state
    owner: Address;
    nextItemIndex: Int as uint64 = 0;
    collectionContent: Cell;
    commonItemContent: Cell;
    nftItemCode: Cell;
    
    // Royalty parameters
    royaltyBase: Int as uint16 = 100; // 100 basis points = 1%
    royaltyFactor: Int as uint16 = 10000; // 10000 basis points = 100%
    royaltyAddress: Address;
    
    // NFT metadata storage
    nftMetadata: map<Int as uint64, Cell>;
    
    // User NFT ownership tracking
    userNFTs: map<Address, list<Int as uint64>>;
    
    // Contract initialization
    init(owner: Address, royaltyAddress: Address, collectionContent: Cell, commonItemContent: Cell, nftItemCode: Cell) {
        self.owner = owner;
        self.royaltyAddress = royaltyAddress;
        self.collectionContent = collectionContent;
        self.commonItemContent = commonItemContent;
        self.nftItemCode = nftItemCode;
    }
    
    // Mint a new NFT
    mintNFT(user: Address, metadata: Cell) {
        // Only owner can mint NFTs (in practice, this would be called by relay service)
        require(self.owner == sender(), "Only owner can mint NFTs");
        
        // Store metadata
        self.nftMetadata[nextItemIndex] = metadata;
        
        // Track user ownership
        let userNFTList = self.userNFTs.get(user);
        userNFTList.push(nextItemIndex);
        self.userNFTs.set(user, userNFTList);
        
        // Increment index for next NFT
        nextItemIndex = nextItemIndex + 1;
    }
    
    // Get NFT metadata
    getNFTMetadata(index: Int as uint64): Cell {
        return self.nftMetadata.get(index);
    }
    
    // Get user's NFTs
    getUserNFTs(user: Address): list<Int as uint64> {
        return self.userNFTs.get(user);
    }
    
    // Get royalty parameters
    getRoyaltyParams(): (Int as uint16, Int as uint16, Address) {
        return (royaltyBase, royaltyFactor, royaltyAddress);
    }
    
    // Get collection data
    getCollectionData(): (Int as uint64, Cell, Address) {
        return (nextItemIndex, collectionContent, owner);
    }
}