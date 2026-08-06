#![cfg(test)]

use super::{TreasuryContract, TreasuryContractClient, TreasuryError};
use soroban_sdk::testutils::Address as AddressUtils;
use soroban_sdk::{token, Address, Env};

struct Token {
    client: token::Client<'static>,
}

impl Token {
    fn new(env: &Env, admin: &Address) -> Self {
        let client = token::Client::new(env, &env.register_stellar_asset_contract(admin.clone()));
        Token { client }
    }
    fn mint(&self, to: &Address, amount: i128) {
        token::StellarAssetClient::new(self.client.env(), self.client.address()).mint(to, &amount);
    }
}

fn setup<'e>(env: &'e Env) -> (Address, Address, Token, TreasuryContractClient<'e>) {
    env.mock_all_auths();
    let admin = Address::generate(env);
    let alice = Address::generate(env);
    let token = Token::new(env, &admin);
    let contract_id = env.register_contract(None, TreasuryContract);
    let client = TreasuryContractClient::new(env, &contract_id);
    client.initialize(&admin);
    client.set_allowed(&admin, &token.client.address(), &true);
    token.mint(&alice, &10_000);
    (admin, alice, token, client)
}

#[test]
fn test_deposit_and_balance() {
    let env = Env::default();
    let (_admin, alice, token, client) = setup(&env);

    client.deposit(&alice, &token.client.address(), &1000);
    assert_eq!(client.balance(&token.client.address()), 1000);
    assert_eq!(token.client.balance(&alice), 9000);
}

#[test]
fn test_deposit_rejects_unallowed_token() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let alice = Address::generate(&env);
    let unallowed = Token::new(&env, &admin);
    let contract_id = env.register_contract(None, TreasuryContract);
    let client = TreasuryContractClient::new(&env, &contract_id);
    env.mock_all_auths();
    client.initialize(&admin);
    unallowed.mint(&alice, &100);

    let result = client.try_deposit(&alice, &unallowed.client.address(), &10);
    assert_eq!(result, Err(Ok(TreasuryError::TokenNotAllowed)));
}

#[test]
fn test_admin_withdraw() {
    let env = Env::default();
    let (admin, alice, token, client) = setup(&env);
    client.deposit(&alice, &token.client.address(), &1000);

    client.withdraw(&admin, &token.client.address(), &alice, &400);
    assert_eq!(client.balance(&token.client.address()), 600);
    assert_eq!(token.client.balance(&alice), 9400);
}

#[test]
fn test_withdraw_enforces_cap() {
    let env = Env::default();
    let (admin, alice, token, client) = setup(&env);
    client.deposit(&alice, &token.client.address(), &1000);
    client.set_max_withdrawal(&admin, &token.client.address(), &100);

    let result = client.try_withdraw(&admin, &token.client.address(), &alice, &500);
    assert_eq!(result, Err(Ok(TreasuryError::WithdrawalCapped)));

    client.withdraw(&admin, &token.client.address(), &alice, &100);
    assert_eq!(client.balance(&token.client.address()), 900);
}

#[test]
fn test_non_admin_cannot_withdraw() {
    let env = Env::default();
    let (admin, alice, token, client) = setup(&env);
    client.deposit(&alice, &token.client.address(), &1000);
    let attacker = Address::generate(&env);

    let result = client.try_withdraw(&attacker, &token.client.address(), &attacker, &1);
    assert_eq!(result, Err(Ok(TreasuryError::Unauthorized)));
}
