import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { sampleSigningKey, ContractState } from '@midnight-ntwrk/compact-runtime';

let compiledContract: any;
let ledgerFunction: any;
const generatedModulePath = './managed/private-party/contract/index.js';

export async function getCompiledContract(): Promise<any> {
  if (!compiledContract) {
    const generated = await import(generatedModulePath);
    compiledContract = CompiledContract.withVacantWitnesses(
      CompiledContract.make('private-party-rsvp', generated.Contract),
    );
  }
  return compiledContract;
}

export async function getLedger(): Promise<any> {
  if (!ledgerFunction) {
    const generated = await import(generatedModulePath);
    ledgerFunction = generated.ledger;
  }
  return ledgerFunction;
}

export { ContractState, sampleSigningKey };
