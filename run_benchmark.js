import fs from 'fs';

// Controlled Validation Benchmark Runner for AI Crime Analytics

const dataset = JSON.parse(fs.readFileSync('./benchmark_dataset.json', 'utf8'));

async function runBenchmark() {
  console.log('================================================================================');
  console.log('       AI CRIME INVESTIGATION SIMULATOR — CONTROLLED VALIDATION BENCHMARK       ');
  console.log('================================================================================\n');
  console.log(`Loaded ${dataset.length} Gold-Standard Benchmark FIR Test Cases.\n`);

  let totalAssertions = 0;
  let passedAssertions = 0;

  let metricTotals = {
    entity: { total: 0, passed: 0 },
    crimeClassification: { total: 0, passed: 0 },
    evidenceLinking: { total: 0, passed: 0 },
    timeline: { total: 0, passed: 0 },
    contradiction: { total: 0, passed: 0 },
    roleClassification: { total: 0, passed: 0 },
    caseIsolation: { total: 0, passed: 0 },
    riskRanking: { total: 0, passed: 0 }
  };

  let testCaseResults = [];
  let previousCaseOutput = null;

  for (let i = 0; i < dataset.length; i++) {
    const tc = dataset[i];
    console.log(`[TEST ${i + 1}/${dataset.length}] ${tc.id}: ${tc.name}`);

    // 1. Create Case in Backend
    const createRes = await fetch('http://localhost:8080/api/v1/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseNumber: `BENCH-${tc.id}-${Date.now()}`,
        title: tc.name,
        type: tc.caseType,
        priority: 'HIGH',
        incidentDate: '2026-08-19',
        locationName: tc.locationName,
        description: tc.narrative
      })
    });
    const c = await createRes.json();

    // 2. Run NLP Analysis Pipeline
    const analyzeRes = await fetch(`http://localhost:8080/api/v1/cases/${c.id}/analyze`, { method: 'POST' });
    const analyzed = await analyzeRes.json();
    const a = analyzed.analysis;

    let tcPassed = true;
    let tcErrors = [];

    function assertCondition(metricName, condition, failMsg) {
      metricTotals[metricName].total++;
      totalAssertions++;
      if (condition) {
        metricTotals[metricName].passed++;
        passedAssertions++;
      } else {
        tcPassed = false;
        tcErrors.push(`[${metricName}] ${failMsg}`);
      }
    }

    // --- A. CRIME CLASSIFICATION ASSERTIONS ---
    const actualPrimaryCrime = (a.primary_crime || a.crimeClassification?.name || '').toLowerCase();
    const expectedPrimaryLow = tc.expected.primaryCrime.toLowerCase();
    const primaryMatches = actualPrimaryCrime.includes(expectedPrimaryLow.split('/')[0].trim().toLowerCase()) ||
                           expectedPrimaryLow.includes(actualPrimaryCrime.split('/')[0].trim().toLowerCase());
    assertCondition(
      'crimeClassification',
      primaryMatches,
      `Primary Crime mismatch. Expected '${tc.expected.primaryCrime}', Got '${a.primary_crime}'`
    );

    // --- B. ROLE & VICTIM CLASSIFICATION ASSERTIONS ---
    const actualVictims = (a.victims || []).map(v => v.name.toLowerCase());
    const actualSuspects = (a.suspect_rankings || []).map(s => s.name);
    const actualSuspectsLow = actualSuspects.map(s => s.toLowerCase());
    const actualWitnesses = (a.witnesses || []).map(w => w.toLowerCase());

    // Expected Victims
    for (const expVic of tc.expected.victims) {
      assertCondition(
        'roleClassification',
        actualVictims.includes(expVic.toLowerCase()),
        `Expected victim '${expVic}' was not detected in victims list.`
      );
      assertCondition(
        'roleClassification',
        !actualSuspectsLow.includes(expVic.toLowerCase()),
        `Victim '${expVic}' was incorrectly placed into suspects matrix!`
      );
    }

    // Check count of victims
    assertCondition(
      'roleClassification',
      actualVictims.length === tc.expected.victims.length,
      `Victim count mismatch. Expected ${tc.expected.victims.length}, Got ${actualVictims.length}`
    );

    // Expected Suspects
    for (const expSus of tc.expected.suspects) {
      assertCondition(
        'roleClassification',
        actualSuspectsLow.includes(expSus.toLowerCase()),
        `Expected suspect '${expSus}' was missing from suspects matrix.`
      );
    }
    assertCondition(
      'roleClassification',
      actualSuspects.length === tc.expected.suspects.length,
      `Suspect count mismatch. Expected ${tc.expected.suspects.length} (${tc.expected.suspects.join(', ')}), Got ${actualSuspects.length} (${actualSuspects.join(', ')})`
    );

    // Expected Witnesses (Must NOT be in suspects)
    for (const expWit of tc.expected.witnesses) {
      assertCondition(
        'roleClassification',
        !actualSuspectsLow.includes(expWit.toLowerCase()),
        `Witness '${expWit}' was falsely added to suspects matrix!`
      );
    }

    // --- C. ENTITY TYPE PURITY ASSERTIONS ---
    // Zero Job Titles or Organizations in Suspects
    for (const jt of (a.job_titles || [])) {
      assertCondition(
        'entity',
        !actualSuspectsLow.includes(jt.toLowerCase()),
        `Job Title '${jt}' was incorrectly added as a suspect!`
      );
    }
    for (const org of (a.organizations || [])) {
      assertCondition(
        'entity',
        !actualSuspectsLow.includes(org.toLowerCase()),
        `Organization '${org}' was incorrectly added as a suspect!`
      );
    }
    for (const loc of (a.locations || [])) {
      assertCondition(
        'entity',
        !actualSuspectsLow.includes(loc.toLowerCase()),
        `Location '${loc}' was incorrectly added as a suspect!`
      );
    }

    // Expected Organizations
    for (const expOrg of tc.expected.organizations) {
      const orgPresent = (a.organizations || []).some(o => o.toLowerCase().includes(expOrg.toLowerCase()) || expOrg.toLowerCase().includes(o.toLowerCase()));
      assertCondition(
        'entity',
        orgPresent,
        `Expected organization '${expOrg}' was not detected.`
      );
    }

    // --- D. EVIDENCE LINKING ASSERTIONS ---
    const evList = a.evidence_vault || a.evidence || [];
    assertCondition(
      'evidenceLinking',
      evList.length > 0,
      `No evidence items extracted from narrative.`
    );

    if (tc.expected.expectedEvidenceLinks) {
      for (const [evKeyword, expPerson] of Object.entries(tc.expected.expectedEvidenceLinks)) {
        const matchingEv = evList.find(e =>
          (e.title + ' ' + e.details + ' ' + e.category).toLowerCase().includes(evKeyword.toLowerCase())
        );
        if (matchingEv) {
          const linkedPerson = (matchingEv.related_suspect || matchingEv.linkedPerson || '').toLowerCase();
          assertCondition(
            'evidenceLinking',
            linkedPerson.includes(expPerson.toLowerCase()),
            `Evidence '${matchingEv.title}' link mismatch. Expected '${expPerson}', Got '${matchingEv.related_suspect}'`
          );
        }
      }
    }

    // --- E. TIMELINE ASSERTIONS ---
    const timeline = a.timeline || [];
    assertCondition(
      'timeline',
      timeline.length > 0,
      `Timeline events were not generated.`
    );
    // Chronological order verification
    let isChronological = true;
    for (let t = 1; t < timeline.length; t++) {
      if ((timeline[t].minutesFromMidnight || 0) < (timeline[t - 1].minutesFromMidnight || 0)) {
        isChronological = false;
        break;
      }
    }
    assertCondition(
      'timeline',
      isChronological,
      `Timeline is not sorted in strict chronological order!`
    );

    // --- F. CONTRADICTION ASSERTIONS ---
    const actualContradictions = a.contradictions || [];
    const actualContraSubjects = actualContradictions.map(c => (c.subject || '').toLowerCase());

    for (const expSub of tc.expected.contradictionSubjects) {
      const matched = actualContraSubjects.some(s => s.includes(expSub.toLowerCase()));
      assertCondition(
        'contradiction',
        matched,
        `Expected contradiction subject '${expSub}' was not detected.`
      );
    }

    // --- G. RISK RANKING & SCORING ASSERTIONS ---
    for (const s of (a.suspect_rankings || [])) {
      assertCondition(
        'riskRanking',
        s.risk_score >= 0.25 && s.risk_score <= 1.0,
        `Risk score for suspect '${s.name}' is out of bounds: ${s.risk_score}`
      );
      assertCondition(
        'riskRanking',
        s.why_this_score && s.why_this_score.length > 5,
        `Suspect '${s.name}' is missing traceable 'why_this_score' explanation.`
      );
    }

    // --- H. CASE ISOLATION ASSERTIONS ---
    if (previousCaseOutput) {
      // Check that none of previous case's unique suspects exist in current case unless in current expected suspects
      const prevSuspects = (previousCaseOutput.suspect_rankings || []).map(s => s.name.toLowerCase());
      for (const prevS of prevSuspects) {
        if (!tc.expected.suspects.map(s => s.toLowerCase()).includes(prevS)) {
          assertCondition(
            'caseIsolation',
            !actualSuspectsLow.includes(prevS),
            `Cross-case contamination! Suspect '${prevS}' from previous case appeared in current case '${tc.name}'.`
          );
        }
      }
    }
    previousCaseOutput = a;

    if (tcPassed) {
      console.log(`  Status: ✅ PASSED (100% assertions satisfied)\n`);
    } else {
      console.log(`  Status: ❌ FAILED (${tcErrors.length} assertion errors)`);
      tcErrors.forEach(err => console.log(`    - ${err}`));
      console.log();
    }

    testCaseResults.push({ id: tc.id, name: tc.name, passed: tcPassed, errors: tcErrors });
  }

  // --- FINAL SUMMARY & ACCURACY CALCULATIONS ---
  console.log('================================================================================');
  console.log('                     BENCHMARK ACCURACY EVALUATION REPORT                       ');
  console.log('================================================================================\n');

  const passedCasesCount = testCaseResults.filter(t => t.passed).length;
  const overallCaseAccuracy = ((passedCasesCount / dataset.length) * 100).toFixed(2);
  const overallAssertionAccuracy = ((passedAssertions / totalAssertions) * 100).toFixed(2);

  console.log(`Total FIR Test Cases:   ${dataset.length}`);
  console.log(`Passed Test Cases:      ${passedCasesCount}`);
  console.log(`Failed Test Cases:      ${dataset.length - passedCasesCount}\n`);

  console.log('--- DETAILED METRIC ACCURACY BREAKDOWN ---');
  for (const [key, val] of Object.entries(metricTotals)) {
    const pct = val.total > 0 ? ((val.passed / val.total) * 100).toFixed(2) : '100.00';
    console.log(`  ${key.padEnd(26)} : ${pct}% (${val.passed}/${val.total} assertions)`);
  }

  console.log('\n--------------------------------------------------------------------------------');
  console.log(`OVERALL BENCHMARK ACCURACY : ${overallAssertionAccuracy}% (${passedAssertions}/${totalAssertions} assertions)`);
  console.log(`TEST CASE PASS RATE        : ${overallCaseAccuracy}% (${passedCasesCount}/${dataset.length} cases)`);
  console.log('--------------------------------------------------------------------------------\n');

  if (passedCasesCount === dataset.length) {
    console.log('🎉 100% CONTROLLED VALIDATION BENCHMARK ACHIEVED ON ALL TEST CASES!');
  } else {
    console.log('⚠️ Some assertions failed. Please review the detailed error logs above.');
  }
}

runBenchmark().catch(err => {
  console.error('Fatal Benchmark Error:', err);
});
