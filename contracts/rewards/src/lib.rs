#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, Map, String, Vec, vec};

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
#[repr(u32)]
pub enum RewardsError {
    Unauthorized = 1, InvalidAmount = 2, TierNotFound = 3, InsufficientPoints = 4,
    InvalidRate = 5, NotInitialized = 6, TierAlreadyExists = 7,
    AlreadyInitialized = 8,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Tier { pub id: u32, pub name: String, pub min_points: u64, pub earn_multiplier: u32, pub reward_rate: i128, pub expiry_seconds: u64, pub active: bool }

#[contracttype]
#[derive(Clone, Debug)]
pub struct AccountPoints { pub lifetime: u64, pub balance: u64, pub current_tier_id: u32 }

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum DataKey { Admin, RewardToken, Tiers, Points(Address), Earners }

#[contracttype]
#[derive(Clone, Debug)]
pub struct TierCreatedEvent { pub id: u32, pub name: String }
#[contracttype]
#[derive(Clone, Debug)]
pub struct TierUpdatedEvent { pub id: u32 }
#[contracttype]
#[derive(Clone, Debug)]
pub struct PointsEarnedEvent { pub account: Address, pub amount: u64, pub new_balance: u64, pub tier_id: u32 }
#[contracttype]
#[derive(Clone, Debug)]
pub struct PointsRedeemedEvent { pub account: Address, pub points: u64, pub reward_amount: i128, pub tier_id: u32 }
#[contracttype]
#[derive(Clone, Debug)]
pub struct TierUpgradedEvent { pub account: Address, pub from_tier: u32, pub to_tier: u32 }
#[contracttype]
#[derive(Clone, Debug)]
pub struct EarnerChangedEvent { pub earner: Address, pub authorized: bool }

#[contract]
pub struct RewardsContract;

#[contractimpl]
impl RewardsContract {
    pub fn initialize(env: Env, admin: Address, reward_token: Address) -> Result<(), RewardsError> {
        if env.storage().instance().has(&DataKey::Admin) { return Err(RewardsError::AlreadyInitialized); }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::RewardToken, &reward_token);
        env.storage().instance().set(&DataKey::Tiers, &Map::<u32, Tier>::new(&env));
        env.storage().instance().set(&DataKey::Earners, &Map::<Address, bool>::new(&env));
        env.storage().instance().extend_ttl(5000, 5000);
        Ok(())
    }

    pub fn create_tier(env: Env, admin: Address, id: u32, name: String, min_points: u64, earn_multiplier: u32, reward_rate: i128, expiry_seconds: u64) -> Result<(), RewardsError> {
        Self::require_admin(&env, &admin)?;
        let mut tiers: Map<u32, Tier> = env.storage().instance().get(&DataKey::Tiers).unwrap_or_else(|| Map::new(&env));
        if tiers.contains_key(id) { return Err(RewardsError::TierAlreadyExists); }
        if earn_multiplier == 0 || reward_rate <= 0 { return Err(RewardsError::InvalidRate); }
        let tier = Tier { id, name: name.clone(), min_points, earn_multiplier, reward_rate, expiry_seconds, active: true };
        tiers.set(id, tier); env.storage().instance().set(&DataKey::Tiers, &tiers);
        env.events().publish((symbol_short!("tier_new"),), TierCreatedEvent { id, name });
        Ok(())
    }

    pub fn update_tier(env: Env, admin: Address, id: u32, min_points: u64, earn_multiplier: u32, reward_rate: i128, expiry_seconds: u64) -> Result<(), RewardsError> {
        Self::require_admin(&env, &admin)?;
        let mut tiers: Map<u32, Tier> = env.storage().instance().get(&DataKey::Tiers).unwrap_or_else(|| Map::new(&env));
        let mut tier = tiers.get(id).ok_or(RewardsError::TierNotFound)?;
        if earn_multiplier == 0 || reward_rate <= 0 { return Err(RewardsError::InvalidRate); }
        tier.min_points = min_points; tier.earn_multiplier = earn_multiplier; tier.reward_rate = reward_rate; tier.expiry_seconds = expiry_seconds;
        tiers.set(id, tier); env.storage().instance().set(&DataKey::Tiers, &tiers);
        env.events().publish((symbol_short!("tier_upd"),), TierUpdatedEvent { id });
        Ok(())
    }

    pub fn set_tier_active(env: Env, admin: Address, id: u32, active: bool) -> Result<(), RewardsError> {
        Self::require_admin(&env, &admin)?;
        let mut tiers: Map<u32, Tier> = env.storage().instance().get(&DataKey::Tiers).unwrap_or_else(|| Map::new(&env));
        let mut tier = tiers.get(id).ok_or(RewardsError::TierNotFound)?;
        tier.active = active; tiers.set(id, tier); env.storage().instance().set(&DataKey::Tiers, &tiers);
        Ok(())
    }

    pub fn set_earner(env: Env, admin: Address, earner: Address, authorized: bool) -> Result<(), RewardsError> {
        Self::require_admin(&env, &admin)?;
        let mut earners: Map<Address, bool> = env.storage().instance().get(&DataKey::Earners).unwrap_or_else(|| Map::new(&env));
        earners.set(earner.clone(), authorized); env.storage().instance().set(&DataKey::Earners, &earners);
        env.events().publish((symbol_short!("earner"),), EarnerChangedEvent { earner, authorized });
        Ok(())
    }

    pub fn set_reward_token(env: Env, admin: Address, token: Address) -> Result<(), RewardsError> {
        Self::require_admin(&env, &admin)?;
        env.storage().instance().set(&DataKey::RewardToken, &token);
        Ok(())
    }

    /// Deposit reward tokens into the contract so they can be claimed via redeem().
    pub fn deposit_rewards(env: Env, from: Address, amount: i128) -> Result<(), RewardsError> {
        if amount <= 0 { return Err(RewardsError::InvalidAmount); }
        from.require_auth();
        let reward_token: Address = env.storage().instance().get(&DataKey::RewardToken).ok_or(RewardsError::NotInitialized)?;
        token::Client::new(&env, &reward_token).transfer(&from, &env.current_contract_address(), &amount);
        env.storage().instance().extend_ttl(5000, 5000);
        Ok(())
    }

    pub fn earn(env: Env, earner: Address, account: Address, base_points: u64) -> Result<(), RewardsError> {
        if base_points == 0 { return Err(RewardsError::InvalidAmount); }
        let earners: Map<Address, bool> = env.storage().instance().get(&DataKey::Earners).unwrap_or_else(|| Map::new(&env));
        if !earners.get(earner.clone()).unwrap_or(false) { return Err(RewardsError::Unauthorized); }
        earner.require_auth();
        let mut points = Self::get_points_internal(&env, &account);
        let tiers: Map<u32, Tier> = env.storage().instance().get(&DataKey::Tiers).unwrap_or_else(|| Map::new(&env));
        let tier = tiers.get(points.current_tier_id).unwrap_or(Tier { id: 0, name: String::from_str(&env, "Base"), min_points: 0, earn_multiplier: 1, reward_rate: 1, expiry_seconds: 0, active: true });
        let earned = base_points * (tier.earn_multiplier as u64);
        points.lifetime += earned; points.balance += earned;
        let mut best_id = points.current_tier_id; let mut best_min = tier.min_points;
        for (tid, t) in tiers.iter() { if t.active && t.min_points <= points.lifetime && t.min_points > best_min { best_id = tid; best_min = t.min_points; } }
        if best_id != points.current_tier_id {
            let from = points.current_tier_id; points.current_tier_id = best_id;
            env.events().publish((symbol_short!("upgrade"),), TierUpgradedEvent { account: account.clone(), from_tier: from, to_tier: best_id });
        }
        env.storage().instance().set(&DataKey::Points(account.clone()), &points);
        env.events().publish((symbol_short!("earn"),), PointsEarnedEvent { account: account.clone(), amount: earned, new_balance: points.balance, tier_id: points.current_tier_id });
        Ok(())
    }

    pub fn redeem(env: Env, customer: Address, points: u64) -> Result<(), RewardsError> {
        if points == 0 { return Err(RewardsError::InvalidAmount); }
        customer.require_auth();
        let mut account_points = Self::get_points_internal(&env, &customer);
        if account_points.balance < points { return Err(RewardsError::InsufficientPoints); }
        let tiers: Map<u32, Tier> = env.storage().instance().get(&DataKey::Tiers).unwrap_or_else(|| Map::new(&env));
        let tier = tiers.get(account_points.current_tier_id).unwrap_or(Tier { id: 0, name: String::from_str(&env, "Base"), min_points: 0, earn_multiplier: 1, reward_rate: 1, expiry_seconds: 0, active: true });
        let reward_amount = (points as i128) * tier.reward_rate;
        let reward_token: Address = env.storage().instance().get(&DataKey::RewardToken).unwrap();
        let contract_balance = token::Client::new(&env, &reward_token).balance(&env.current_contract_address());
        if contract_balance < reward_amount { return Err(RewardsError::InvalidAmount); }
        token::Client::new(&env, &reward_token).transfer(&env.current_contract_address(), &customer, &reward_amount);
        account_points.balance -= points;
        env.storage().instance().set(&DataKey::Points(customer.clone()), &account_points);
        env.events().publish((symbol_short!("redeem"),), PointsRedeemedEvent { account: customer.clone(), points, reward_amount, tier_id: account_points.current_tier_id });
        Ok(())
    }

    pub fn balance(env: Env, account: Address) -> AccountPoints { Self::get_points_internal(&env, &account) }
    pub fn tier(env: Env, id: u32) -> Option<Tier> { env.storage().instance().get::<_, Map<u32, Tier>>(&DataKey::Tiers).and_then(|t| t.get(id)) }
    pub fn tiers(env: Env) -> Vec<Tier> { env.storage().instance().get::<_, Map<u32, Tier>>(&DataKey::Tiers).map(|t| t.values()).unwrap_or_else(|| vec![&env]) }
    pub fn is_earner(env: Env, earner: Address) -> bool { env.storage().instance().get::<_, Map<Address, bool>>(&DataKey::Earners).and_then(|e| e.get(earner)).unwrap_or(false) }
    pub fn reward_token(env: Env) -> Option<Address> { env.storage().instance().get(&DataKey::RewardToken) }

    fn require_admin(env: &Env, admin: &Address) -> Result<(), RewardsError> {
        let stored: Address = env.storage().instance().get(&DataKey::Admin).ok_or(RewardsError::NotInitialized)?;
        stored.require_auth();
        if admin != &stored { return Err(RewardsError::Unauthorized); }
        Ok(())
    }

    fn get_points_internal(env: &Env, account: &Address) -> AccountPoints {
        env.storage().instance().get(&DataKey::Points(account.clone())).unwrap_or(AccountPoints { lifetime: 0, balance: 0, current_tier_id: 1 })
    }
}

#[cfg(test)]
mod test;
