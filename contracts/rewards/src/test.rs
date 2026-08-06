#![cfg(test)]

use super::{RewardsContract, RewardsContractClient, RewardsError};
use soroban_sdk::testutils::{Address as AddressUtils, Events};
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

    // Fund contract with reward tokens so redeems succeed.
    mint(env, &token_id, &contract_id, &100_000_000);

    // Configure tiers.
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

    // First, earn enough to reach Silver (500 points).
    // Since Bronze has 1x multiplier, we need 500 base points.
    client.earn(&merchant, &alice, &500u64);

    let points = client.balance(&alice);
    assert_eq!(points.current_tier_id, 2); // Silver

    // Now earn again: Silver gives 2x multiplier.
    client.earn(&merchant, &alice, &100u64);

    let points = client.balance(&alice);
    assert_eq!(points.lifetime, 700); // 500 + (100 * 2)
    assert_eq!(points.balance, 700);
}

#[test]
fn test_earn_tier_progression_to_gold() {
    let env = Env::default();
    let (_admin, alice, merchant, _token, _token_id, client) = setup(&env);

    // Bronze: 1x. Reach Silver at 500 lifetime.
    client.earn(&merchant, &alice, &500u64);
    assert_eq!(client.balance(&alice).current_tier_id, 2);

    // Silver: 2x. Need 1500 more lifetime to reach Gold (2000 total).
    client.earn(&merchant, &alice, &750u64); // earns 1500
    assert_eq!(client.balance(&alice).current_tier_id, 3); // Gold
}

#[test]
fn test_earn_rejects_unauthorized() {
    let env = Env::default();
    let (_admin, alice, _merchant, _token, _token_id, client) = setup(&env);
    let unauthorized = Address::generate(&env);

    let result = client.try_earn(&unauthorized, &alice, &10u64);
    assert_eq!(result, Err(Ok(RewardsError::Unauthorized)));
}

#[test]
fn test_earn_rejects_zero() {
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
    let after = token.balance(&alice);
    assert_eq!(after - before, 500);

    let points = client.balance(&alice);
    assert_eq!(points.lifetime, 100); // lifetime unchanged
    assert_eq!(points.balance, 50); // redeemable decreased
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
fn test_redeem_zero_rejected() {
    let env = Env::default();
    let (_admin, alice, _merchant, _token, _token_id, client) = setup(&env);

    let result = client.try_redeem(&alice, &0u64);
    assert_eq!(result, Err(Ok(RewardsError::InvalidAmount)));
}

// ------------------------------------------------------------------ Admin

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
fn test_set_earner_toggle() {
    let env = Env::default();
    let (admin, alice, merchant, _token, _token_id, client) = setup(&env);

    // Revoke merchant authorization.
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

// ------------------------------------------------------------------ Events

#[test]
fn test_earn_emits_event() {
    let env = Env::default();
    let (_admin, alice, merchant, _token, _token_id, client) = setup(&env);

    let events_before = env.events().all().len();
    client.earn(&merchant, &alice, &50u64);
    let events_after = env.events().all().len();

    assert!(events_after > events_before);
}

#[test]
fn test_tier_upgrade_emits_event() {
    let env = Env::default();
    let (_admin, alice, merchant, _token, _token_id, client) = setup(&env);

    client.earn(&merchant, &alice, &500u64);

    // Should have at least: tier creation events + earn + tier_upgrade
    let events = env.events().all();
    // Filter for TierUpgraded context.
    let has_upgrade = events.iter().any(|e| {
        format!("{:?}", e).contains("TierUpgraded")
    });
    assert!(has_upgrade);
}
