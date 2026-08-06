#![cfg(test)]

use super::{MultisigContract, MultisigContractClient, MultisigError};
use soroban_sdk::testutils::Address as AddressUtils;
use soroban_sdk::{Address, Env, String, Vec, vec};

fn setup<'e>(env: &'e Env) -> (Vec<Address>, MultisigContractClient<'e>) {
    env.mock_all_auths();
    let alice = Address::generate(env);
    let bob = Address::generate(env);
    let carol = Address::generate(env);
    let signers = vec![env, alice, bob, carol];
    let contract_id = env.register_contract(None, MultisigContract);
    let client = MultisigContractClient::new(env, &contract_id);
    client.initialize(&signers, &2);
    (signers, client)
}

fn payload(env: &Env, bytes: &[u8]) -> Vec<u8> {
    let mut v = Vec::new(env);
    for b in bytes {
        v.push_back(*b);
    }
    v
}

#[test]
fn test_initializes_with_threshold() {
    let env = Env::default();
    let (signers, client) = setup(&env);
    assert_eq!(client.threshold(), 2);
    assert_eq!(client.signers().len(), 3);
    assert_eq!(client.signers(), signers);
}

#[test]
fn test_submit_and_approve_to_quorum() {
    let env = Env::default();
    let (signers, client) = setup(&env);
    let alice = signers.get(0).unwrap();
    let bob = signers.get(1).unwrap();

    let id = client.submit(&alice, &String::from_str(&env, "withdraw"), &payload(&env, &[1, 2, 3]));
    assert_eq!(id, 1);

    // Single approval is below the quorum.
    client.approve(&alice, &id);
    let result = client.try_execute(&alice, &id);
    assert_eq!(result, Err(Ok(MultisigError::QuorumNotReached)));

    // Second approval reaches quorum and execution succeeds.
    client.approve(&bob, &id);
    client.execute(&bob, &id);
    let proposal = client.get_proposal(&id).unwrap();
    assert!(proposal.executed);

    // Cannot execute twice.
    let result = client.try_execute(&bob, &id);
    assert_eq!(result, Err(Ok(MultisigError::AlreadyExecuted)));
}

#[test]
fn test_reject_prevents_quorum() {
    let env = Env::default();
    let (signers, client) = setup(&env);
    let alice = signers.get(0).unwrap();
    let bob = signers.get(1).unwrap();

    let id = client.submit(&alice, &String::from_str(&env, "withdraw"), &payload(&env, &[1]));
    client.approve(&alice, &id);
    client.reject(&bob, &id);

    // Approvals: 1, rejects: 1 -> quorum (2 approvals) not reached.
    let result = client.try_execute(&alice, &id);
    assert_eq!(result, Err(Ok(MultisigError::QuorumNotReached)));
}

#[test]
fn test_cannot_vote_twice() {
    let env = Env::default();
    let (signers, client) = setup(&env);
    let alice = signers.get(0).unwrap();

    let id = client.submit(&alice, &String::from_str(&env, "x"), &payload(&env, &[0]));
    client.approve(&alice, &id);
    let result = client.try_approve(&alice, &id);
    assert_eq!(result, Err(Ok(MultisigError::AlreadyVoted)));
}

#[test]
fn test_non_signer_cannot_submit() {
    let env = Env::default();
    let (_signers, client) = setup(&env);
    let outsider = Address::generate(&env);

    let result = client.try_submit(&outsider, &String::from_str(&env, "x"), &payload(&env, &[0]));
    assert_eq!(result, Err(Ok(MultisigError::NotASigner)));
}

#[test]
fn test_invalid_threshold_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let a = Address::generate(&env);
    let signers = vec![&env, a];
    let contract_id = env.register_contract(None, MultisigContract);
    let client = MultisigContractClient::new(&env, &contract_id);

    // Threshold 0 and threshold above signer count are invalid.
    let result = client.try_initialize(&signers, &0);
    assert_eq!(result, Err(Ok(MultisigError::InvalidThreshold)));
    let result = client.try_initialize(&signers, &5);
    assert_eq!(result, Err(Ok(MultisigError::InvalidThreshold)));
}
