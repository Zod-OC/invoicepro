import { useEffect, useLayoutEffect } from 'react';

/**
 * useLayoutEffect on the client, useEffect on the server. The App Router
 * prerenders client components at build time (output: 'export'), and React
 * warns when useLayoutEffect runs during SSR — even though it's a no-op there.
 * This swaps to useEffect during prerender to keep the build log clean while
 * preserving useLayoutEffect's pre-paint timing on the client (which is the
 * whole point: run the free-tier template clamp before the browser paints so a
 * free user never sees a one-frame Pro-template flash).
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;