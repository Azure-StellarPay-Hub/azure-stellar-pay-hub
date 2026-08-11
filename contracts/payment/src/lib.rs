#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, String, Vec};

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
#[repr(u32)]
pub enum PaymentError {
    Unauthorized = 1,
    InvalidAmount = 2,
    Paused = 3,
    TokenNotAllowed = 4,
    NotInitialized = 5,
    EmptyRecipients = 6,
    AlreadyInitialized = 7,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum DataKey {
    Admin,
    Paused,
    Allowed(Address),
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct PaymentEventData {
    pub from: Address,
    pub to: Address,
    pub token: Address,
    pub amount: i128,
    pub memo: String,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct BatchPaymentData {
    pub from: Address,
    pub token: Address,
    pub recipients: u32,
    pub total: i128,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct PausedData {
    pub by: Address,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct UnpausedData {
    pub by: Address,
}

#[contract]
pub struct PaymentContract;

#[contractimpl]
impl PaymentContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), PaymentError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(PaymentError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage().instance().extend_ttl(5000, 5000);
        Ok(())
    }

    pub fn admin(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Admin)
    }

    pub fn paused(env: Env) -> bool {
        env.storage().instance().get(&DataKey::Paused).unwrap_or(false)
    }

    pub fn set_allowed(env: Env, admin: Address, token: Address, allowed: bool) -> Result<(), PaymentError> {
        Self::require_admin(&env, &admin)?;
        env.storage().instance().set(&DataKey::Allowed(token.clone()), &allowed);
        env.storage().instance().extend_ttl(5000, 5000);
        Ok(())
    }

    pub fn is_allowed(env: Env, token: Address) -> bool {
        env.storage().instance().get(&DataKey::Allowed(token)).unwrap_or(false)
    }

    pub fn pause(env: Env, admin: Address) -> Result<(), PaymentError> {
        Self::require_admin(&env, &admin)?;
        env.storage().instance().set(&DataKey::Paused, &true);
        env.events().publish((symbol_short!("paused"),), PausedData { by: admin });
        Ok(())
    }

    pub fn unpause(env: Env, admin: Address) -> Result<(), PaymentError> {
        Self::require_admin(&env, &admin)?;
        env.storage().instance().set(&DataKey::Paused, &false);
        env.events().publish((symbol_short!("unpaused"),), UnpausedData { by: admin });
        Ok(())
    }

    pub fn send(
        env: Env,
        from: Address,
        to: Address,
        token: Address,
        amount: i128,
        memo: Option<String>,
    ) -> Result<(), PaymentError> {
        Self::check_send(&env, &from, &token, amount)?;
        from.require_auth();
        token::Client::new(&env, &token).transfer(&from, &to, &amount);
        env.storage().instance().extend_ttl(5000, 5000);
        env.events().publish((symbol_short!("payment"),), PaymentEventData {
            from,
            to,
            token,
            amount,
            memo: memo.unwrap_or(String::from_str(&env, "")),
        });
        Ok(())
    }

    pub fn send_batch(
        env: Env,
        from: Address,
        token: Address,
        recipients: Vec<(Address, i128)>,
    ) -> Result<(), PaymentError> {
        Self::check_send(&env, &from, &token, 1)?;
        if recipients.is_empty() {
            return Err(PaymentError::EmptyRecipients);
        }
        from.require_auth();
        let mut total: i128 = 0;
        for (to, amount) in recipients.iter() {
            if amount <= 0 {
                return Err(PaymentError::InvalidAmount);
            }
            total += amount;
            token::Client::new(&env, &token).transfer(&from, &to, &amount);
        }
        env.storage().instance().extend_ttl(5000, 5000);
        env.events().publish((symbol_short!("batch"),), BatchPaymentData {
            from,
            token,
            recipients: recipients.len() as u32,
            total,
        });
        Ok(())
    }

    pub fn balance(env: Env, account: Address, token: Address) -> i128 {
        token::Client::new(&env, &token).balance(&account)
    }

    fn require_admin(env: &Env, admin: &Address) -> Result<(), PaymentError> {
        let stored: Address = env.storage().instance().get(&DataKey::Admin).ok_or(PaymentError::NotInitialized)?;
        stored.require_auth();
        if admin != &stored { return Err(PaymentError::Unauthorized); }
        Ok(())
    }

    fn check_send(env: &Env, _from: &Address, token: &Address, amount: i128) -> Result<(), PaymentError> {
        if amount <= 0 { return Err(PaymentError::InvalidAmount); }
        if env.storage().instance().get::<_, bool>(&DataKey::Paused).unwrap_or(false) { return Err(PaymentError::Paused); }
        if !env.storage().instance().get::<_, bool>(&DataKey::Allowed(token.clone())).unwrap_or(false) {
            return Err(PaymentError::TokenNotAllowed);
        }
        Ok(())
    }
}

#[cfg(test)]
mod test;
