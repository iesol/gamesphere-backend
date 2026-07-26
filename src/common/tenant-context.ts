import { AsyncLocalStorage } from 'async_hooks';

const als = new AsyncLocalStorage<string | undefined>();

export class TenantContext {
  static set(orgId: string | undefined) {
    als.enterWith(orgId);
  }

  static get(): string | undefined {
    return als.getStore();
  }
}
