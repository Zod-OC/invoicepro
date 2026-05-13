#!/usr/bin/env bash
cd /root/projects/invoicepro
export TEST_URL=https://billify.me
npx playwright test tests/visual-regression.spec.ts tests/e2e-app.spec.ts --project chromium 2>&1 | tail -30
