// MCP API client - read-only data fetching
const MCP_API_URL = import.meta.env.VITE_MCP_API_URL || 'http://localhost:8080';

export class McpClient {
  private baseUrl: string;

  constructor(baseUrl: string = MCP_API_URL) {
    this.baseUrl = baseUrl;
  }

  async getListingState(listingPda: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/resources/get_listing_state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_pda: listingPda }),
    });
    if (!response.ok) throw new Error(`MCP error: ${response.statusText}`);
    return response.json();
  }

  async getEscrowState(escrowPda: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/resources/get_escrow_state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escrow_pda: escrowPda }),
    });
    if (!response.ok) throw new Error(`MCP error: ${response.statusText}`);
    return response.json();
  }

  async getListingSummary(nftMint: string, seller: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/resources/get_listing_summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nft_mint: nftMint, seller }),
    });
    if (!response.ok) throw new Error(`MCP error: ${response.statusText}`);
    return response.json();
  }

  async simulatePurchase(listingPda: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/tools/simulate_purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_pda: listingPda }),
    });
    if (!response.ok) throw new Error(`MCP error: ${response.statusText}`);
    return response.json();
  }

  async validateListing(listingPda: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/tools/validate_listing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_pda: listingPda }),
    });
    if (!response.ok) throw new Error(`MCP error: ${response.statusText}`);
    return response.json();
  }
}

export const mcpClient = new McpClient();
