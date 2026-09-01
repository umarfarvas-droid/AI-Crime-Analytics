// Comprehensive Benchmark Verification Suite for AI Crime Analytics

async function runTests() {
  console.log('==============================================================');
  console.log('      AI CRIME ANALYTICS - BENCHMARK & PHANTOM LEDGER TESTS   ');
  console.log('==============================================================\n');

  let allPassed = true;

  // Helper to create & analyze case
  async function testNarrative(testName, title, type, narrative, location = 'Test Scene') {
    const res = await fetch('http://localhost:8080/api/v1/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseNumber: `TEST-${Date.now()}`,
        title,
        type,
        priority: 'HIGH',
        incidentDate: '2026-08-19',
        locationName: location,
        description: narrative
      })
    });
    const c = await res.json();
    const analyzeRes = await fetch(`http://localhost:8080/api/v1/cases/${c.id}/analyze`, { method: 'POST' });
    const analyzed = await analyzeRes.json();
    return analyzed.analysis;
  }

  // TEST A: Daniel Mathews, Chief Financial Officer of Meridian Capital Technologies, was found dead.
  console.log('▶ RUNNING TEST A: "Daniel Mathews, Chief Financial Officer of Meridian Capital Technologies, was found dead."');
  const resA = await testNarrative(
    'Test A',
    'Test A Case',
    'HOMICIDE',
    'Daniel Mathews, Chief Financial Officer of Meridian Capital Technologies, was found dead inside his office.'
  );

  const victimA = resA.victim?.name;
  const suspectsA = resA.suspect_rankings.map(s => s.name);
  const jobTitlesA = resA.job_titles;
  const orgsA = resA.organizations;

  console.log('  Victim detected:', victimA);
  console.log('  Job Titles detected:', jobTitlesA);
  console.log('  Organizations detected:', orgsA);
  console.log('  Suspects count:', suspectsA.length, suspectsA);

  const testAPassed = victimA === 'Daniel Mathews' &&
                      !suspectsA.includes('Daniel Mathews') &&
                      !suspectsA.includes('Chief Financial') &&
                      !suspectsA.includes('Meridian Capital') &&
                      suspectsA.length === 0;

  console.log(`  RESULT TEST A: ${testAPassed ? '✅ PASSED' : '❌ FAILED'}\n`);
  if (!testAPassed) allPassed = false;

  // TEST B: The Chief Financial Officer contacted the security officer before the incident.
  console.log('▶ RUNNING TEST B: "The Chief Financial Officer contacted the security officer before the incident."');
  const resB = await testNarrative(
    'Test B',
    'Test B Case',
    'HOMICIDE',
    'The Chief Financial Officer contacted the security officer before the incident occurred in the lobby.'
  );
  const suspectsB = resB.suspect_rankings.map(s => s.name);
  console.log('  Job Titles detected:', resB.job_titles);
  console.log('  Suspects count:', suspectsB.length, suspectsB);

  const testBPassed = suspectsB.length === 0 &&
                      !suspectsB.includes('Chief Financial') &&
                      !suspectsB.includes('Security Officer');

  console.log(`  RESULT TEST B: ${testBPassed ? '✅ PASSED' : '❌ FAILED'}\n`);
  if (!testBPassed) allPassed = false;

  // TEST C: Meridian Capital Technologies reported the incident to the authorities.
  console.log('▶ RUNNING TEST C: "Meridian Capital Technologies reported the incident to the authorities."');
  const resC = await testNarrative(
    'Test C',
    'Test C Case',
    'CYBER_CRIME',
    'Meridian Capital Technologies reported the incident to the authorities after noticing database anomalies.'
  );
  const suspectsC = resC.suspect_rankings.map(s => s.name);
  console.log('  Organizations detected:', resC.organizations);
  console.log('  Suspects count:', suspectsC.length, suspectsC);

  const testCPassed = suspectsC.length === 0 &&
                      !suspectsC.includes('Meridian Capital') &&
                      !suspectsC.includes('Meridian Capital Technologies');

  console.log(`  RESULT TEST C: ${testCPassed ? '✅ PASSED' : '❌ FAILED'}\n`);
  if (!testCPassed) allPassed = false;

  // TEST D: Arjun Kumar, a former systems engineer, still had an active remote-access account.
  console.log('▶ RUNNING TEST D: "Arjun Kumar, a former systems engineer, still had an active remote-access account."');
  const resD = await testNarrative(
    'Test D',
    'Test D Case',
    'CYBER_CRIME',
    'Arjun Kumar, a former systems engineer, still had an active remote-access account that was used at 9:52 PM.'
  );
  const suspectsD = resD.suspect_rankings.map(s => s.name);
  console.log('  Job Titles detected:', resD.job_titles);
  console.log('  Suspects count:', suspectsD.length, suspectsD);

  const testDPassed = suspectsD.includes('Arjun Kumar') &&
                      !suspectsD.includes('Systems Engineer') &&
                      suspectsD.length === 1;

  console.log(`  RESULT TEST D: ${testDPassed ? '✅ PASSED' : '❌ FAILED'}\n`);
  if (!testDPassed) allPassed = false;

  // FULL PHANTOM LEDGER TEST CASE
  console.log('▶ RUNNING FULL PHANTOM LEDGER TEST CASE:');
  const phantomDesc = "On 19 August 2026, Meridian Capital Technologies reported a suspected coordinated criminal operation involving the death of its Chief Financial Officer, Daniel Mathews, unauthorized access to the company's financial servers, and the disappearance of approximately ₹18 crore in corporate funds. Daniel Mathews was found unconscious inside a restricted executive conference room at 11:40 PM and was later declared deceased by emergency medical personnel. CCTV records showed that Daniel entered the building at 8:15 PM, followed by his business partner Vikram Rao at 8:42 PM and cybersecurity administrator Aisha Rahman at 9:05 PM. Aisha stated that she remained inside the network operations centre throughout the night, but access-control records show her employee credentials were used to enter the executive floor at 9:37 PM. At 9:45 PM, the company's financial database recorded an administrator-level login from an external IP address, followed by the transfer of ₹18 crore through multiple accounts. Former systems engineer Arjun Kumar, who resigned six weeks earlier after a dispute with the company, still had an active remote-access credential that was used at 9:52 PM. Security officer Sameer Khan claimed that he left the building at 9:20 PM, but parking records show his vehicle remained inside the premises until 11:15 PM. At approximately 10:05 PM, a journalist named Meera Iyer received an anonymous encrypted email containing confidential company documents and a cryptocurrency wallet address. At 10:30 PM, a fire alarm was triggered on the basement floor, temporarily disabling one section of the building's CCTV system. Investigators later found a broken access card, traces of blood on a conference-room table, Daniel's damaged mobile phone, and a USB storage device hidden inside a maintenance cabinet. The USB contained encrypted financial records and a deleted video file that forensic investigators are attempting to recover. Daniel's business partner Vikram Rao reported that Daniel had threatened to expose financial irregularities within the company two days before his death. Meanwhile, Daniel's assistant Priya Nair stated that she left the building at 9:10 PM, but a ride-booking record places her near the building again at approximately 10:25 PM. Investigators also discovered that the cryptocurrency wallet mentioned in the anonymous email had received funds from an account previously associated with Arjun Kumar. A preliminary forensic examination indicates that some fingerprints found on the conference-room table may have been deliberately transferred from another object. Investigators suspect that the incident may involve an insider conspiracy, financial fraud, unauthorized cyber access, staged physical evidence, and an attempt to eliminate a person who possessed information about the company's financial activities. The investigation is continuing across digital forensics, financial records, CCTV footage, access-control systems, witness statements, mobile-device data, and recovered physical evidence.";

  const resPhantom = await testNarrative(
    'Phantom Ledger',
    'Phantom Ledger – Multi-Layer Corporate Crime',
    'HOMICIDE',
    phantomDesc,
    'Chennai Financial District, Chennai, Tamil Nadu'
  );

  console.log('  --- Extraction Summary ---');
  console.log('  Victim:', resPhantom.victim?.name, `(${resPhantom.victim?.occupation})`);
  console.log('  Organizations:', resPhantom.organizations);
  console.log('  Job Titles:', resPhantom.job_titles);
  console.log('  Locations:', resPhantom.locations);
  console.log('  Suspect Count:', resPhantom.suspectCount);
  console.log('  Suspects Ranking:');
  resPhantom.suspect_rankings.forEach(s => {
    console.log(`    #${s.rank} ${s.name.padEnd(16)} | Risk: ${s.risk_score * 100}% (${s.tier}) | Motive: ${s.motive.substring(0, 35)}... | Contra: ${s.contradiction_score}`);
  });

  console.log('\n  Contradictions detected:');
  resPhantom.contradictions.forEach((c, idx) => {
    console.log(`    [${idx + 1}] Subject: ${c.subject} | Discrepancy: ${c.discrepancy}`);
  });

  const expectedSuspects = ['Arjun Kumar', 'Aisha Rahman', 'Vikram Rao', 'Meera Iyer', 'Sameer Khan', 'Priya Nair'];
  const actualSuspects = resPhantom.suspect_rankings.map(s => s.name);

  const victimCorrect = resPhantom.victim?.name === 'Daniel Mathews';
  const countCorrect = resPhantom.suspectCount === 6;
  const noFalseChief = !actualSuspects.includes('Chief Financial') && !actualSuspects.includes('Chief Financial Officer');
  const noFalseMeridian = !actualSuspects.includes('Meridian Capital') && !actualSuspects.includes('Meridian Capital Technologies');
  const allExpectedPresent = expectedSuspects.every(exp => actualSuspects.includes(exp));

  console.log('\n  --- Validation Checks ---');
  console.log('  1. Victim is Daniel Mathews:', victimCorrect ? '✅ PASS' : '❌ FAIL');
  console.log('  2. Suspect Count is exactly 6:', countCorrect ? '✅ PASS' : '❌ FAIL');
  console.log('  3. Zero "Chief Financial" false suspects:', noFalseChief ? '✅ PASS' : '❌ FAIL');
  console.log('  4. Zero "Meridian Capital" false suspects:', noFalseMeridian ? '✅ PASS' : '❌ FAIL');
  console.log('  5. All 6 expected persons present in Matrix:', allExpectedPresent ? '✅ PASS' : '❌ FAIL');

  const phantomPassed = victimCorrect && countCorrect && noFalseChief && noFalseMeridian && allExpectedPresent;
  console.log(`\n▶ RESULT PHANTOM LEDGER: ${phantomPassed ? '✅ ALL CHECKS PASSED' : '❌ FAILED'}`);
  if (!phantomPassed) allPassed = false;

  console.log('\n==============================================================');
  console.log(`OVERALL SUITE: ${allPassed ? '🎉 ALL TESTS PASSED SUCCESSFULLY' : '❌ SOME TESTS FAILED'}`);
  console.log('==============================================================');
}

runTests().catch(err => {
  console.error('Test error:', err);
});
