#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env};

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
#[repr(u32)]
pub enum TreasuryError {
    Unauthorized = 1, InvalidAmount = 2, TokenNotAllowed = 3, NotInitialized = 4, WithdrawalCapped = 5,
    AlreadyInitialized = 6,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum DataKey { Admin, Allowed(Address), MaxWithdrawal(Address), DailyCap(Address) }

#[contracttype]
#[derive(Clone, Debug)]
pub struct DepositedEvent { pub token: Address, pub from: Address, pub amount: i128 }
#[contracttype]
#[derive(Clone, Debug)]
pub struct WithdrawnEvent { pub token: Address, pub to: Address, pub amount: i128, pub by: Address }
#[contracttype]
#[derive(Clone, Debug)]
pub struct TokenAllowanceEvent { pub token: Address, pub allowed: bool, pub by: Address }
#[contracttype]
#[derive(Clone, Debug)]
pub struct CapsChangedEvent { pub by: Address }

#[contract]
pub struct TreasuryContract;

#[contractimpl]
impl TreasuryContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), TreasuryError> {
        if env.storage().instance().has(&DataKey::Admin) { return Err(TreasuryError::AlreadyInitialized); }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().extend_ttl(5000, 5000);
        Ok(())
    }

    pub fn set_allowed(env: Env, admin: Address, token: Address, allowed: bool) -> Result<(), TreasuryError> {
        Self::require_admin(&env, &admin)?;
        env.storage().instance().set(&DataKey::Allowed(token.clone()), &allowed);
        env.storage().instance().extend_ttl(5000, 5000);
        env.events().publish((symbol_short!("allow"),), TokenAllowanceEvent { token, allowed, by: admin });
        Ok(())
    }

    pub fn set_max_withdrawal(env: Env, admin: Address, token: Address, cap: i128) -> Result<(), TreasuryError> {
        Self::require_admin(&env, &admin)?;
        env.storage().instance().set(&DataKey::MaxWithdrawal(token), &cap);
        env.events().publish((symbol_short!("caps"),), CapsChangedEvent { by: admin });
        Ok(())
    }

    pub fn allowlisted(env: Env, token: Address) -> bool {
        env.storage().instance().get(&DataKey::Allowed(token)).unwrap_or(false)
    }

    pub fn deposit(env: Env, from: Address, token: Address, amount: i128) -> Result<(), TreasuryError> {
        if amount <= 0 { return Err(TreasuryError::InvalidAmount); }
        if !Self::allowlisted(env.clone(), token.clone()) { return Err(TreasuryError::TokenNotAllowed); }
        from.require_auth();
        token::Client::new(&env, &token).transfer(&from, &env.current_contract_address(), &amount);
        env.storage().instance().extend_ttl(5000, 5000);
        env.events().publish((symbol_short!("deposit"),), DepositedEvent { token, from, amount });
        Ok(())
    }

    pub fn withdraw(env: Env, admin: Address, token: Address, to: Address, amount: i128) -> Result<(), TreasuryError> {
        if amount <= 0 { return Err(TreasuryError::InvalidAmount); }
        Self::require_admin(&env, &admin)?;
        let cap: i128 = env.storage().instance().get(&DataKey::MaxWithdrawal(token.clone())).unwrap_or(i128::MAX);
        if amount > cap { return Err(TreasuryError::WithdrawalCapped); }
        let current = token::Client::new(&env, &token).balance(&env.current_contract_address());
        if current < amount { return Err(TreasuryError::InvalidAmount); }
        token::Client::new(&env, &token).transfer(&env.current_contract_address(), &to, &amount);
        env.storage().instance().extend_ttl(5000, 5000);
        env.events().publish((symbol_short!("withdraw"),), WithdrawnEvent { token, to, amount, by: admin });
        Ok(())
    }

    pub fn balance(env: Env, token: Address) -> i128 {
        token::Client::new(&env, &token).balance(&env.current_contract_address())
    }

    fn require_admin(env: &Env, admin: &Address) -> Result<(), TreasuryError> {
        let stored: Address = env.storage().instance().get(&DataKey::Admin).ok_or(TreasuryError::NotInitialized)?;
        stored.require_auth();
        if admin != &stored { return Err(TreasuryError::Unauthorized); }
        Ok(())
    }
}

#[cfg(test)]
mod test;
