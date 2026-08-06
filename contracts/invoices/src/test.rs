#![cfg(test)]

use super::{InvoiceError, InvoicesContract, InvoicesContractClient};
use soroban_sdk::testutils::{Address as AddressUtils, Ledger};
use soroban_sdk::{token, Address, Env, String};

fn create_token<'e>(env: &'e Env, admin: &Address) -> (token::Client<'e>, Address) {
    let id = env.register_stellar_asset_contract(admin.clone());
    (token::Client::new(env, &id), id)
}

fn mint<'e>(env: &'e Env, token_id: &Address, to: &Address, amount: i128) {
    token::StellarAssetClient::new(env, token_id).mint(to, &amount);
}

type Setup<'e> = (Address, Address, token::Client<'e>, Address, InvoicesContractClient<'e>);

fn setup<'e>(env: &'e Env) -> Setup<'e> {
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000_000);
    let admin = Address::generate(env);
    let merchant = Address::generate(env);
    let customer = Address::generate(env);
    let (token, token_id) = create_token(env, &admin);
    let contract_id = env.register_contract(None, InvoicesContract);
    let client = InvoicesContractClient::new(env, &contract_id);
    mint(env, &token_id, &customer, &1000);
    (merchant, customer, token, token_id, client)
}

#[test]
fn test_create_and_pay() {
    let env = Env::default();
    let (merchant, customer, token, token_id, client) = setup(&env);

    let id = client.create(
        &merchant,
        &customer,
        &token_id,
        &250,
        &String::from_str(&env, "Order #123"),
        &0,
    );
    assert_eq!(id, 1);

    client.pay(&customer, &id);
    assert!(client.get_invoice(&id).unwrap().paid);
    assert_eq!(token.balance(&merchant), 250);
    assert_eq!(token.balance(&customer), 750);
}

#[test]
fn test_cannot_pay_twice() {
    let env = Env::default();
    let (_merchant, customer, token, token_id, client) = setup(&env);
    let merchant = Address::generate(&env);
    let id = client.create(&merchant, &customer, &token_id, &10, &String::from_str(&env, "x"), &0);
    client.pay(&customer, &id);

    let result = client.try_pay(&customer, &id);
    assert_eq!(result, Err(Ok(InvoiceError::AlreadyPaid)));
}

#[test]
fn test_wrong_payer_rejected() {
    let env = Env::default();
    let (merchant, _customer, token, token_id, client) = setup(&env);
    let stranger = Address::generate(&env);
    let customer = Address::generate(&env);
    let id = client.create(&merchant, &customer, &token_id, &10, &String::from_str(&env, "x"), &0);

    let result = client.try_pay(&stranger, &id);
    assert_eq!(result, Err(Ok(InvoiceError::PayerMismatch)));
}

#[test]
fn test_expired_invoice_cannot_be_paid() {
    let env = Env::default();
    let (merchant, customer, token, token_id, client) = setup(&env);

    // due = 1_000_100, paid at 1_000_200 -> expired
    let id = client.create(&merchant, &customer, &token_id, &10, &String::from_str(&env, "x"), &1_000_100);
    env.ledger().set_timestamp(1_000_200);

    let result = client.try_pay(&customer, &id);
    assert_eq!(result, Err(Ok(InvoiceError::Expired)));
}

#[test]
fn test_merchant_cancel() {
    let env = Env::default();
    let (merchant, customer, token, token_id, client) = setup(&env);
    let id = client.create(&merchant, &customer, &token_id, &10, &String::from_str(&env, "x"), &0);

    client.cancel(&merchant, &id);
    assert!(client.get_invoice(&id).unwrap().cancelled);

    let result = client.try_pay(&customer, &id);
    assert_eq!(result, Err(Ok(InvoiceError::AlreadyCancelled)));
}

#[test]
fn test_invoices_of_lists_ids() {
    let env = Env::default();
    let (merchant, customer, token, token_id, client) = setup(&env);
    let id1 = client.create(&merchant, &customer, &token_id, &1, &String::from_str(&env, "a"), &0);
    let id2 = client.create(&merchant, &customer, &token_id, &2, &String::from_str(&env, "b"), &0);

    let ids = client.invoices_of(&merchant);
    assert_eq!(ids.len(), 2);
    assert_eq!(ids.get(0).unwrap(), id1);
    assert_eq!(ids.get(1).unwrap(), id2);
}
