#![cfg(test)]

use super::{EscrowContract, EscrowContractClient, EscrowError};
use soroban_sdk::testutils::{Address as AddressUtils, Ledger};
use soroban_sdk::{token, Address, Env};

fn create_token<'e>(env: &'e Env, admin: &Address) -> (token::Client<'e>, Address) {
    let id = env.register_stellar_asset_contract(admin.clone());
    (token::Client::new(env, &id), id)
}

fn mint<'e>(env: &'e Env, token_id: &Address, to: &Address, amount: i128) {
    token::StellarAssetClient::new(env, token_id).mint(to, &amount);
}

type Setup<'e> = (Address, Address, Address, token::Client<'e>, Address, EscrowContractClient<'e>);

fn setup<'e>(env: &'e Env) -> Setup<'e> {
    env.mock_all_auths();
    let admin = Address::generate(env);
    let alice = Address::generate(env);
    let bob = Address::generate(env);
    let (token, token_id) = create_token(env, &admin);
    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(env, &contract_id);
    client.initialize(&admin);
    mint(env, &token_id, &alice, &10_000);
    mint(env, &token_id, &bob, &10_000);
    (admin, alice, bob, token, token_id, client)
}

#[test]
fn test_create_holds_funds() {
    let env = Env::default();
    let (_admin, alice, bob, token, token_id, client) = setup(&env);

    let id = client.create(&alice, &bob, &token_id, &500, &1000, &None);
    assert_eq!(id, 1);
    assert_eq!(token.balance(&alice), 9500);
    assert_eq!(token.balance(&client.address()), 500);

    let escrow = client.get(&id).unwrap();
    assert_eq!(escrow.amount, 500);
    assert!(!escrow.released);
}

#[test]
fn test_cannot_release_before_time() {
    let env = Env::default();
    let (_admin, alice, bob, token, token_id, client) = setup(&env);
    env.ledger().set_timestamp(100);

    let id = client.create(&alice, &bob, &token_id, &500, &1000, &None);

    env.ledger().set_timestamp(999);
    let result = client.try_release(&id, &bob);
    assert_eq!(result, Err(Ok(EscrowError::TooEarly)));
}

#[test]
fn test_release_after_time() {
    let env = Env::default();
    let (_admin, alice, bob, token, token_id, client) = setup(&env);
    env.ledger().set_timestamp(100);

    let id = client.create(&alice, &bob, &token_id, &500, &1000, &None);
    env.ledger().set_timestamp(1001);

    client.release(&id, &bob);
    assert_eq!(token.balance(&bob), 10500);
    assert_eq!(token.balance(&client.address()), 0);

    // Cannot release twice.
    let result = client.try_release(&id, &bob);
    assert_eq!(result, Err(Ok(EscrowError::AlreadyReleased)));
}

#[test]
fn test_refund_before_release() {
    let env = Env::default();
    let (_admin, alice, bob, token, token_id, client) = setup(&env);
    env.ledger().set_timestamp(100);

    let id = client.create(&alice, &bob, &token_id, &500, &1000, &None);
    env.ledger().set_timestamp(999);

    client.refund(&id);
    assert_eq!(token.balance(&alice), 10000);
    assert_eq!(token.balance(&client.address()), 0);
}

#[test]
fn test_refund_not_allowed_mid_window() {
    let env = Env::default();
    let (_admin, alice, bob, token, token_id, client) = setup(&env);
    env.ledger().set_timestamp(100);

    let id = client.create(&alice, &bob, &token_id, &500, &1000, &Some(2000));
    env.ledger().set_timestamp(1500); // between release_time and expiry

    let result = client.try_refund(&id);
    assert_eq!(result, Err(Ok(EscrowError::NotExpired)));
}

#[test]
fn test_refund_after_expiry() {
    let env = Env::default();
    let (_admin, alice, bob, token, token_id, client) = setup(&env);
    env.ledger().set_timestamp(100);

    let id = client.create(&alice, &bob, &token_id, &500, &1000, &Some(2000));
    env.ledger().set_timestamp(2001);

    client.refund(&id);
    assert_eq!(token.balance(&alice), 10000);
}

#[test]
fn test_unknown_escrow_errors() {
    let env = Env::default();
    let (_admin, _alice, bob, _token, _token_id, client) = setup(&env);

    let result = client.try_release(&999, &bob);
    assert_eq!(result, Err(Ok(EscrowError::EscrowNotFound)));
}
