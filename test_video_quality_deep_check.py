import urllib.request
import json
import os
import sys

# Ensure UTF-8 output on Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

API_BASE = 'http://localhost:8080/api/v1'

def post_json(url, data):
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def get_json(url):
    req = urllib.request.Request(url, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def verify_3d_animated_reconstruction():
    print("================================================================================")
    print("  PREMIUM CINEMATIC 3D ANIMATED RECONSTRUCTION ENGINE VERIFICATION             ")
    print("================================================================================")
    
    # 1. Ingest Complex 6-Scene Homicide Case (CASE-2026-1002-3D)
    case_payload = {
        "caseNumber": "CASE-2026-1002-3D",
        "title": "Metropolitan Heights Executive Suite Homicide",
        "type": "HOMICIDE",
        "priority": "CRITICAL",
        "locationName": "Metropolitan Heights Executive Suite",
        "incidentDate": "2026-08-19",
        "description": "At 8:10 PM, an individual arrived outside the complex. At 8:42 PM, security contractor Sameer Khan swiped an electronic badge at the primary entrance. At 9:15 PM, Sameer Khan was seen traversing the corridor toward the executive suite. At 9:55 PM, physical disturbance and broken crystal glassware were logged. At 10:10 PM, CCTV recorded Arjun Das exiting through the service elevator. At 10:35 PM, forensics discovered the deceased victim Vikram Rao."
    }
    
    print("\n--- Step 1: Ingesting Complex Multi-Scene Case ---")
    c = post_json(f"{API_BASE}/cases", case_payload)
    case_id = c['id']
    print(f"Created Case #{c['caseNumber']} (ID: {case_id})")
    
    # 2. Run NLP & Timeline Intelligence Extraction
    print("Running NLP & Intelligence Extraction...")
    post_json(f"{API_BASE}/cases/{case_id}/analyze", {})
    
    # 3. Generate 3D Animated Video Reconstruction (6 Scenes x 3 Shots = 18 Shots)
    print("Generating 3D Animated Reconstruction (6+ Scenes, 18+ Shots)...")
    recon = post_json(f"{API_BASE}/cases/{case_id}/reconstruction", {"caseId": case_id})
    
    print(f"Status: {recon.get('status')}")
    print(f"Provider: {recon.get('providerName')}")
    print(f"Model: {recon.get('modelName')}")
    print(f"Stage: {recon.get('currentStage')}")
    print(f"Scene Count: {recon.get('sceneCount')}")
    
    # 4. Validate Scene Count (6+ Scenes)
    scenes = recon.get('scenePlan', [])
    print(f"\n--- Step 2: Chronological Scene Verification ({len(scenes)} Scenes) ---")
    assert len(scenes) >= 6, f"Expected at least 6 scenes for complex homicide case, got {len(scenes)}"
    for sc in scenes:
        print(f"  Scene {sc.get('sceneNumber')}: [{sc.get('time')}] {sc.get('event')} ({sc.get('factOrInference')})")
        assert sc.get('time'), f"Scene {sc.get('sceneNumber')} missing time"
        assert sc.get('event'), f"Scene {sc.get('sceneNumber')} missing event"
    
    # 5. Validate Shot Breakdown (18+ Individual Cinematic Clips)
    shots = recon.get('shots', [])
    print(f"\n--- Step 3: Granular Shot Breakdown Verification ({len(shots)} Shots) ---")
    assert len(shots) >= 18, f"Expected at least 18 individual cinematic shots, got {len(shots)}"
    for sh in shots:
        print(f"  Shot {sh.get('shotNumber')}: [Scene {sh.get('sceneNumber')}] {sh.get('shotType')} ({sh.get('lens')}) - {sh.get('durationSeconds')}s")
        assert 3.5 <= sh.get('durationSeconds') <= 8.5, f"Shot duration {sh.get('durationSeconds')}s outside 4-8s window"
        assert sh.get('negativePrompt'), f"Shot {sh.get('shotNumber')} missing negativePrompt"
        assert '3D' in sh.get('visualPrompt', '') or 'Pixar' in sh.get('visualPrompt', ''), f"Shot {sh.get('shotNumber')} missing 3D feature animation prompt"
    
    # 6. Character Bible Validation
    print("\n--- Step 4: Persistent Character Bible Verification ---")
    char_bible = recon.get('characterBible', [])
    print(f"Found {len(char_bible)} persistent Character Bible entries:")
    assert len(char_bible) >= 2, "Character Bible should contain multiple characters"
    for ch in char_bible:
        print(f"  [{ch.get('characterId')}] {ch.get('name')} | Role: {ch.get('role')} | Clothing: {ch.get('clothing')}")
        assert ch.get('clothing'), f"Missing clothing in {ch.get('characterId')}"
        assert ch.get('hairStyle'), f"Missing hairStyle in {ch.get('characterId')}"
        assert ch.get('colorPalette'), f"Missing colorPalette in {ch.get('characterId')}"
    
    # 7. Environment Bible Validation
    print("\n--- Step 5: Persistent Environment Bible Verification ---")
    env_bible = recon.get('environmentBible', [])
    print(f"Found {len(env_bible)} Environment Bible entries:")
    assert len(env_bible) > 0, "Environment Bible is empty"
    for env in env_bible:
        print(f"  [{env.get('locationId')}] {env.get('locationName')} | Architecture: {env.get('architecture')}")
        assert env.get('flooring'), f"Missing flooring in {env.get('locationId')}"
        assert env.get('lighting'), f"Missing lighting in {env.get('locationId')}"
    
    # 8. Calculated Quality Scores Validation
    print("\n--- Step 6: Calculated Quality Scores Verification ---")
    qs = recon.get('qualityScore', {})
    print(f"  Motion Continuity: {qs.get('motionContinuity')}%")
    print(f"  Character Consistency: {qs.get('characterConsistency')}%")
    print(f"  Environment Consistency: {qs.get('environmentConsistency')}%")
    print(f"  Audio Sync: {qs.get('audioSync')}%")
    print(f"  Timeline Coverage: {qs.get('timelineCoverage')}%")
    print(f"  Overall Score: {qs.get('overallQualityScore')}%")
    assert qs.get('overallQualityScore') > 85.0, f"Quality score too low: {qs.get('overallQualityScore')}"
    
    # 9. Binary MP4 Container & Stream Validation
    print("\n--- Step 7: Binary Media File Inspection ---")
    video_path = recon.get('videoFilePath')
    assert video_path and os.path.exists(video_path), f"Video file not found at {video_path}"
    file_size = os.path.getsize(video_path)
    print(f"Media File: {video_path}")
    print(f"Actual File Size on disk: {file_size} bytes ({file_size / 1024 / 1024:.2f} MB)")
    assert file_size > 1000000, f"File size too small ({file_size} bytes)"
    
    with open(video_path, 'rb') as f:
        data = f.read()
    
    has_ftyp = b'ftyp' in data[:64]
    has_moov = b'moov' in data
    has_video = b'vide' in data or b'avc1' in data
    has_audio = b'soun' in data or b'mp4a' in data or b'twos' in data or b'sowt' in data
    track_count = data.count(b'trak')
    
    print(f"  [PASS] Valid MP4 Container (ftyp): {has_ftyp}")
    print(f"  [PASS] Movie Metadata Atom (moov): {has_moov}")
    print(f"  [PASS] Track Count (Video + Audio): {track_count} tracks")
    print(f"  [PASS] Video Stream Present (Stream #0:0): {has_video}")
    print(f"  [PASS] Audio Stream Present (Stream #0:1): {has_audio}")
    
    assert has_ftyp and has_moov and track_count >= 2 and has_video and has_audio, "Container verification failed"
    
    print("\n================================================================================")
    print("  ALL 3D ANIMATED CRIME RECONSTRUCTION ACCEPTANCE TESTS PASSED 100%!           ")
    print("================================================================================")

if __name__ == '__main__':
    verify_3d_animated_reconstruction()
