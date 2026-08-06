#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, Map, Vec, vec, Bytes};

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
#[repr(u32)]
pub enum MultisigError {
    Unauthorized = 1, NotASigner = 2, InvalidThreshold = 3, ProposalNotFound = 4,
    AlreadyVoted = 5, AlreadyExecuted = 6, QuorumNotReached = 7, NotInitialized = 8,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum DataKey { Signers, Threshold, NextProposal, Proposals }

#[contracttype]
#[derive(Clone, Debug)]
pub struct Proposal {
    pub id: u64, pub submitter: Address, pub description: soroban_sdk::String,
    pub data: Bytes, pub approvals: Map<Address, bool>, pub executed: bool,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct ProposalCreatedEvent { pub id: u64, pub submitter: Address }
#[contracttype]
#[derive(Clone, Debug)]
pub struct ApprovedEvent { pub id: u64, pub signer: Address }
#[contracttype]
#[derive(Clone, Debug)]
pub struct RejectedEvent { pub id: u64, pub signer: Address }
#[contracttype]
#[derive(Clone, Debug)]
pub struct ExecutedEvent { pub id: u64 }
#[contracttype]
#[derive(Clone, Debug)]
pub struct SignersChangedEvent { pub signers: Vec<Address>, pub threshold: u32 }

#[contract]
pub struct MultisigContract;

#[contractimpl]
impl MultisigContract {
    pub fn initialize(env: Env, signers: Vec<Address>, threshold: u32) -> Result<(), MultisigError> {
        if env.storage().instance().has(&DataKey::Signers) { panic!("already initialized"); }
        if threshold == 0 || threshold > signers.len() as u32 { return Err(MultisigError::InvalidThreshold); }
        env.storage().instance().set(&DataKey::Signers, &signers);
        env.storage().instance().set(&DataKey::Threshold, &threshold);
        env.storage().instance().set(&DataKey::NextProposal, &1u64);
        env.storage().instance().set(&DataKey::Proposals, &Map::<u64, Proposal>::new(&env));
        env.storage().instance().extend_ttl(5000, 5000);
        Ok(())
    }

    pub fn signers(env: Env) -> Vec<Address> {
        env.storage().instance().get(&DataKey::Signers).unwrap_or_else(|| vec![&env])
    }

    pub fn threshold(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Threshold).unwrap_or(0)
    }

    pub fn add_signer(env: Env, caller: Address, new_signer: Address) -> Result<(), MultisigError> {
        Self::require_signer(&env, &caller)?; caller.require_auth();
        let mut signers = Self::signers(env.clone());
        if signers.contains(&new_signer) { return Ok(()); }
        signers.push_back(new_signer);
        env.storage().instance().set(&DataKey::Signers, &signers);
        env.events().publish((symbol_short!("signers"),), SignersChangedEvent { signers: signers.clone(), threshold: Self::threshold(env.clone()) });
        Ok(())
    }

    pub fn remove_signer(env: Env, caller: Address, signer_to_remove: Address) -> Result<(), MultisigError> {
        Self::require_signer(&env, &caller)?; caller.require_auth();
        let signers = Self::signers(env.clone());
        let mut filtered: Vec<Address> = Vec::new(&env);
        for s in signers.iter() { if s != signer_to_remove { filtered.push_back(s); } }
        if (filtered.len() as u32) < Self::threshold(env.clone()) { return Err(MultisigError::InvalidThreshold); }
        env.storage().instance().set(&DataKey::Signers, &filtered);
        env.events().publish((symbol_short!("signers"),), SignersChangedEvent { signers: filtered.clone(), threshold: Self::threshold(env.clone()) });
        Ok(())
    }

    pub fn submit(env: Env, submitter: Address, description: soroban_sdk::String, data: Bytes) -> Result<u64, MultisigError> {
        Self::require_signer(&env, &submitter)?; submitter.require_auth();
        let mut next: u64 = env.storage().instance().get(&DataKey::NextProposal).unwrap_or(1);
        let mut proposals: Map<u64, Proposal> = env.storage().instance().get(&DataKey::Proposals).unwrap_or_else(|| Map::new(&env));
        let proposal = Proposal { id: next, submitter: submitter.clone(), description, data, approvals: Map::new(&env), executed: false };
        proposals.set(next, proposal.clone()); next += 1;
        env.storage().instance().set(&DataKey::NextProposal, &next);
        env.storage().instance().set(&DataKey::Proposals, &proposals);
        env.events().publish((symbol_short!("prop"),), ProposalCreatedEvent { id: proposal.id, submitter });
        Ok(proposal.id)
    }

    pub fn approve(env: Env, signer: Address, id: u64) -> Result<(), MultisigError> {
        Self::vote(&env, &signer, id, true)
    }

    pub fn reject(env: Env, signer: Address, id: u64) -> Result<(), MultisigError> {
        Self::vote(&env, &signer, id, false)
    }

    pub fn execute(env: Env, caller: Address, id: u64) -> Result<(), MultisigError> {
        Self::require_signer(&env, &caller)?; caller.require_auth();
        let mut proposals: Map<u64, Proposal> = env.storage().instance().get(&DataKey::Proposals).unwrap_or_else(|| Map::new(&env));
        let mut proposal = proposals.get(id).ok_or(MultisigError::ProposalNotFound)?;
        if proposal.executed { return Err(MultisigError::AlreadyExecuted); }
        if Self::approval_count(&proposal) < Self::threshold(env.clone()) { return Err(MultisigError::QuorumNotReached); }
        proposal.executed = true; proposals.set(id, proposal);
        env.storage().instance().set(&DataKey::Proposals, &proposals);
        env.events().publish((symbol_short!("exec"),), ExecutedEvent { id });
        Ok(())
    }

    pub fn get_proposal(env: Env, id: u64) -> Option<Proposal> {
        env.storage().instance().get::<_, Map<u64, Proposal>>(&DataKey::Proposals).and_then(|p| p.get(id))
    }

    fn require_signer(env: &Env, caller: &Address) -> Result<(), MultisigError> {
        let signers: Vec<Address> = env.storage().instance().get(&DataKey::Signers).ok_or(MultisigError::NotInitialized)?;
        if !signers.contains(caller) { return Err(MultisigError::NotASigner); }
        Ok(())
    }

    fn vote(env: &Env, signer: &Address, id: u64, approve: bool) -> Result<(), MultisigError> {
        Self::require_signer(env, signer)?; signer.require_auth();
        let mut proposals: Map<u64, Proposal> = env.storage().instance().get(&DataKey::Proposals).unwrap_or_else(|| Map::new(env));
        let mut proposal = proposals.get(id).ok_or(MultisigError::ProposalNotFound)?;
        if proposal.executed { return Err(MultisigError::AlreadyExecuted); }
        if proposal.approvals.contains_key(signer.clone()) { return Err(MultisigError::AlreadyVoted); }
        proposal.approvals.set(signer.clone(), approve); proposals.set(id, proposal);
        env.storage().instance().set(&DataKey::Proposals, &proposals);
        if approve {
            env.events().publish((symbol_short!("approve"),), ApprovedEvent { id, signer: signer.clone() });
        } else {
            env.events().publish((symbol_short!("reject"),), RejectedEvent { id, signer: signer.clone() });
        }
        Ok(())
    }

    fn approval_count(proposal: &Proposal) -> u32 {
        let mut count: u32 = 0;
        for v in proposal.approvals.values() { if v { count += 1; } }
        count
    }
}
