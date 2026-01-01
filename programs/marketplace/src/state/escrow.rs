use anchor_lang::prelude::*;

#[account]
pub struct Escrow {
    /// Listing this escrow belongs to
    pub listing: Pubkey,

    /// Buyer who funded the escrow
    pub buyer: Pubkey,

    /// Amount escrowed (lamports)
    pub amount: u64,

    /// Whether escrow is settled
    pub settled: bool,

    /// PDA bump
    pub bump: u8,
}

impl Escrow {
    pub const LEN: usize =
        8 +   // discriminator
        32 +  // listing
        32 +  // buyer
        8 +   // amount
        1 +   // settled
        1;    // bump
}
