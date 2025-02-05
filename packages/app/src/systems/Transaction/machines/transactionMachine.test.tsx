import { graphql } from 'msw';
import { interpret } from 'xstate';
import { waitFor } from 'xstate/lib/waitFor';

import { MOCK_TRANSACTION_WITH_RECEIPTS_GQL } from '../__mocks__/transaction';

import type { TransactionMachineService } from './transactionMachine';
import { transactionMachine } from './transactionMachine';

import { mockServer } from '~/mocks/server';

const TRANSACTION_ID =
  '0x64641e1faeb1b0052d95e055b085b45b85155a7ec8cc47b1c6b7ed9f2783837a';

mockServer([
  graphql.query('getTransactionWithReceipts', (_req, res, ctx) => {
    return res(ctx.data(MOCK_TRANSACTION_WITH_RECEIPTS_GQL));
  }),
]);

describe('transactionMachine', () => {
  let service: TransactionMachineService;

  beforeEach(async () => {
    service = interpret(transactionMachine.withContext({})).start();
  });

  afterEach(() => {
    service.stop();
  });

  it('should fetch transaction', async () => {
    await waitFor(service, (state) => state.matches('idle'));

    service.send('GET_TRANSACTION', { input: { txId: TRANSACTION_ID } });

    await waitFor(service, (state) => state.matches('fetching'));
    await waitFor(service, (state) => state.matches('fetchingResult'));
    await waitFor(service, (state) => state.matches('done'));
    await waitFor(service, (state) => Boolean(state.context.transaction));
    await waitFor(service, (state) => Boolean(state.context.transactionResult));
  });
});
