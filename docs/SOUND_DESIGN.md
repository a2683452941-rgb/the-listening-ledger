# Listening to the three states

The three 1.25-second phrases use the same synthesis code in the browser and in the optional reference renderer. They are status cues, not recorded music or spoken transaction details.

| State | Memory cue | Meaning |
| --- | --- | --- |
| Green · warm chord | Three overlapping, sustained low/mid felt-keyboard notes | No unresolved item or triggered reminder under the available budget rules |
| Red · wooden reminder | Four short wooden taps, in two groups, with a brief textured attack | A confirmed configured limit or personal reminder needs attention |
| Blue · glass question | Two high glass-bell notes with a 0.41-second pause | Something still needs the user's review |

Revision 4 retains the distinguishable timbres and increases level; it separates timbre, register and envelope as well as rhythm: green is warm and sustained, red is dry and percussive, and blue is bright with a clear gap. Red does not depend on a sudden loudness jump. The digital waveforms have matched whole-phrase RMS energy and bounded peaks; that is not a claim of identical perceived loudness on every device. New books start at 70% application volume; existing saved volume preferences are retained. The reference files below also use 70%; a saved user preference can differ.

## Generate reference WAV files

Run `node scripts/render-sound-previews.mjs` from the repository root. It writes three WAV files and a metrics JSON file under `验收/声音预览/` (an ignored local output directory). The renderer needs no model credentials, network calls or new dependencies.

The references use 48 kHz, 16-bit stereo, 70% application volume, and a centered equal-power pan. The browser uses the same PCM synthesis and changes pan with node position. These files are synthesized reference outputs, **not microphone recordings, headphone measurements, or examples of the device's reading voice**.

## What automated checks cover

`node --test tests/sound.test.mjs tests/sound-design.test.mjs tests/transport.test.mjs` covers finite bounded samples, rhythm differences, cached PCM playback, cancellation, stale callbacks, mute/volume behavior and transport scheduling. The full clean-package report records the final suite count.

The sound slider changes active node sounds through a smooth gain control. Muting or replacing a sound cancels it; a short fade avoids a click. A replacement starts after the old tone's 40 ms fade finishes, preventing the louder tone tails from summing above the intended peak. The first tone starts immediately. Currency/amount reading still uses the device's speech voice. Nonzero slider changes affect the next utterance; setting volume to zero cancels the current reading. No new paid voice provider is required.

## Final browser operation check

In the actual browser, all three revision-4 legend auditions, switching tones, map start/replay, mute, a turn to 2 November and closing the book were exercised without console errors. Device reading was triggered for USD 12.00 and CNY 18.00, 42.00, 50.00 and 20.00, plus the USD 26.50 settings audition. Visible amount/reason text, stop feedback and close/reopen resets were checked. These observations establish browser actions and text/state feedback, not independent confirmation of natural pronunciation or absence of residual audio in physical headphones.

## Human listening result and remaining scope

The author initially found the states difficult to distinguish. After the three-timbre revision, the author confirmed they were distinguishable but requested more volume. Revision 4 keeps those timbres and raises waveform level by +3.01 dB. Raw waveform RMS is 0.226274; measured peaks are approximately 0.80–0.83 under a 0.88 cap. These are digital signal values, not headphone loudness measurements. **The author then listened to revision 4 with headphones and confirmed that the volume was appropriate.** Together with the earlier distinction feedback, this is feedback from one person, not a general perceptual/usability study. It does not certify every device voice, amount pronunciation or stop-control task.

At a comfortable system and application volume, compare the three phrases without relying on their colors. In the actual book, check node playback followed by page turn or mute, and detail reading followed by closing the detail. Listen to several different amounts and currencies. Confirm that previous audio stops and that amount/reason wording is understandable. Automated checks and the reference WAV files do not establish headphone comfort, voice naturalness or real-device behavior.
