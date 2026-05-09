import { createServer } from 'vite';

const server = await createServer({
  appType: 'custom',
  configFile: false,
  logLevel: 'error',
  optimizeDeps: {
    include: [],
    noDiscovery: true,
  },
  server: {
    hmr: false,
    middlewareMode: true,
  },
});

try {
  const { MANUAL_QUESTION_BANK_VALIDATION } = await server.ssrLoadModule('/src/app/data/questions.ts');
  const validation = MANUAL_QUESTION_BANK_VALIDATION;
  const failedDomains = validation.domains.filter((domain) => !domain.valid || domain.warnings.length > 0);

  console.log(`Manual question bank validation: ${validation.valid && validation.warnings.length === 0 ? 'PASSED' : 'FAILED'}`);
  console.log(`Domains: ${validation.totalDomains}`);
  console.log(`Questions: ${validation.totalQuestions}`);
  console.log(`Issues: ${validation.issues.length}`);
  console.log(`Warnings: ${validation.warnings.length}`);

  validation.domains.forEach((domain) => {
    const total = domain.counts.beginner + domain.counts.intermediate + domain.counts.advanced;
    console.log(
      `${domain.domainName}: beginner ${domain.counts.beginner}/20, intermediate ${domain.counts.intermediate}/20, advanced ${domain.counts.advanced}/20, total ${total}/60, duplicates ${
        domain.duplicateQuestionIds.length + domain.duplicateQuestionTexts.length === 0 ? 'passed' : 'failed'
      }, validation ${domain.valid && domain.warnings.length === 0 ? 'passed' : 'failed'}`,
    );
  });

  if (failedDomains.length > 0) {
    failedDomains.forEach((domain) => {
      domain.issues.forEach((issue) => console.error(`${domain.domainName}: ${issue}`));
      domain.warnings.forEach((warning) => console.error(`${domain.domainName}: ${warning}`));
      domain.nearDuplicateQuestionTexts.forEach((duplicate) =>
        console.error(`${domain.domainName}: near duplicate: ${duplicate}`),
      );
    });
    process.exitCode = 1;
  }
} finally {
  await server.close();
}
