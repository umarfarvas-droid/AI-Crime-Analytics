package com.crime.analytics.ai.services.video;

import lombok.extern.slf4j.Slf4j;
import org.jcodec.common.AudioFormat;
import org.jcodec.common.model.AudioBuffer;
import org.springframework.stereotype.Component;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.List;
import java.util.Random;

/**
 * Pure Java High-Fidelity Forensic Audio Synthesizer
 * Generates 44.1 kHz 16-bit stereo PCM audio with synchronized ambient room tone,
 * gait-synchronized footsteps, door latches/hinges, electronic access control RFID scanner chimes,
 * ventilation airflow, terminal keyboard typing, and forensic camera strobe pulses.
 */
@Slf4j
@Component
public class ForensicAudioSynthesizer {

    public static final int SAMPLE_RATE = 44100;
    public static final int CHANNELS = 2;
    public static final int BITS_PER_SAMPLE = 16;

    /**
     * Synthesize a complete synchronized audio track for a sequence of forensic scenes.
     */
    public AudioBuffer synthesizeReconstructionAudio(List<VideoJob.ScenePlanItem> scenePlan, int framesPerScene, int fps) {
        int totalScenes = Math.max(1, scenePlan != null ? scenePlan.size() : 1);
        int totalFrames = totalScenes * framesPerScene;
        double totalDurationSec = (double) totalFrames / (double) fps;
        int totalSamples = (int) (totalDurationSec * SAMPLE_RATE);

        log.info("Synthesizing {}s ({} samples) of synchronized forensic audio across {} scenes at {} Hz stereo...",
                String.format("%.2f", totalDurationSec), totalSamples, totalScenes, SAMPLE_RATE);

        short[] leftChannel = new short[totalSamples];
        short[] rightChannel = new short[totalSamples];
        Random rnd = new Random(42);

        // 1. Layer 1: Forensic Base Room Tone & Low Atmospheric Harmonic Drone (55Hz + 110Hz + 165Hz)
        generateAmbientDrone(leftChannel, rightChannel, totalSamples);

        // 2. Layer 2: Scene-Specific Synchronized Audio Events
        for (int sIdx = 0; sIdx < totalScenes; sIdx++) {
            VideoJob.ScenePlanItem scene = (scenePlan != null && sIdx < scenePlan.size()) ? scenePlan.get(sIdx) : null;
            int sceneStartSample = (int) ((double) sIdx * framesPerScene / fps * SAMPLE_RATE);
            int sceneDurationSamples = (int) ((double) framesPerScene / fps * SAMPLE_RATE);

            applySceneSpecificAudio(leftChannel, rightChannel, scene, sceneStartSample, sceneDurationSamples, framesPerScene, fps, rnd);
        }

        // 3. Interleave into 16-bit Little-Endian Stereo ByteBuffer
        ByteBuffer buffer = ByteBuffer.allocate(totalSamples * CHANNELS * 2).order(ByteOrder.LITTLE_ENDIAN);
        for (int i = 0; i < totalSamples; i++) {
            buffer.putShort(leftChannel[i]);
            buffer.putShort(rightChannel[i]);
        }
        buffer.flip();

        AudioFormat format = new AudioFormat(SAMPLE_RATE, BITS_PER_SAMPLE, CHANNELS, true, false);
        return new AudioBuffer(buffer, format, totalSamples);
    }

    /**
     * Layer 1: Ambient Atmospheric Drone & Low Room Tone
     */
    private void generateAmbientDrone(short[] left, short[] right, int totalSamples) {
        for (int i = 0; i < totalSamples; i++) {
            double t = (double) i / SAMPLE_RATE;
            // Low subtle 55Hz foundation with 110Hz warm harmonic
            double f55 = Math.sin(2.0 * Math.PI * 55.0 * t) * 900.0;
            double f110 = Math.sin(2.0 * Math.PI * 110.0 * t) * 450.0;
            double f165 = Math.sin(2.0 * Math.PI * 165.0 * t + 0.5) * 200.0;

            // Slow atmospheric breathing modulation (0.2 Hz)
            double lfo = 0.8 + 0.2 * Math.sin(2.0 * Math.PI * 0.15 * t);

            // Subtle pink-noise room presence
            double noise = (Math.random() - 0.5) * 120.0;

            short sampleVal = (short) ((f55 + f110 + f165 + noise) * lfo);
            left[i] = sampleVal;
            right[i] = sampleVal;
        }
    }

    /**
     * Layer 2: Scene-Specific Synchronized Audio Events
     */
    private void applySceneSpecificAudio(short[] left, short[] right, VideoJob.ScenePlanItem scene,
                                         int startSample, int durationSamples, int framesPerScene, int fps, Random rnd) {
        String camera = scene != null && scene.getCamera() != null ? scene.getCamera().toUpperCase() : "CINEMATIC";
        String event = scene != null && scene.getEvent() != null ? scene.getEvent().toLowerCase() : "";
        boolean isCctv = camera.contains("CCTV") || camera.contains("SURVEILLANCE") || event.contains("cctv") || event.contains("camera");
        boolean isEvidenceCloseUp = camera.contains("CLOSE") || event.contains("glass") || event.contains("phone") || event.contains("fingerprint");
        boolean isInvestigatorScene = event.contains("investigat") || event.contains("police") || event.contains("found dead") || event.contains("discovered");
        boolean isCyber = event.contains("server") || event.contains("login") || event.contains("ip") || event.contains("genome") || event.contains("export") || event.contains("cyber");

        // 1. Gait-Synchronized Footsteps (Synchronized with walk cycle strides)
        if (!isEvidenceCloseUp) {
            // Approx 2 footsteps per second (120 BPM stride cadence)
            double strideIntervalSec = 0.5;
            int strideSampleInterval = (int) (strideIntervalSec * SAMPLE_RATE);
            int currentStepSample = startSample + (int) (0.25 * SAMPLE_RATE);

            while (currentStepSample < startSample + durationSamples - 8000) {
                // Synthesize a realistic footstep acoustic transient (heel impact + floor resonance)
                synthesizeFootstep(left, right, currentStepSample, rnd);
                currentStepSample += strideSampleInterval + (rnd.nextInt(1000) - 500);
            }
        }

        // 2. Electronic Access Control Scanner Chime (High clean double-beep at ~50% into entrance/corridor scenes)
        if (isCctv || event.contains("entrance") || event.contains("access") || event.contains("card") || event.contains("door") || isEvidenceCloseUp) {
            int beepStart = startSample + (int) (durationSamples * 0.48);
            synthesizeAccessBeep(left, right, beepStart, 1800, 2400);

            // Door latch click & hinge sound right after scan
            int doorStart = beepStart + (int) (0.35 * SAMPLE_RATE);
            synthesizeDoorLatch(left, right, doorStart);
        }

        // 3. Cyber / Server Room Hum & Terminal Keystroke Clicks
        if (isCyber) {
            // Airflow white noise modulation
            for (int i = startSample; i < Math.min(startSample + durationSamples, left.length); i++) {
                double fanNoise = (rnd.nextDouble() - 0.5) * 350.0;
                double fanHum = Math.sin(2.0 * Math.PI * 120.0 * ((double) i / SAMPLE_RATE)) * 600.0;
                left[i] = (short) Math.max(Short.MIN_VALUE, Math.min(Short.MAX_VALUE, left[i] + (int) (fanNoise + fanHum)));
                right[i] = (short) Math.max(Short.MIN_VALUE, Math.min(Short.MAX_VALUE, right[i] + (int) (fanNoise + fanHum)));
            }
            // Burst of rapid keyboard typing clicks
            int keyStart = startSample + (int) (0.6 * durationSamples);
            for (int k = 0; k < 8; k++) {
                synthesizeKeystroke(left, right, keyStart + (k * 3200) + rnd.nextInt(800));
            }
        }

        // 4. Forensic Investigation DSLR Flash / Strobe Pulse
        if (isInvestigatorScene) {
            int flashStart = startSample + (int) (durationSamples * 0.3);
            synthesizeCameraShutter(left, right, flashStart);

            int flashStart2 = startSample + (int) (durationSamples * 0.7);
            synthesizeCameraShutter(left, right, flashStart2);
        }
    }

    /**
     * Synthesize realistic footstep acoustic transient (decaying low-frequency thump with floor texture)
     */
    private void synthesizeFootstep(short[] left, short[] right, int startSample, Random rnd) {
        int footstepDuration = (int) (0.12 * SAMPLE_RATE); // 120ms
        for (int i = 0; i < footstepDuration && (startSample + i) < left.length; i++) {
            double t = (double) i / SAMPLE_RATE;
            double env = Math.exp(-35.0 * t); // Fast exponential decay
            // Low thump at 80Hz pitching down to 40Hz
            double freq = 80.0 - (40.0 * (i / (double) footstepDuration));
            double thump = Math.sin(2.0 * Math.PI * freq * t) * 3200.0 * env;
            double scuff = (rnd.nextDouble() - 0.5) * 800.0 * env;

            int mixedL = left[startSample + i] + (int) (thump * 0.9 + scuff);
            int mixedR = right[startSample + i] + (int) (thump * 1.1 + scuff);
            left[startSample + i] = (short) Math.max(Short.MIN_VALUE, Math.min(Short.MAX_VALUE, mixedL));
            right[startSample + i] = (short) Math.max(Short.MIN_VALUE, Math.min(Short.MAX_VALUE, mixedR));
        }
    }

    /**
     * Synthesize high electronic confirmation double-chime (RFID scanner)
     */
    private void synthesizeAccessBeep(short[] left, short[] right, int startSample, double freq1, double freq2) {
        int beepDuration = (int) (0.07 * SAMPLE_RATE); // 70ms per chime
        int pause = (int) (0.04 * SAMPLE_RATE); // 40ms pause

        // First Chime (1800Hz)
        for (int i = 0; i < beepDuration && (startSample + i) < left.length; i++) {
            double t = (double) i / SAMPLE_RATE;
            double env = Math.sin(Math.PI * (i / (double) beepDuration)); // Bell envelope
            short sample = (short) (Math.sin(2.0 * Math.PI * freq1 * t) * 4800.0 * env);
            left[startSample + i] = (short) Math.max(Short.MIN_VALUE, Math.min(Short.MAX_VALUE, left[startSample + i] + sample));
            right[startSample + i] = (short) Math.max(Short.MIN_VALUE, Math.min(Short.MAX_VALUE, right[startSample + i] + sample));
        }

        // Second Higher Chime (2400Hz)
        int secondStart = startSample + beepDuration + pause;
        for (int i = 0; i < beepDuration && (secondStart + i) < left.length; i++) {
            double t = (double) i / SAMPLE_RATE;
            double env = Math.sin(Math.PI * (i / (double) beepDuration));
            short sample = (short) (Math.sin(2.0 * Math.PI * freq2 * t) * 5200.0 * env);
            left[secondStart + i] = (short) Math.max(Short.MIN_VALUE, Math.min(Short.MAX_VALUE, left[secondStart + i] + sample));
            right[secondStart + i] = (short) Math.max(Short.MIN_VALUE, Math.min(Short.MAX_VALUE, right[secondStart + i] + sample));
        }
    }

    /**
     * Synthesize door latch release & hinge creak sound
     */
    private void synthesizeDoorLatch(short[] left, short[] right, int startSample) {
        int latchDuration = (int) (0.18 * SAMPLE_RATE);
        for (int i = 0; i < latchDuration && (startSample + i) < left.length; i++) {
            double t = (double) i / SAMPLE_RATE;
            double env = Math.exp(-22.0 * t);
            double click = Math.sin(2.0 * Math.PI * 480.0 * t) * 2400.0 * env;
            double creak = Math.sin(2.0 * Math.PI * (220.0 + (300.0 * t)) * t) * 1200.0 * env;

            left[startSample + i] = (short) Math.max(Short.MIN_VALUE, Math.min(Short.MAX_VALUE, left[startSample + i] + (int) (click + creak)));
            right[startSample + i] = (short) Math.max(Short.MIN_VALUE, Math.min(Short.MAX_VALUE, right[startSample + i] + (int) (click + creak)));
        }
    }

    /**
     * Synthesize mechanical keystroke click
     */
    private void synthesizeKeystroke(short[] left, short[] right, int startSample) {
        int keyDuration = (int) (0.035 * SAMPLE_RATE); // 35ms
        for (int i = 0; i < keyDuration && (startSample + i) < left.length; i++) {
            double t = (double) i / SAMPLE_RATE;
            double env = Math.exp(-80.0 * t);
            short sample = (short) ((Math.sin(2.0 * Math.PI * 1400.0 * t) * 2200.0 + (Math.random() - 0.5) * 1500.0) * env);
            left[startSample + i] = (short) Math.max(Short.MIN_VALUE, Math.min(Short.MAX_VALUE, left[startSample + i] + sample));
            right[startSample + i] = (short) Math.max(Short.MIN_VALUE, Math.min(Short.MAX_VALUE, right[startSample + i] + sample));
        }
    }

    /**
     * Synthesize forensic camera shutter snap & strobe charge
     */
    private void synthesizeCameraShutter(short[] left, short[] right, int startSample) {
        int shutterDuration = (int) (0.15 * SAMPLE_RATE);
        for (int i = 0; i < shutterDuration && (startSample + i) < left.length; i++) {
            double t = (double) i / SAMPLE_RATE;
            double env = Math.exp(-30.0 * t);
            double snap = Math.sin(2.0 * Math.PI * 950.0 * t) * 4500.0 * env;
            double mech = (Math.random() - 0.5) * 2500.0 * env;

            left[startSample + i] = (short) Math.max(Short.MIN_VALUE, Math.min(Short.MAX_VALUE, left[startSample + i] + (int) (snap + mech)));
            right[startSample + i] = (short) Math.max(Short.MIN_VALUE, Math.min(Short.MAX_VALUE, right[startSample + i] + (int) (snap + mech)));
        }
    }
}
