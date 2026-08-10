#![cfg(test)]

use super::{MerchantContract, MerchantContractClient, MerchantError};
use soroban_sdk::testutils::Address as AddressUtils;
use soroban_sdk::{token, Address, Env, String};

fn create_token<'e>(env: &'e Env, admin: &Address) -> (token::Client<'e>, Address) {
    let id = env.register_stellar_asset_contract(admin.clone());
    (token::Client::new(env, &id), id)
}

type Setup<'e> = (
    Address,
    Address,
    Address,
    token::Client<'e>,
    Address,
    Address,
    MerchantContractClient<'e>,
    u64,
);

fn setup<'e>(env: &'e Env) -> Setup<'e> {
    env.mock_all_auths();
    let admin = Address::generate(env);
    let owner = Address::generate(env);
    let settlement = Address::generate(env);
    let (token, token_id) = create_token(env, &admin);
    let contract_id = env.register_contract(None, MerchantContract);
    let client = MerchantContractClient::new(env, &contract_id);
    client.initialize(&admin);
    // Mint tokens to the owner (who acts as the paying customer in tests).
    mint(env, &token_id, &owner, 10_000i128);
    let id = client.register(&owner, &String::from_str(env, "Demo Coffee Co."), &settlement, &100);
    (admin, owner, settlement, token, token_id, contract_id, client, id)
}

fn mint<'e>(env: &'e Env, token_id: &Address, to: &Address, amount: i128) {
    token::StellarAssetClient::new(env, token_id).mint(to, &amount);
}

#[test]
fn test_register_creates_profile() {
    let env = Env::default();
    let (_admin, owner, _settlement, _token, _token_id, _contract_id, client, id) = setup(&env);
    let profile = client.get(&id).unwrap();
    assert_eq!(profile.owner, owner);
    assert_eq!(profile.commission_bps, 100);
    assert!(profile.active);
}

#[test]
fn test_record_sale_transfers_and_accrues_balance() {
    let env = Env::default();
    let (_admin, owner, _settlement, token, token_id, contract_id, client, id) = setup(&env);

    let payer_balance_before = token.balance(&owner);
    client.record_sale(&owner, &id, &token_id, &1000);

    // Payer's balance decreased.
    assert_eq!(token.balance(&owner), payer_balance_before - 1000);
    // Contract now holds the tokens.
    assert_eq!(token.balance(&contract_id), 1000);
    // Merchant's internal balance is credited.
    assert_eq!(client.held_balance(&id, &token_id), 1000);
}

#[test]
fn test_settle_withholds_commission() {
    let env = Env::default();
    let (admin, owner, settlement, token, token_id, contract_id, client, id) = setup(&env);

    // Customer (owner) pays 1000 to the contract via record_sale.
    client.record_sale(&owner, &id, &token_id, &1000);
    assert_eq!(token.balance(&contract_id), 1000);

    // Merchant owner settles.
    client.settle(&owner, &id, &token_id);

    // 1000 * 100bps / 10000 = 10 commission -> 990 net to settlement.
    assert_eq!(token.balance(&settlement), 990);
    assert_eq!(token.balance(&admin), 10);
    assert_eq!(client.held_balance(&id, &token_id), 0);
    // Contract balance should be empty after settlement.
    assert_eq!(token.balance(&contract_id), 0);
}

#[test]
fn test_settle_requires_owner() {
    let env = Env::default();
    let (_admin, owner, _settlement, _token, token_id, _contract_id, client, id) = setup(&env);
    client.record_sale(&owner, &id, &token_id, &1000);
    let attacker = Address::generate(&env);

    let result = client.try_settle(&attacker, &id, &token_id);
    assert_eq!(result, Err(Ok(MerchantError::Unauthorized)));
    // State integrity: tokens and balances are untouched after failed attempt.
    assert_eq!(client.held_balance(&id, &token_id), 1000);
}

#[test]
fn test_inactive_merchant_rejects_sales() {
    let env = Env::default();
    let (admin, owner, _settlement, _token, token_id, _contract_id, client, id) = setup(&env);
    client.set_active(&admin, &id, &false);

    let result = client.try_record_sale(&owner, &id, &token_id, &10);
    assert_eq!(result, Err(Ok(MerchantError::InactiveMerchant)));
}

#[test]
fn test_admin_commission_override() {
    let env = Env::default();
    let (admin, owner, settlement, token, token_id, contract_id, client, id) = setup(&env);
    client.set_commission(&admin, &id, &250);
    client.record_sale(&owner, &id, &token_id, &1000);
    client.settle(&owner, &id, &token_id);

    // 1000 * 250bps / 10000 = 25 commission -> 975 net to settlement, 25 to admin.
    assert_eq!(token.balance(&settlement), 975);
    assert_eq!(token.balance(&admin), 25);
    assert_eq!(token.balance(&contract_id), 0);
}

#[test]
fn test_record_sale_rejects_zero_amount() {
    let env = Env::default();
    let (_admin, owner, _settlement, _token, token_id, _contract_id, client, id) = setup(&env);

    let result = client.try_record_sale(&owner, &id, &token_id, &0);
    assert_eq!(result, Err(Ok(MerchantError::InvalidAmount)));
}

#[test]
fn test_record_sale_rejects_unknown_merchant() {
    let env = Env::default();
    let (_admin, owner, _settlement, _token, token_id, _contract_id, client, _id) = setup(&env);

    let result = client.try_record_sale(&owner, &999, &token_id, &100);
    assert_eq!(result, Err(Ok(MerchantError::MerchantNotFound)));
}

#[test]
fn test_settle_rejects_when_no_balance() {
    let env = Env::default();
    let (_admin, owner, _settlement, _token, token_id, _contract_id, client, id) = setup(&env);

    // No sales recorded — settle should fail with NoBalance.
    let result = client.try_settle(&owner, &id, &token_id);
    assert_eq!(result, Err(Ok(MerchantError::NoBalance)));
}
