#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, Map, String, Vec, vec};

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
#[repr(u32)]
pub enum InvoiceError {
    Unauthorized = 1, InvalidAmount = 2, InvoiceNotFound = 3,
    AlreadyPaid = 4, AlreadyCancelled = 5, Expired = 6, PayerMismatch = 7,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum DataKey { NextInvoice, Invoices, MerchantInvoices }

#[contracttype]
#[derive(Clone, Debug)]
pub struct Invoice {
    pub id: u64, pub merchant: Address, pub customer: Address, pub token: Address,
    pub amount: i128, pub description: String, pub due: u64, pub paid: bool, pub cancelled: bool,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct IssuedEvent { pub id: u64, pub merchant: Address, pub customer: Address, pub amount: i128 }
#[contracttype]
#[derive(Clone, Debug)]
pub struct PaidEvent { pub id: u64, pub payer: Address, pub merchant: Address, pub amount: i128 }
#[contracttype]
#[derive(Clone, Debug)]
pub struct CancelledEvent { pub id: u64, pub merchant: Address }

#[contract]
pub struct InvoicesContract;

#[contractimpl]
impl InvoicesContract {
    pub fn create(env: Env, merchant: Address, customer: Address, token: Address, amount: i128, description: String, due: u64) -> Result<u64, InvoiceError> {
        if amount <= 0 { return Err(InvoiceError::InvalidAmount); }
        merchant.require_auth();
        let mut next: u64 = env.storage().instance().get(&DataKey::NextInvoice).unwrap_or(1);
        let mut invoices: Map<u64, Invoice> = env.storage().instance().get(&DataKey::Invoices).unwrap_or_else(|| Map::new(&env));
        let mut merchant_invoices: Map<Address, Vec<u64>> = env.storage().instance().get(&DataKey::MerchantInvoices).unwrap_or_else(|| Map::new(&env));
        let invoice = Invoice { id: next, merchant: merchant.clone(), customer: customer.clone(), token: token.clone(), amount, description, due, paid: false, cancelled: false };
        invoices.set(next, invoice.clone());
        let mut list = merchant_invoices.get(merchant.clone()).unwrap_or_else(|| vec![&env]);
        list.push_back(next); merchant_invoices.set(merchant.clone(), list);
        next += 1;
        env.storage().instance().set(&DataKey::NextInvoice, &next);
        env.storage().instance().set(&DataKey::Invoices, &invoices);
        env.storage().instance().set(&DataKey::MerchantInvoices, &merchant_invoices);
        env.storage().instance().extend_ttl(5000, 5000);
        env.events().publish((symbol_short!("issued"),), IssuedEvent { id: invoice.id, merchant, customer, amount });
        Ok(invoice.id)
    }

    pub fn pay(env: Env, payer: Address, invoice_id: u64) -> Result<(), InvoiceError> {
        let mut invoices: Map<u64, Invoice> = env.storage().instance().get(&DataKey::Invoices).unwrap_or_else(|| Map::new(&env));
        let mut invoice = invoices.get(invoice_id).ok_or(InvoiceError::InvoiceNotFound)?;
        if invoice.paid { return Err(InvoiceError::AlreadyPaid); }
        if invoice.cancelled { return Err(InvoiceError::AlreadyCancelled); }
        if invoice.due > 0 && env.ledger().timestamp() > invoice.due { return Err(InvoiceError::Expired); }
        if payer != invoice.customer { return Err(InvoiceError::PayerMismatch); }
        payer.require_auth();
        let to = invoice.merchant.clone();
        token::Client::new(&env, &invoice.token).transfer(&payer, &to, &invoice.amount);
        invoice.paid = true; invoices.set(invoice_id, invoice.clone());
        env.storage().instance().set(&DataKey::Invoices, &invoices);
        env.storage().instance().extend_ttl(5000, 5000);
        env.events().publish((symbol_short!("paid"),), PaidEvent { id: invoice_id, payer, merchant: to, amount: invoice.amount });
        Ok(())
    }

    pub fn cancel(env: Env, merchant: Address, invoice_id: u64) -> Result<(), InvoiceError> {
        let mut invoices: Map<u64, Invoice> = env.storage().instance().get(&DataKey::Invoices).unwrap_or_else(|| Map::new(&env));
        let mut invoice = invoices.get(invoice_id).ok_or(InvoiceError::InvoiceNotFound)?;
        if invoice.merchant != merchant { return Err(InvoiceError::Unauthorized); }
        merchant.require_auth();
        if invoice.paid { return Err(InvoiceError::AlreadyPaid); }
        if invoice.cancelled { return Err(InvoiceError::AlreadyCancelled); }
        invoice.cancelled = true; invoices.set(invoice_id, invoice.clone());
        env.storage().instance().set(&DataKey::Invoices, &invoices);
        env.events().publish((symbol_short!("cancel"),), CancelledEvent { id: invoice_id, merchant });
        Ok(())
    }

    pub fn get_invoice(env: Env, id: u64) -> Option<Invoice> {
        env.storage().instance().get::<_, Map<u64, Invoice>>(&DataKey::Invoices).and_then(|i| i.get(id))
    }

    pub fn invoices_of(env: Env, merchant: Address) -> Vec<u64> {
        env.storage().instance().get::<_, Map<Address, Vec<u64>>>(&DataKey::MerchantInvoices).and_then(|m| m.get(merchant)).unwrap_or_else(|| vec![&env])
    }
}
