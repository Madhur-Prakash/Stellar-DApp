import {
  Horizon,
  Networks,
  TransactionBuilder,
  Operation,
  StrKey,
  Asset,
  Memo,
  BASE_FEE,
} from "@stellar/stellar-sdk";

export const TESTNET_URL = "https://horizon-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;

export const server = new Horizon.Server(TESTNET_URL);

export async function getXLMBalance(publicKey: string): Promise<string> {
  const account = await server.loadAccount(publicKey);
  const xlm = account.balances.find((b) => b.asset_type === "native");
  return xlm ? parseFloat(xlm.balance).toFixed(7) : "0.0000000";
}

export async function buildSendXLMTransaction(
  sourcePublicKey: string,
  destination: string,
  amount: string,
  memo?: string
): Promise<string> {
  const sourceAccount = await server.loadAccount(sourcePublicKey);

  const builder = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  builder.addOperation(
    Operation.payment({
      destination,
      asset: Asset.native(),
      amount,
    })
  );

  if (memo && memo.trim()) {
    builder.addMemo(Memo.text(memo.trim()));
  }

  builder.setTimeout(180);

  return builder.build().toXDR();
}

export async function submitTransaction(signedXDR: string): Promise<string> {
  const { TransactionBuilder } = await import("@stellar/stellar-sdk");
  const tx = TransactionBuilder.fromXDR(signedXDR, NETWORK_PASSPHRASE);
  const result = await server.submitTransaction(tx);
  return result.hash;
}

export function isValidStellarAddress(address: string): boolean {
  try {
    
    return StrKey.isValidEd25519PublicKey(address);
  } catch {
    return false;
  }
}

export function truncateAddress(address: string): string {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}
