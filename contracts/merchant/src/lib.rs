#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, Map, String};

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
#[repr(u32)]
pub enum MerchantError {
    Unauthorized = 1, InvalidAmount = 2, MerchantNotFound = 3, InactiveMerchant = 4,
    NotInitialized = 5, InvalidCommission = 6, NoBalance = 7,
    AlreadyInitialized = 8,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum DataKey { Admin, NextMerchant, Merchants, Balances }

#[contracttype]
#[derive(Clone, Debug)]
pub struct MerchantProfile { pub id: u64, pub owner: Address, pub name: String, pub settlement: Address, pub commission_bps: u32, pub active: bool }

#[contracttype]
#[derive(Clone, Debug)]
pub struct RegisteredEvent { pub id: u64, pub owner: Address, pub name: String }
#[contracttype]
#[derive(Clone, Debug)]
pub struct SaleRecordedEvent { pub id: u64, pub token: Address, pub amount: i128 }
#[contracttype]
#[derive(Clone, Debug)]
pub struct SettledEvent { pub id: u64, pub token: Address, pub amount: i128, pub commission: i128, pub to: Address }
#[contracttype]
#[derive(Clone, Debug)]
pub struct ProfileUpdatedEvent { pub id: u64 }
#[contracttype]
#[derive(Clone, Debug)]
pub struct ActivatedEvent { pub id: u64, pub active: bool }

#[contract]
pub struct MerchantContract;

#[contractimpl]
impl MerchantContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), MerchantError> {
        if env.storage().instance().has(&DataKey::Admin) { return Err(MerchantError::AlreadyInitialized); }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NextMerchant, &1u64);
        env.storage().instance().set(&DataKey::Merchants, &Map::<u64, MerchantProfile>::new(&env));
        env.storage().instance().set(&DataKey::Balances, &Map::<u64, Map<Address, i128>>::new(&env));
        env.storage().instance().extend_ttl(5000, 5000);
        Ok(())
    }

    pub fn register(env: Env, owner: Address, name: String, settlement: Address, commission_bps: u32) -> Result<u64, MerchantError> {
        if commission_bps > 10_000 { return Err(MerchantError::InvalidCommission); }
        owner.require_auth();
        let mut next: u64 = env.storage().instance().get(&DataKey::NextMerchant).unwrap_or(1);
        let mut merchants: Map<u64, MerchantProfile> = env.storage().instance().get(&DataKey::Merchants).unwrap_or_else(|| Map::new(&env));
        let profile = MerchantProfile { id: next, owner: owner.clone(), name: name.clone(), settlement, commission_bps, active: true };
        merchants.set(next, profile.clone()); next += 1;
        env.storage().instance().set(&DataKey::NextMerchant, &next);
        env.storage().instance().set(&DataKey::Merchants, &merchants);
        env.events().publish((symbol_short!("reg"),), RegisteredEvent { id: profile.id, owner, name });
        Ok(profile.id)
    }

    pub fn update_profile(env: Env, owner: Address, id: u64, name: String, settlement: Address) -> Result<(), MerchantError> {
        let mut merchants: Map<u64, MerchantProfile> = env.storage().instance().get(&DataKey::Merchants).unwrap_or_else(|| Map::new(&env));
        let mut profile = merchants.get(id).ok_or(MerchantError::MerchantNotFound)?;
        if profile.owner != owner { return Err(MerchantError::Unauthorized); }
        owner.require_auth(); profile.name = name; profile.settlement = settlement;
        merchants.set(id, profile); env.storage().instance().set(&DataKey::Merchants, &merchants);
        env.events().publish((symbol_short!("upd"),), ProfileUpdatedEvent { id });
        Ok(())
    }

    pub fn set_commission(env: Env, admin: Address, id: u64, commission_bps: u32) -> Result<(), MerchantError> {
        if commission_bps > 10_000 { return Err(MerchantError::InvalidCommission); }
        Self::require_admin(&env, &admin)?;
        let mut merchants: Map<u64, MerchantProfile> = env.storage().instance().get(&DataKey::Merchants).unwrap_or_else(|| Map::new(&env));
        let mut profile = merchants.get(id).ok_or(MerchantError::MerchantNotFound)?;
        profile.commission_bps = commission_bps; merchants.set(id, profile);
        env.storage().instance().set(&DataKey::Merchants, &merchants);
        Ok(())
    }

    pub fn set_active(env: Env, admin: Address, id: u64, active: bool) -> Result<(), MerchantError> {
        Self::require_admin(&env, &admin)?;
        let mut merchants: Map<u64, MerchantProfile> = env.storage().instance().get(&DataKey::Merchants).unwrap_or_else(|| Map::new(&env));
        let mut profile = merchants.get(id).ok_or(MerchantError::MerchantNotFound)?;
        profile.active = active; merchants.set(id, profile);
        env.storage().instance().set(&DataKey::Merchants, &merchants);
        env.events().publish((symbol_short!("active"),), ActivatedEvent { id, active });
        Ok(())
    }

    /// Record a sale where the caller (payer) sends tokens to the contract.
    /// Tokens are transferred from the payer to the contract, then credited to the
    /// merchant's internal balance. The payer must authorize the token transfer.
    pub fn record_sale(env: Env, payer: Address, id: u64, token: Address, amount: i128) -> Result<(), MerchantError> {
        if amount <= 0 { return Err(MerchantError::InvalidAmount); }
        payer.require_auth();
        let merchants: Map<u64, MerchantProfile> = env.storage().instance().get(&DataKey::Merchants).unwrap_or_else(|| Map::new(&env));
        let profile = merchants.get(id).ok_or(MerchantError::MerchantNotFound)?;
        if !profile.active { return Err(MerchantError::InactiveMerchant); }
        // Transfer tokens from the payer into the contract.
        token::Client::new(&env, &token).transfer(&payer, &env.current_contract_address(), &amount);
        // Credit the merchant's internal balance.
        let mut balances: Map<u64, Map<Address, i128>> = env.storage().instance().get(&DataKey::Balances).unwrap_or_else(|| Map::new(&env));
        let mut by_token = balances.get(id).unwrap_or_else(|| Map::new(&env));
        let current = by_token.get(token.clone()).unwrap_or(0);
        by_token.set(token.clone(), current + amount); balances.set(id, by_token);
        env.storage().instance().set(&DataKey::Balances, &balances);
        env.storage().instance().extend_ttl(5000, 5000);
        env.events().publish((symbol_short!("sale"),), SaleRecordedEvent { id, token, amount });
        Ok(())
    }

    pub fn settle(env: Env, owner: Address, id: u64, token: Address) -> Result<(), MerchantError> {
        let merchants: Map<u64, MerchantProfile> = env.storage().instance().get(&DataKey::Merchants).unwrap_or_else(|| Map::new(&env));
        let profile = merchants.get(id).ok_or(MerchantError::MerchantNotFound)?;
        if profile.owner != owner { return Err(MerchantError::Unauthorized); }
        owner.require_auth();
        let mut balances: Map<u64, Map<Address, i128>> = env.storage().instance().get(&DataKey::Balances).unwrap_or_else(|| Map::new(&env));
        let mut by_token = balances.get(id).unwrap_or_else(|| Map::new(&env));
        let amount = by_token.get(token.clone()).unwrap_or(0);
        if amount <= 0 { return Err(MerchantError::NoBalance); }
        let commission = (amount * profile.commission_bps as i128) / 10_000;
        let net = amount - commission;
        by_token.set(token.clone(), 0); balances.set(id, by_token);
        env.storage().instance().set(&DataKey::Balances, &balances);
        env.storage().instance().extend_ttl(5000, 5000);
        let to = profile.settlement.clone();
        // Safety: verify the contract actually holds enough tokens (defense-in-depth).
        let contract_balance = token::Client::new(&env, &token).balance(&env.current_contract_address());
        if contract_balance < net + commission { return Err(MerchantError::NoBalance); }
        token::Client::new(&env, &token).transfer(&env.current_contract_address(), &to, &net);
        if commission > 0 {
            let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
            token::Client::new(&env, &token).transfer(&env.current_contract_address(), &admin, &commission);
        }
        env.events().publish((symbol_short!("settle"),), SettledEvent { id, token, amount: net, commission, to });
        Ok(())
    }

    pub fn get(env: Env, id: u64) -> Option<MerchantProfile> {
        env.storage().instance().get::<_, Map<u64, MerchantProfile>>(&DataKey::Merchants).and_then(|m| m.get(id))
    }

    pub fn held_balance(env: Env, id: u64, token: Address) -> i128 {
        env.storage().instance().get::<_, Map<u64, Map<Address, i128>>>(&DataKey::Balances).and_then(|b| b.get(id)).and_then(|m| m.get(token)).unwrap_or(0)
    }

    fn require_admin(env: &Env, admin: &Address) -> Result<(), MerchantError> {
        let stored: Address = env.storage().instance().get(&DataKey::Admin).ok_or(MerchantError::NotInitialized)?;
        stored.require_auth();
        if admin != &stored { return Err(MerchantError::Unauthorized); }
        Ok(())
    }
}
