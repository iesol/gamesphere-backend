import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from './tenant-context';

export const CurrentTenant = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext) => {
    return TenantContext.get();
  },
);
