import { spawnSync } from 'node:child_process';

const cases = [
  ['validation-and-pipeline', 'bun', ['test', 'src/modules/crm/__tests__/validation.test.ts']],
  ['lead-to-deal-transaction', 'node', ['scripts/uat-crm-lead-deal.mjs']],
  ['deal-to-offer-snapshot', 'node', ['scripts/uat-crm-deal-offer.mjs']],
  ['closing-rules', 'node', ['scripts/uat-crm-closing-rules.mjs']],
  ['activities-and-timeline', 'node', ['scripts/uat-crm-activities.mjs']],
  ['reminder-idempotency', 'node', ['scripts/uat-crm-reminders.mjs']],
  ['communications', 'node', ['scripts/uat-crm-communications.mjs']],
  ['automation-idempotency', 'node', ['scripts/uat-crm-automation.mjs']],
  ['permissions-and-owner-scope', 'node', ['scripts/uat-crm-permissions.mjs']],
  ['dashboard-consistency', 'node', ['scripts/uat-crm-dashboard.mjs']],
  ['reports-and-filters', 'node', ['scripts/uat-crm-reports.mjs']],
  ['saved-view-scope', 'node', ['scripts/uat-crm-saved-views.mjs']],
  ['audit-before-after', 'node', ['scripts/uat-crm-audit.mjs']],
  ['erp-cross-flow', 'node', ['scripts/uat-crm-erp-flow.mjs']],
];

const results=[];
for(const [name,command,args] of cases){
  const started=Date.now();
  const result=spawnSync(command,args,{cwd:process.cwd(),env:process.env,encoding:'utf8',timeout:120_000});
  const ok=result.status===0&&!result.error;
  results.push({name,ok,durationMs:Date.now()-started});
  const output=`${result.stdout??''}${result.stderr??''}`.trim();
  if(output)process.stdout.write(`[${name}] ${output}\n`);
  if(!ok){
    console.error(JSON.stringify({ok:false,failed:name,error:result.error?.message??null,results}));
    process.exit(result.status||1);
  }
}
console.log(JSON.stringify({ok:true,total:results.length,results}));
