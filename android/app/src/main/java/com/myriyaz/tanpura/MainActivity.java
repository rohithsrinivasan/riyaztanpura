package com.myriyaz.tanpura;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    @Override
    protected void init() {
        super.init();
        registerPlugin(AudioPlaybackPlugin.class);
    }
}
