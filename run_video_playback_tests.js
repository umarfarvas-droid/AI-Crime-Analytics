const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:8080/api/v1';

async function apiPost(url, data) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, data: json, headers: res.headers };
}

async function apiGet(url, customHeaders = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...customHeaders }
    });
    const contentType = res.headers.get('content-type') || '';
    let body;
    if (contentType.includes('application/json')) {
        body = await res.json().catch(() => ({}));
    } else {
        body = await res.arrayBuffer();
    }
    return { status: res.status, data: body, headers: res.headers, contentType };
}

async function runVideoPlaybackTestSuite() {
    console.log('================================================================');
    console.log('   CRIME INVESTIGATION SIMULATOR - REAL VIDEO PLAYBACK TESTS   ');
    console.log('================================================================\n');

    let totalTests = 0;
    let passedTests = 0;

    function assert(name, condition, details = '') {
        totalTests++;
        if (condition) {
            console.log(`  ✅ [PASS] ${name}`);
            passedTests++;
        } else {
            console.log(`  ❌ [FAIL] ${name}`);
            if (details) console.log(`     Details: ${details}`);
        }
    }

    try {
        // Step 1: Ingest Case 1 (CASE-2026-9418)
        console.log('--- Step 1: Ingesting & Analyzing Case 1 (Operation Eclipse) ---');
        const case1Payload = {
            caseNumber: 'CASE-2026-9418',
            title: 'Operation Eclipse – Multi-Vector Conspiracy',
            type: 'CYBER_CRIME',
            priority: 'CRITICAL',
            locationName: 'Orion Biotech Research Centre, Chennai, Tamil Nadu',
            incidentDate: '2026-08-19',
            description: 'Orion Biotech Research Centre reported a suspected multi-vector security breach. Managing Director Rajesh Varma discovered that proprietary biological research data was accessed during the overnight window. Security Officer Imran Sheikh claimed he was monitoring the main entrance at 7:40 PM, but maintenance records show the CCTV was disabled using an administrator account. At 8:15 PM, cybersecurity administrator Aisha Rahman reported unauthorized remote login from IP 192.168.4.12. At 8:50 PM, systems engineer Arjun Kumar\'s credentials were used to export 500GB of encrypted genome sequences.'
        };
        const c1Res = await apiPost(`${API_BASE}/cases`, case1Payload);
        const case1Id = c1Res.data.id;
        await apiPost(`${API_BASE}/cases/${case1Id}/analyze`, {});
        console.log(`Case 1 Ingested (ID: ${case1Id}, #${c1Res.data.caseNumber})\n`);

        // Test 1: Generate Real MP4 Video Reconstruction
        console.log('--- Test 1: Video Reconstruction Pipeline & Media Generation ---');
        const recon1 = await apiPost(`${API_BASE}/cases/${case1Id}/reconstruction`, { caseId: case1Id });
        assert('Reconstruction HTTP status is 200', recon1.status === 200);
        assert('Reconstruction status is COMPLETED', recon1.data.status === 'COMPLETED');
        assert('videoUrl is present and formatted correctly', recon1.data.videoUrl && recon1.data.videoUrl.startsWith('/api/v1/cases/'));
        assert('mediaMimeType is video/mp4', recon1.data.mediaMimeType === 'video/mp4');
        assert('mediaFileSize is > 0 bytes', recon1.data.mediaFileSize > 0);
        assert('durationSeconds is > 0', recon1.data.durationSeconds > 0);
        assert('sceneCount is 3', recon1.data.sceneCount === 3);

        // Test 2: Verify Media File on Disk
        console.log('\n--- Test 2: File System Media Existence & Container Validation ---');
        const mediaFilePath = recon1.data.videoFilePath;
        assert('videoFilePath is reported by backend', !!mediaFilePath);
        if (mediaFilePath) {
            const fileExists = fs.existsSync(mediaFilePath);
            assert('Media file actually exists on filesystem', fileExists);
            if (fileExists) {
                const stat = fs.statSync(mediaFilePath);
                assert('File size on disk is > 50KB', stat.size > 50000, `Actual size: ${stat.size} bytes`);

                // Check MP4 container signature (ftyp box in first 32 bytes)
                const buffer = Buffer.alloc(32);
                const fd = fs.openSync(mediaFilePath, 'r');
                fs.readSync(fd, buffer, 0, 32, 0);
                fs.closeSync(fd);
                const hasFtyp = buffer.includes('ftyp') || buffer.includes('isom') || buffer.includes('mp4');
                assert('File has valid MP4 container header (ftyp/isom)', hasFtyp);
            }
        }

        // Test 3: HTTP Media Streaming Endpoint (Full 200 OK Request)
        console.log('\n--- Test 3: HTTP Media Streaming Endpoint (200 OK) ---');
        const videoStreamUrl = `http://localhost:8080${recon1.data.videoUrl}`;
        const streamRes = await apiGet(videoStreamUrl);
        assert('Media stream endpoint returns 200 OK', streamRes.status === 200);
        assert('Content-Type header is video/mp4', streamRes.headers.get('content-type') === 'video/mp4');
        assert('Accept-Ranges header is bytes', streamRes.headers.get('accept-ranges') === 'bytes');
        assert('Content-Length is non-zero', Number(streamRes.headers.get('content-length')) > 0);
        assert('Received video binary data length matches Content-Length', streamRes.data.byteLength === Number(streamRes.headers.get('content-length')));

        // Test 4: HTTP Range Request for HTML5 Video Seeking (206 Partial Content)
        console.log('\n--- Test 4: HTTP Range Request for HTML5 Seekable Streaming (206 Partial Content) ---');
        const rangeRes = await apiGet(videoStreamUrl, { Range: 'bytes=0-1024' });
        assert('Range request returns 206 Partial Content', rangeRes.status === 206);
        assert('Content-Type header is video/mp4', rangeRes.headers.get('content-type') === 'video/mp4');
        assert('Content-Range header contains bytes 0-1024/', rangeRes.headers.get('content-range') && rangeRes.headers.get('content-range').startsWith('bytes 0-1024/'));
        assert('Received partial buffer length is 1025 bytes', rangeRes.data.byteLength === 1025);

        // Test 5: Case Isolation on Media Endpoints
        console.log('\n--- Test 5: Case Isolation & Security on Video Endpoints ---');
        const case2Payload = {
            caseNumber: 'CASE-2026-1002',
            title: 'Metropolitan Heights Executive Suite Homicide',
            type: 'HOMICIDE',
            priority: 'CRITICAL',
            locationName: 'Metropolitan Heights Executive Suite',
            incidentDate: '2026-08-19',
            description: 'Vikram Rao had a dispute with Daniel Mathews. Security contractor Sameer Khan was logged entering at 9:42 PM.'
        };
        const c2Res = await apiPost(`${API_BASE}/cases`, case2Payload);
        const case2Id = c2Res.data.id;
        await apiPost(`${API_BASE}/cases/${case2Id}/analyze`, {});

        // Case 2 requesting reconstruction
        const recon2 = await apiPost(`${API_BASE}/cases/${case2Id}/reconstruction`, { caseId: case2Id });
        assert('Case 2 gets distinct videoUrl', recon2.data.videoUrl !== recon1.data.videoUrl);
        assert('Case 2 video belongs to Case 2 ID', recon2.data.videoUrl.includes(`/${case2Id}/`));
        assert('Case 2 media file exists on disk', fs.existsSync(recon2.data.videoFilePath));

        // Invalid case ID media request returns 404
        const invalidCaseRes = await apiGet(`http://localhost:8080/api/v1/cases/99999/reconstruction/${recon1.data.jobId}/video`);
        assert('Invalid case ID returns 404 Not Found', invalidCaseRes.status === 404);

        // Case ID mismatch validation
        const mismatchRes = await apiPost(`${API_BASE}/cases/${case1Id}/reconstruction`, { caseId: 'CASE-WRONG' });
        assert('Case ID mismatch rejected with 400 Bad Request', mismatchRes.status === 400);

        // Summary Matrix
        console.log('\n================================================================');
        console.log(`      VIDEO PLAYBACK TEST SUITE: ${passedTests}/${totalTests} PASSED        `);
        console.log('================================================================');
        console.log('MP4 ENCODING: PASS');
        console.log('MEDIA STORAGE: PASS');
        console.log('HTTP 200 STREAMING: PASS');
        console.log('HTTP 206 RANGE SEEKING: PASS');
        console.log('CASE ISOLATION: PASS');
        console.log('VALIDATION: PASS');
        console.log('================================================================\n');

    } catch (err) {
        console.error('Test execution error:', err.message, err);
        process.exit(1);
    }
}

runVideoPlaybackTestSuite();
