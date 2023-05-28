/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
 */

package com.bella.eptl;

import android.os.Bundle;
import org.apache.cordova.*;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager.NameNotFoundException;
import android.content.pm.PackageManager;
import android.media.*;


public class EptlTippy extends CordovaPlugin
{
  private Context context;
	private AudioManager manager;


  @Override
  public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
    if (action.equals("echo")) {
        String message = args.getString(0);
        this.echo(message, callbackContext);
        return true;
    }
    if (action.equals("voldown")) {
      context = cordova.getActivity().getApplicationContext();
		  manager = (AudioManager)context.getSystemService(Context.AUDIO_SERVICE);
      manager.setStreamVolume(AudioManager.STREAM_MUSIC, 0, 0);
      this.echo("volume_muted", callbackContext);
      return true;
    }
    if (action.equals("maxvol")) {
      context = cordova.getActivity().getApplicationContext();
		  manager = (AudioManager)context.getSystemService(Context.AUDIO_SERVICE);
      manager.setStreamVolume(AudioManager.STREAM_MUSIC, 100, 0);
      this.echo("max_volume", callbackContext);
      return true;
    }
    try {
      if (action.equals("versionNumber")) {
        PackageManager packageManager = this.cordova.getActivity().getPackageManager();
        this.echo(packageManager.getPackageInfo(this.cordova.getActivity().getPackageName(), 0).versionName, callbackContext);
        return true;
      }
    } catch(NameNotFoundException e) {
      this.echo("NameNotFoundException", callbackContext);
      return true;
    }
    return false;
  }

  private void echo(String message, CallbackContext callbackContext) {
    if (message != null && message.length() > 0) {
        callbackContext.success(message);
    } else {
        callbackContext.error("Expected one non-empty string argument.");
    }
  }
}
