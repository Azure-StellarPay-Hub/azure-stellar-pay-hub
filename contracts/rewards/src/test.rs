#![cfg(test)]

use super::{RewardsContract, RewardsContractClient, RewardsError};
use soroban_sdk::testutils::Address as AddressUtils;
use soroban_sdk::{token, Address, Env, String};

fn create_token<'e>(env: &'e Env, admin: &Address) -> (token::Client<'e>, Address) {
    let id = env.register_stellar_asset_contract(admin.clone());
    (token::Client::new(env, &id), id)
}

fn mint<'e>(env: &'e Env, token_id: &Address, to: &Address, amount: i128) {
    token::StellarAssetClient::new(env, token_id).mint(to, &amount);
}

type Setup<'e> = (
    Address,
    Address,
    Address,
    token::Client<'e>,
    Address,
    RewardsContractClient<'e>,
);

fn setup<'e>(env: &'e Env) -> Setup<'e> {
    env.mock_all_auths();
    let admin = Address::generate(env);
    let alice = Address::generate(env);
    let merchant = Address::generate(env);
    let (token, token_id) = create_token(env, &admin);
    let contract_id = env.register_contract(None, RewardsContract);
    let client = RewardsContractClient::new(env, &contract_id);

    client.initialize(&admin, &token_id);

    // Fund the contract so redeems can succeed.
    mint(env, &token_id, &contract_id, &100_000_000);

    // Configure three tiers (matching the existing rewards test pattern).
    client.create_tier(
        &admin,
        &1u32,
        &String::from_str(env, "Bronze"),
        &0u64,
        &1u32,
        &10i128,
        &0u64,
    );
    client.create_tier(
        &admin,
        &2u32,
        &String::from_str(env, "Silver"),
        &500u64,
        &2u32,
        &15i128,
        &0u64,
    );
    client.create_tier(
        &admin,
        &3u32,
        &String::from_str(env, "Gold"),
        &2000u64,
        &3u32,
        &20i128,
        &0u64,
    );

    // Authorize the merchant as an earner.
    client.set_earner(&admin, &merchant, &true);

    (admin, alice, merchant, token, token_id, client)
}

// ------------------------------------------------------------------ Tiers

#[test]
fn test_create_tier() {
    let env = Env::default();
    let (admin, _alice, _merchant, _token, _token_id, client) = setup(&env);

    let tier = client.tier(&1u32).unwrap();
    assert_eq!(tier.name, String::from_str(&env, "Bronze"));
    assert_eq!(tier.earn_multiplier, 1);
    assert!(tier.active);
}

#[test]
fn test_create_duplicate_tier_fails() {
    let env = Env::default();
    let (admin, _alice, _merchant, _token, _token_id, client) = setup(&env);

    let result = client.try_create_tier(
        &admin,
        &1u32,
        &String::from_str(&env, "Duplicate"),
        &0u64,
        &1u32,
        &5i128,
        &0u64,
    );
    assert_eq!(result, Err(Ok(RewardsError::TierAlreadyExists)));
}

#[test]
fn test_create_tier_rejects_invalid_rate() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let (token, token_id) = create_token(&env, &admin);
    let contract_id = env.register_contract(None, RewardsContract);
    let client = RewardsContractClient::new(&env, &contract_id);
    env.mock_all_auths();
    client.initialize(&admin, &token_id);

    // Zero multiplier.
    let result = client.try_create_tier(
        &admin,
        &1u32,
        &String::from_str(&env, "Bad"),
        &0u64,
        &0u32,
        &10i128,
        &0u64,
    );
    assert_eq!(result, Err(Ok(RewardsError::InvalidRate)));

    // Zero reward rate.
    let result = client.try_create_tier(
        &admin,
        &1u32,
        &String::from_str(&env, "Bad"),
        &0u64,
        &1u32,
        &0i128,
        &0u64,
    );
    assert_eq!(result, Err(Ok(RewardsError::InvalidRate)));
}

#[test]
fn test_update_tier() {
    let env = Env::default();
    let (admin, _alice, _merchant, _token, _token_id, client) = setup(&env);

    client.update_tier(&admin, &1u32, &100u64, &2u32, &12i128, &3600u64);

    let tier = client.tier(&1u32).unwrap();
    assert_eq!(tier.min_points, 100);
    assert_eq!(tier.earn_multiplier, 2);
    assert_eq!(tier.reward_rate, 12);
}

#[test]
fn test_update_tier_not_found() {
    let env = Env::default();
    let (admin, _alice, _merchant, _token, _token_id, client) = setup(&env);

    let result = client.try_update_tier(&admin, &99u32, &0u64, &1u32, &10i128, &0u64);
    assert_eq!(result, Err(Ok(RewardsError::TierNotFound)));
}

#[test]
fn test_update_tier_rejects_invalid_rate() {
    let env = Env::default();
    let (admin, _alice, _merchant, _token, _token_id, client) = setup(&env);

    // Zero multiplier should be rejected.
    let result = client.try_update_tier(&admin, &1u32, &0u64, &0u32, &10i128, &0u64);
    assert_eq!(result, Err(Ok(RewardsError::InvalidRate)));

    // Zero reward rate should be rejected.
    let result = client.try_update_tier(&admin, &1u32, &0u64, &1u32, &0i128, &0u64);
    assert_eq!(result, Err(Ok(RewardsError::InvalidRate)));
}

#[test]
fn test_set_tier_active_toggle() {
    let env = Env::default();
    let (admin, _alice, _merchant, _token, _token_id, client) = setup(&env);

    client.set_tier_active(&admin, &1u32, &false);
    assert!(!client.tier(&1u32).unwrap().active);

    client.set_tier_active(&admin, &1u32, &true);
    assert!(client.tier(&1u32).unwrap().active);
}

#[test]
fn test_tiers_returns_all() {
    let env = Env::default();
    let (_admin, _alice, _merchant, _token, _token_id, client) = setup(&env);

    let all = client.tiers();
    assert_eq!(all.len(), 3);
}

// ------------------------------------------------------------------ Earn

#[test]
fn test_earn_points() {
    let env = Env::default();
    let (_admin, alice, merchant, _token, _token_id, client) = setup(&env);

    client.earn(&merchant, &alice, &100u64);

    let points = client.balance(&alice);
    assert_eq!(points.lifetime, 100);
    assert_eq!(points.balance, 100);
    assert_eq!(points.current_tier_id, 1);
}

#[test]
fn test_earn_with_multiplier_after_upgrade() {
    let env = Env::default();
    let (_admin, alice, merchant, _token, _token_id, client) = setup(&env);

    // Reach Silver (500 lifetime). Bronze 1x → 500 base → 500 lifetime.
    client.earn(&merchant, &alice, &500u64);
    let points = client.balance(&alice);
    assert_eq!(points.current_tier_id, 2);

    // Silver: 2x multiplier. 100 base → 200 earned.
    client.earn(&merchant, &alice, &100u64);
    let points = client.balance(&alice);
    assert_eq!(points.lifetime, 700);
    assert_eq!(points.balance, 700);
}

#[test]
fn test_earn_tier_progression_to_gold() {
    let env = Env::default();
    let (_admin, alice, merchant, _token, _token_id, client) = setup(&env);

    // Reach Silver at 500 lifetime.
    client.earn(&merchant, &alice, &500u64);
    assert_eq!(client.balance(&alice).current_tier_id, 2);

    // Silver 2x: 750 base → 1500 earned. Total: 2000 → Gold.
    client.earn(&merchant, &alice, &750u64);
    assert_eq!(client.balance(&alice).current_tier_id, 3);
}

#[test]
fn test_earn_rejects_unauthorized_earner() {
    let env = Env::default();
    let (_admin, alice, _merchant, _token, _token_id, client) = setup(&env);
    let unauthorized = Address::generate(&env);

    let result = client.try_earn(&unauthorized, &alice, &10u64);
    assert_eq!(result, Err(Ok(RewardsError::Unauthorized)));
}

#[test]
fn test_earn_rejects_zero_points() {
    let env = Env::default();
    let (_admin, alice, merchant, _token, _token_id, client) = setup(&env);

    let result = client.try_earn(&merchant, &alice, &0u64);
    assert_eq!(result, Err(Ok(RewardsError::InvalidAmount)));
}

// ------------------------------------------------------------------ Redeem

#[test]
fn test_redeem_points() {
    let env = Env::default();
    let (_admin, alice, merchant, token, _token_id, client) = setup(&env);

    client.earn(&merchant, &alice, &100u64);
    let before = token.balance(&alice);

    client.redeem(&alice, &50u64);

    // Bronze rate is 10 stroops per point → 500 stroops reward.
    assert_eq!(token.balance(&alice) - before, 500);

    let points = client.balance(&alice);
    assert_eq!(points.lifetime, 100);
    assert_eq!(points.balance, 50);
}

#[test]
fn test_redeem_insufficient_points() {
    let env = Env::default();
    let (_admin, alice, merchant, _token, _token_id, client) = setup(&env);

    client.earn(&merchant, &alice, &10u64);
    let result = client.try_redeem(&alice, &100u64);
    assert_eq!(result, Err(Ok(RewardsError::InsufficientPoints)));
}

#[test]
fn test_redeem_rejects_zero() {
    let env = Env::default();
    let (_admin, alice, _merchant, _token, _token_id, client) = setup(&env);

    let result = client.try_redeem(&alice, &0u64);
    assert_eq!(result, Err(Ok(RewardsError::InvalidAmount)));
}

// ------------------------------------------------------------------ Deposit rewards

#[test]
fn test_deposit_rewards_funds_contract() {
    let env = Env::default();
    let (_admin, _alice, _merchant, token, token_id, client) = setup(&env);

    // Mint tokens to a depositor and deposit into the contract.
    let depositor = Address::generate(&env);
    mint(&env, &token_id, &depositor, &10_000);

    let before = token.balance(&client.address());
    client.deposit_rewards(&depositor, &5000);
    assert_eq!(token.balance(&client.address()), before + 5000);
    assert_eq!(token.balance(&depositor), 5000);
}

#[test]
fn test_deposit_rewards_rejects_zero() {
    let env = Env::default();
    let depositor = Address::generate(&env);
    let (_admin, _alice, _merchant, _token, _token_id, client) = setup(&env);

    let result = client.try_deposit_rewards(&depositor, &0);
    assert_eq!(result, Err(Ok(RewardsError::InvalidAmount)));
}

// ------------------------------------------------------------------ Earner management

#[test]
fn test_set_earner_toggle() {
    let env = Env::default();
    let (admin, alice, merchant, _token, _token_id, client) = setup(&env);

    // Revoke authorization.
    client.set_earner(&admin, &merchant, &false);
    assert!(!client.is_earner(&merchant));

    let result = client.try_earn(&merchant, &alice, &10u64);
    assert_eq!(result, Err(Ok(RewardsError::Unauthorized)));

    // Re-authorize.
    client.set_earner(&admin, &merchant, &true);
    assert!(client.is_earner(&merchant));
    client.earn(&merchant, &alice, &10u64);
    assert_eq!(client.balance(&alice).balance, 10);
}

#[test]
fn test_is_earner_returns_false_for_unknown() {
    let env = Env::default();
    let (_admin, _alice, _merchant, _token, _token_id, client) = setup(&env);

    assert!(!client.is_earner(&Address::generate(&env)));
}

// ------------------------------------------------------------------ Reward token

#[test]
fn test_reward_token_returns_configured() {
    let env = Env::default();
    let (_admin, _alice, _merchant, _token, token_id, client) = setup(&env);

    assert_eq!(client.reward_token(), Some(token_id));
}

#[test]
fn test_set_reward_token() {
    let env = Env::default();
    let (admin, _alice, _merchant, token, _token_id, client) = setup(&env);

    let (_, new_token_id) = create_token(&env, &admin);
    client.set_reward_token(&admin, &new_token_id);

    assert_eq!(client.reward_token(), Some(new_token_id));
}

// ------------------------------------------------------------------ Balance

#[test]
fn test_balance_defaults_for_new_account() {
    let env = Env::default();
    let (_admin, _alice, _merchant, _token, _token_id, client) = setup(&env);
    let stranger = Address::generate(&env);

    let points = client.balance(&stranger);
    assert_eq!(points.lifetime, 0);
    assert_eq!(points.balance, 0);
    assert_eq!(points.current_tier_id, 1);
}
