// RELIC Token Contract for No_Gas_Labs™ & No_Gas_Slaps™
// Using Tact language for TON blockchain

import "@stdlib/deploy";
import "@stdlib/ownable";

contract RelicToken with Deploy, Ownable {
    // Contract state
    owner: Address;
    totalSupply: Int as uint64 = 0;
    tokenData: Cell;
    
    // User balances
    balances: map<Address, Int as uint64>;
    
    // Allowances for token transfers
    allowances: map<Address, map<Address, Int as uint64>>;
    
    // Token distribution tracking
    userEarnings: map<Address, map<Slice, Int as uint64>>;
    
    // Vesting schedules
    vestingSchedules: map<Address, list<VestingInfo>>;
    
    // Vesting information structure
    struct VestingInfo {
        amount: Int as uint64;
        startTime: Int as uint64;
        endTime: Int as uint64;
        claimed: Int as uint64;
    }
    
    // Contract initialization
    init(owner: Address, tokenData: Cell) {
        self.owner = owner;
        self.tokenData = tokenData;
    }
    
    // Distribute tokens to user
    distributeTokens(user: Address, amount: Int as uint64, source: Slice) {
        // Only owner can distribute tokens (in practice, this would be called by relay service)
        require(self.owner == sender(), "Only owner can distribute tokens");
        
        // Update user balance
        let currentBalance = self.balances.get(user);
        self.balances.set(user, currentBalance + amount);
        
        // Update total supply
        totalSupply = totalSupply + amount;
        
        // Track earnings by source
        let userEarningsMap = self.userEarnings.get(user);
        let currentEarnings = userEarningsMap.get(source);
        userEarningsMap.set(source, currentEarnings + amount);
        self.userEarnings.set(user, userEarningsMap);
    }
    
    // Create vesting schedule for user
    createVestingSchedule(user: Address, amount: Int as uint64, duration: Int as uint64) {
        // Only owner can create vesting schedules
        require(self.owner == sender(), "Only owner can create vesting schedules");
        
        // Get current time
        let currentTime = now();
        
        // Create vesting info
        let vestingInfo: VestingInfo = VestingInfo {
            amount: amount,
            startTime: currentTime,
            endTime: currentTime + duration,
            claimed: 0
        };
        
        // Add to user's vesting schedules
        let userSchedules = self.vestingSchedules.get(user);
        userSchedules.push(vestingInfo);
        self.vestingSchedules.set(user, userSchedules);
    }
    
    // Claim vested tokens
    claimVestedTokens(user: Address) {
        let userSchedules = self.vestingSchedules.get(user);
        let currentTime = now();
        let totalClaimable = 0;
        
        // Calculate claimable amount from all schedules
        for (let i = 0; i < userSchedules.length; i++) {
            let schedule = userSchedules[i];
            if (schedule.claimed < schedule.amount) {
                let claimable = 0;
                if (currentTime >= schedule.endTime) {
                    // Fully vested
                    claimable = schedule.amount - schedule.claimed;
                } else if (currentTime > schedule.startTime) {
                    // Partially vested
                    let elapsed = currentTime - schedule.startTime;
                    let totalDuration = schedule.endTime - schedule.startTime;
                    let vestedAmount = (schedule.amount * elapsed) / totalDuration;
                    claimable = vestedAmount - schedule.claimed;
                }
                
                if (claimable > 0) {
                    totalClaimable = totalClaimable + claimable;
                    schedule.claimed = schedule.claimed + claimable;
                    userSchedules[i] = schedule;
                }
            }
        }
        
        // Update schedules
        self.vestingSchedules.set(user, userSchedules);
        
        // Update user balance
        if (totalClaimable > 0) {
            let currentBalance = self.balances.get(user);
            self.balances.set(user, currentBalance + totalClaimable);
        }
    }
    
    // Get user balance
    getBalance(user: Address): Int as uint64 {
        return self.balances.get(user);
    }
    
    // Get user earnings by source
    getUserEarnings(user: Address): map<Slice, Int as uint64> {
        return self.userEarnings.get(user);
    }
    
    // Get user's vesting schedules
    getVestingSchedules(user: Address): list<VestingInfo> {
        return self.vestingSchedules.get(user);
    }
    
    // Get token data
    getTokenData(): (Int as uint64, Int as uint64, Int as uint64, Cell, Address) {
        return (totalSupply, 0, 0, tokenData, owner);
    }
}