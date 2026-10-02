import { SetMetadata } from '@nestjs/common';

export const PUBLIC_KEY = 'isPublic';

// Marks a route or controller as publicly accessible — bypasses JwtAuthGuard.
// Uses SetMetadata directly so the value is always boolean true, not undefined.
// Reflector.createDecorator stores whatever value you pass; called as @Public()
// with no arguments it stores undefined, which is falsy and bypasses nothing.
export const Public = () => SetMetadata(PUBLIC_KEY, true);
