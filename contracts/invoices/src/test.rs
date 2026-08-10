#![cfg(test)]

use super::{InvoicesContract, InvoicesContractClient, InvoiceError};
use soroban_sdk::testutils::{Address as AddressUtils, Ledger};
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
    token::Client<'e>,
    Address,
    InvoicesContractClient<'e>,
);

fn setup<'e>(env: &'e Env) -> Setup<'e> {
    env.mock_all_auths();
    let merchant = Address::generate(env);
    let customer = Address::generate(env);
    let admin = Address::generate(env);
    let (token, token_id) = create_token(env, &admin);
    let contract_id = env.register_contract(None, InvoicesContract);
    let client = InvoicesContractClient::new(env, &contract_id);
    mint(env, &token_id, &customer, 10_000i128);
    (merchant, customer, token, token_id, client)
}

fn create_invoice<'e>(
    env: &'e Env,
    client: &InvoicesContractClient<'e>,
    merchant: &Address,
    customer: &Address,
    token_id: &Address,
    amount: i128,
    due: u64,
) -> u64 {
    client
        .create(
            merchant,
            customer,
            token_id,
            &amount,
            &String::from_str(env, "Test invoice"),
            &due,
        )
}

// ------------------------------------------------------------------ Create

#[test]
fn test_create_invoice() {
    let env = Env::default();
    let (merchant, customer, _token, token_id, client) = setup(&env);

    let id = create_invoice(&env, &client, &merchant, &customer, &token_id, 500, 1000);
    assert_eq!(id, 1);

    let invoice = client.get_invoice(&id).unwrap();
    assert_eq!(invoice.merchant, merchant);
    assert_eq!(invoice.customer, customer);
    assert_eq!(invoice.amount, 500);
    assert!(!invoice.paid);
    assert!(!invoice.cancelled);
}

#[test]
fn test_create_rejects_zero_amount() {
    let env = Env::default();
    let (merchant, customer, _token, token_id, client) = setup(&env);

    let result = client.try_create(
        &merchant,
        &customer,
        &token_id,
        &0,
        &String::from_str(&env, ""),
        &0u64,
    );
    assert_eq!(result, Err(Ok(InvoiceError::InvalidAmount)));
}

#[test]
fn test_create_multiple_invoices() {
    let env = Env::default();
    let (merchant, customer, _token, token_id, client) = setup(&env);

    let id1 = create_invoice(&env, &client, &merchant, &customer, &token_id, 100, 0);
    let id2 = create_invoice(&env, &client, &merchant, &customer, &token_id, 200, 0);
    assert_eq!(id1, 1);
    assert_eq!(id2, 2);
    assert!(client.get_invoice(&1).is_some());
    assert!(client.get_invoice(&2).is_some());
}

// ------------------------------------------------------------------ Pay

#[test]
fn test_pay_invoice_transfers_funds() {
    let env = Env::default();
    let (merchant, customer, token, token_id, client) = setup(&env);

    let id = create_invoice(&env, &client, &merchant, &customer, &token_id, 500, 0);
    let bal_before = token.balance(&merchant);

    client.pay(&customer, &id);
    assert_eq!(token.balance(&merchant), bal_before + 500);
    assert!(client.get_invoice(&id).unwrap().paid);
}

#[test]
fn test_pay_rejects_wrong_payer() {
    let env = Env::default();
    let (merchant, customer, _token, token_id, client) = setup(&env);
    let id = create_invoice(&env, &client, &merchant, &customer, &token_id, 500, 0);

    let stranger = Address::generate(&env);
    mint(&env, &token_id, &stranger, 1000i128);
    let result = client.try_pay(&stranger, &id);
    assert_eq!(result, Err(Ok(InvoiceError::PayerMismatch)));
}

#[test]
fn test_pay_rejects_already_paid() {
    let env = Env::default();
    let (merchant, customer, _token, token_id, client) = setup(&env);
    let id = create_invoice(&env, &client, &merchant, &customer, &token_id, 500, 0);

    client.pay(&customer, &id);
    let result = client.try_pay(&customer, &id);
    assert_eq!(result, Err(Ok(InvoiceError::AlreadyPaid)));
}

#[test]
fn test_pay_rejects_cancelled_invoice() {
    let env = Env::default();
    let (merchant, customer, _token, token_id, client) = setup(&env);
    let id = create_invoice(&env, &client, &merchant, &customer, &token_id, 500, 0);

    client.cancel(&merchant, &id);
    let result = client.try_pay(&customer, &id);
    assert_eq!(result, Err(Ok(InvoiceError::AlreadyCancelled)));
}

#[test]
fn test_pay_rejects_expired_invoice() {
    let env = Env::default();
    let (merchant, customer, _token, token_id, client) = setup(&env);
    env.ledger().set_timestamp(100);
    let id = create_invoice(&env, &client, &merchant, &customer, &token_id, 500, 500);

    env.ledger().set_timestamp(501);
    let result = client.try_pay(&customer, &id);
    assert_eq!(result, Err(Ok(InvoiceError::Expired)));
}

#[test]
fn test_pay_rejects_unknown_invoice() {
    let env = Env::default();
    let (_merchant, customer, _token, _token_id, client) = setup(&env);

    let result = client.try_pay(&customer, &999);
    assert_eq!(result, Err(Ok(InvoiceError::InvoiceNotFound)));
}

// ------------------------------------------------------------------ Cancel

#[test]
fn test_cancel_invoice() {
    let env = Env::default();
    let (merchant, customer, _token, token_id, client) = setup(&env);
    let id = create_invoice(&env, &client, &merchant, &customer, &token_id, 500, 0);

    client.cancel(&merchant, &id);
    assert!(client.get_invoice(&id).unwrap().cancelled);
}

#[test]
fn test_cancel_rejects_unauthorized() {
    let env = Env::default();
    let (merchant, customer, _token, token_id, client) = setup(&env);
    let id = create_invoice(&env, &client, &merchant, &customer, &token_id, 500, 0);

    let stranger = Address::generate(&env);
    let result = client.try_cancel(&stranger, &id);
    assert_eq!(result, Err(Ok(InvoiceError::Unauthorized)));
}

#[test]
fn test_cancel_rejects_already_paid() {
    let env = Env::default();
    let (merchant, customer, _token, token_id, client) = setup(&env);
    let id = create_invoice(&env, &client, &merchant, &customer, &token_id, 500, 0);

    client.pay(&customer, &id);
    let result = client.try_cancel(&merchant, &id);
    assert_eq!(result, Err(Ok(InvoiceError::AlreadyPaid)));
}

#[test]
fn test_cancel_rejects_unknown_invoice() {
    let env = Env::default();
    let (merchant, _customer, _token, _token_id, client) = setup(&env);

    let result = client.try_cancel(&merchant, &999);
    assert_eq!(result, Err(Ok(InvoiceError::InvoiceNotFound)));
}

#[test]
fn test_cannot_cancel_twice() {
    let env = Env::default();
    let (merchant, customer, _token, token_id, client) = setup(&env);
    let id = create_invoice(&env, &client, &merchant, &customer, &token_id, 500, 0);

    client.cancel(&merchant, &id);
    let result = client.try_cancel(&merchant, &id);
    assert_eq!(result, Err(Ok(InvoiceError::AlreadyCancelled)));
}

// ------------------------------------------------------------------ Queries

#[test]
fn test_invoices_of_returns_merchant_invoices() {
    let env = Env::default();
    let (merchant, customer, _token, token_id, client) = setup(&env);
    let id1 = create_invoice(&env, &client, &merchant, &customer, &token_id, 100, 0);
    let id2 = create_invoice(&env, &client, &merchant, &customer, &token_id, 200, 0);

    let list = client.invoices_of(&merchant);
    assert_eq!(list.len(), 2);
    assert!(list.contains(id1));
    assert!(list.contains(id2));
}

#[test]
fn test_invoices_of_empty_for_unknown() {
    let env = Env::default();
    let (_merchant, _customer, _token, _token_id, client) = setup(&env);
    let stranger = Address::generate(&env);

    let list = client.invoices_of(&stranger);
    assert_eq!(list.len(), 0);
}

#[test]
fn test_get_invoice_returns_none_for_unknown() {
    let env = Env::default();
    let (_merchant, _customer, _token, _token_id, client) = setup(&env);

    assert!(client.get_invoice(&999).is_none());
}
