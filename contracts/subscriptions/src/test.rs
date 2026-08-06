#![cfg(test)]

use super::{SubscriptionsContract, SubscriptionsContractClient, SubscriptionError};
use soroban_sdk::testutils::{Address as AddressUtils, Ledger};
use soroban_sdk::{token, Address, Env};

fn create_token<'e>(env: &'e Env, admin: &Address) -> (token::Client<'e>, Address) {
    let id = env.register_stellar_asset_contract(admin.clone());
    (token::Client::new(env, &id), id)
}

fn mint<'e>(env: &'e Env, token_id: &Address, to: &Address, amount: i128) {
    token::StellarAssetClient::new(env, token_id).mint(to, &amount);
}

type Setup<'e> = (Address, Address, token::Client<'e>, Address, SubscriptionsContractClient<'e>, u64);

fn setup<'e>(env: &'e Env) -> Setup<'e> {
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000_000);
    let admin = Address::generate(env);
    let merchant = Address::generate(env);
    let subscriber = Address::generate(env);
    let (token, token_id) = create_token(env, &admin);
    let contract_id = env.register_contract(None, SubscriptionsContract);
    let client = SubscriptionsContractClient::new(env, &contract_id);
    let plan_id = client.create_plan(&merchant, &token_id, &100, &60);
    mint(env, &token_id, &subscriber, &1000);
    (merchant, subscriber, token, token_id, client, plan_id)
}

#[test]
fn test_subscribe_charges_first_period() {
    let env = Env::default();
    let (_merchant, subscriber, token, _token_id, client, plan_id) = setup(&env);

    let sub_id = client.subscribe(&subscriber, &plan_id);
    assert_eq!(sub_id, 1);
    assert_eq!(token.balance(&subscriber), 900);

    let sub = client.get_subscription(&sub_id).unwrap();
    assert!(sub.active);
    assert_eq!(sub.next_payment_at, 1_000_060);
}

#[test]
fn test_duplicate_subscription_rejected() {
    let env = Env::default();
    let (_merchant, subscriber, _token, _token_id, client, plan_id) = setup(&env);
    client.subscribe(&subscriber, &plan_id);

    let result = client.try_subscribe(&subscriber, &plan_id);
    assert_eq!(result, Err(Ok(SubscriptionError::AlreadySubscribed)));
}

#[test]
fn test_renew_advances_period() {
    let env = Env::default();
    let (_merchant, subscriber, token, _token_id, client, plan_id) = setup(&env);
    let sub_id = client.subscribe(&subscriber, &plan_id);

    // Not due yet.
    let result = client.try_renew(&sub_id);
    assert_eq!(result, Err(Ok(SubscriptionError::NotDue)));

    // Advance time and renew.
    env.ledger().set_timestamp(1_000_061);
    client.renew(&sub_id);
    assert_eq!(token.balance(&subscriber), 800);
    assert_eq!(client.get_subscription(&sub_id).unwrap().next_payment_at, 1_000_121);
}

#[test]
fn test_renew_with_insufficient_balance_pauses() {
    let env = Env::default();
    let (merchant, subscriber, token, _token_id, client, plan_id) = setup(&env);
    let sub_id = client.subscribe(&subscriber, &plan_id);

    // Drain the subscriber.
    let drain_to = Address::generate(&env);
    token.transfer(&subscriber, &drain_to, &900);

    env.ledger().set_timestamp(1_000_061);
    let result = client.try_renew(&sub_id);
    assert_eq!(result, Err(Ok(SubscriptionError::TransferFailed)));
    assert!(!client.get_subscription(&sub_id).unwrap().active);
    // No money moved to the merchant.
    assert_eq!(token.balance(&merchant), 100);
}

#[test]
fn test_cancel() {
    let env = Env::default();
    let (merchant, subscriber, _token, _token_id, client, plan_id) = setup(&env);
    let sub_id = client.subscribe(&subscriber, &plan_id);

    client.cancel(&subscriber, &sub_id);
    assert!(!client.get_subscription(&sub_id).unwrap().active);

    // Merchant can also cancel.
    let sub_id2 = client.subscribe(&subscriber, &plan_id);
    client.cancel(&merchant, &sub_id2);
    assert!(!client.get_subscription(&sub_id2).unwrap().active);

    // Cannot cancel twice.
    let result = client.try_cancel(&subscriber, &sub_id);
    assert_eq!(result, Err(Ok(SubscriptionError::AlreadyCancelled)));
}
