package com.myriyaz.tanpura;

import android.content.Intent;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AudioPlayback")
public class AudioPlaybackPlugin extends Plugin {

    @Override
    public void load() {
        // Plugin loaded
    }

    public void startAudioPlayback(PluginCall call) {
        try {
            Intent serviceIntent = new Intent(getContext(), AudioPlaybackService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to start audio playback: " + e.getMessage());
        }
    }

    public void stopAudioPlayback(PluginCall call) {
        try {
            Intent serviceIntent = new Intent(getContext(), AudioPlaybackService.class);
            getContext().stopService(serviceIntent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to stop audio playback: " + e.getMessage());
        }
    }
}
