# @stellar-pay/ui

Shared shadcn/ui-style React components built on Radix primitives, styled with
Tailwind v4 and `class-variance-authority`.

```tsx
import { Button, Card, CardContent, Badge, Dialog, DialogContent } from '@stellar-pay/ui';
```

## Theme tokens

Components use semantic tokens (`background`, `foreground`, `primary`,
`secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`,
`card`, `popover`). Each app maps them to CSS variables in its `globals.css`
using Tailwind v4 `@theme inline`, and includes the package source in its
Tailwind scan with:

```css
@source "../../../../packages/ui/src";
```
