package com.crime.analytics.ai.services;

import org.jcodec.api.transcode.AudioFrameWithPacket;
import org.jcodec.api.transcode.SinkImpl;
import org.jcodec.api.transcode.VideoFrameWithPacket;
import org.jcodec.api.transcode.PixelStore;
import org.jcodec.api.transcode.PixelStoreImpl;
import org.jcodec.common.AudioFormat;
import org.jcodec.common.Codec;
import org.jcodec.common.Format;
import org.jcodec.common.io.NIOUtils;
import org.jcodec.common.io.SeekableByteChannel;
import org.jcodec.common.model.AudioBuffer;
import org.jcodec.common.model.ColorSpace;
import org.jcodec.common.model.Packet;
import org.jcodec.common.model.Picture;
import org.jcodec.common.model.Rational;
import org.jcodec.scale.AWTUtil;
import org.jcodec.scale.ColorUtil;
import org.jcodec.scale.Transform;
import org.junit.jupiter.api.Test;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class JCodecAudioTest {

    @Test
    public void testVideoAndAudioSink() throws Exception {
        System.out.println("Testing SinkImpl with Video & Audio...");
        File outFile = new File("./target/test_sink_video_audio.mp4");
        if (outFile.exists()) outFile.delete();

        SeekableByteChannel sinkStream = NIOUtils.writableChannel(outFile);
        SinkImpl sink = SinkImpl.createWithStream(sinkStream, Format.MOV, Codec.H264, Codec.PCM);
        sink.init();

        int fps = 25;
        int durationSec = 2;
        int totalFrames = fps * durationSec;
        int sampleRate = 44100;
        int channels = 2;

        ColorSpace inputColor = sink.getInputColor();
        Transform transform = inputColor != null ? ColorUtil.getTransform(ColorSpace.RGB, inputColor) : null;
        PixelStore pixelStore = new PixelStoreImpl();

        // Output video frames
        for (int i = 0; i < totalFrames; i++) {
            BufferedImage img = new BufferedImage(640, 360, BufferedImage.TYPE_3BYTE_BGR);
            Graphics2D g = img.createGraphics();
            g.setColor(new Color(15, 23, 42));
            g.fillRect(0, 0, 640, 360);
            g.setColor(Color.CYAN);
            g.fillRect(50 + (i * 5), 100, 40, 40);
            g.dispose();

            Picture pic = AWTUtil.fromBufferedImageRGB(img);
            PixelStore.LoanerPicture loanerPic;
            if (inputColor != null && transform != null) {
                loanerPic = pixelStore.getPicture(pic.getWidth(), pic.getHeight(), inputColor);
                transform.transform(pic, loanerPic.getPicture());
            } else {
                loanerPic = new PixelStore.LoanerPicture(pic, 0);
            }

            Packet videoPacket = Packet.createPacket(null, (long) i, fps, 1, (long) i, Packet.FrameType.KEY, null);
            sink.outputVideoFrame(new VideoFrameWithPacket(videoPacket, loanerPic));
            if (inputColor != null) {
                pixelStore.putBack(loanerPic);
            }
        }

        // Output Audio
        int totalSamples = sampleRate * durationSec;
        ByteBuffer audioBytes = ByteBuffer.allocate(totalSamples * channels * 2).order(ByteOrder.LITTLE_ENDIAN);
        for (int i = 0; i < totalSamples; i++) {
            short sample = (short) (Math.sin(2 * Math.PI * 440 * i / sampleRate) * 8000);
            audioBytes.putShort(sample);
            audioBytes.putShort(sample);
        }
        audioBytes.flip();

        AudioFormat audioFormat = new AudioFormat(sampleRate, 16, channels, true, false);
        AudioBuffer audioBuffer = new AudioBuffer(audioBytes, audioFormat, totalSamples);
        Packet audioPacket = Packet.createPacket(null, 0L, sampleRate, (long) totalSamples, 0L, Packet.FrameType.KEY, null);
        sink.outputAudioFrame(new AudioFrameWithPacket(audioBuffer, audioPacket));

        sink.finish();
        sinkStream.close();

        System.out.println("Combined MP4 size: " + outFile.length() + " bytes");
        assertTrue(outFile.exists());
        assertTrue(outFile.length() > 5000);
    }
}
