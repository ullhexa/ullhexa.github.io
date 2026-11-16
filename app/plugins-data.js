// Public product facts come from the approved installer handoff. Keep private
// build records and installers outside the website's publication tree.
// Keep addition order: append new plugins, and update existing entries in place.
// The catalogue reverses this order so the newest addition appears first.
export const plugins = [{
  "id": "daw-txt",
  "subtitle": "Session notes and task lists for your DAW",
  "priceUSD": 0,
  "title": "Ullhexa DAW-TXT",
  "summary": "A notes and task-list plugin that saves directly with your DAW project. Mix notes, reusable checklists and unfinished ideas, right where you left them.",
  "description": "Keep mix notes, arrangement reminders and checklists inside your DAW. Your tasks are saved with your project, ready when you return.",
  "kind": "A free task-list plugin by Ull Hexa.",
  "version": "1.0.10",
  "formats": "VST3 · Audio Unit",
  "page": "/plugins/daw-txt/",
  "paypal": { "hostedButtonId": "SBT84ZCHE4LVW" },
  "images": [
    {
      "src": "/assets/products/plugins/daw-txt/2.webp?v=f5fe441241e6",
      "width": 450,
      "height": 651,
      "title": "Notes that stay with your session",
      "caption": "Keep mix notes and arrangement reminders together. Pin priorities and check off tasks as you work.",
      "alt": "Ullhexa DAW-TXT with production notes, pinned priorities and completed tasks in its graphical theme."
    },
    {
      "src": "/assets/products/plugins/daw-txt/3.webp?v=fb4775e601dd",
      "width": 446,
      "height": 650,
      "title": "Room for the details",
      "caption": "Expand longer notes to keep detailed instructions inside the session.",
      "alt": "Ullhexa DAW-TXT with expanded multiline tasks and a scrollable list."
    },
    {
      "src": "/assets/products/plugins/daw-txt/5.webp?v=73c5134586a8",
      "width": 447,
      "height": 1013,
      "title": "Compact where it counts",
      "caption": "Keep short tasks on one line while leaving selected longer notes expanded.",
      "alt": "Ullhexa DAW-TXT showing an extended checklist with compact rows and locked expanded notes."
    },
    {
      "src": "/assets/products/plugins/daw-txt/4.webp?v=b14a2cb73bb8",
      "width": 447,
      "height": 648,
      "title": "Edit in place",
      "caption": "Edit a task directly in the list, with room for multiline notes.",
      "alt": "Ullhexa DAW-TXT in a minimal dark theme with a long task open for editing."
    },
    {
      "src": "/assets/products/plugins/daw-txt/7.webp?v=485534c790e8",
      "width": 498,
      "height": 649,
      "title": "Edit and reuse lists",
      "caption": "Save useful checklists for another project. Replace the current list or add to it from the shared library.",
      "alt": "Ullhexa DAW-TXT List Library with saved lists and controls to apply, save, rename or delete a list."
    },
    {
      "src": "/assets/products/plugins/daw-txt/6.webp?v=ebae29b5bf70",
      "width": 449,
      "height": 709,
      "title": "Make it your own",
      "caption": "Customise the colours of your workspace with the built-in colour controls.",
      "alt": "Ullhexa DAW-TXT with its custom colour editor open over a purple theme."
    },
    {
      "src": "/assets/products/plugins/daw-txt/1.webp?v=dc4552a5bc90",
      "width": 449,
      "height": 615,
      "title": "A clean start",
      "caption": "Choose a minimal theme for a quiet workspace, ready for your next idea.",
      "alt": "An empty Ullhexa DAW-TXT list in its minimal dark theme."
    },
    {
      "src": "/assets/products/plugins/daw-txt/8.webp?v=e843a1cd937c",
      "width": 449,
      "height": 612,
      "title": "Controls at a glance",
      "caption": "Open the built-in guide for keyboard shortcuts, mouse controls and Eyeball modes.",
      "alt": "The Ullhexa DAW-TXT built-in help panel showing keyboard shortcuts and mouse controls."
    }
  ],
  "features": [
    "Write multiline notes, pin priorities and check off completed tasks.",
    "Save reusable lists and apply them across projects.",
    "Expand longer notes or collapse them to keep the list compact.",
    "Choose graphical or minimal themes and customise colours.",
    "Undo and redo edits, with keyboard shortcuts for common actions.",
    "Audio passes through unchanged, with no added latency."
  ],
  "audioNote": "",
  "download": {
    "status": "published",
    "url": "https://github.com/ullhexa/ullhexa.github.io/releases/download/daw-txt-v1.0.10/Ullhexa.DAW-TXT-1.0.10.pkg",
    "file": "Ullhexa.DAW-TXT-1.0.10.pkg",
    "bytes": 21991613,
    "size": "22.0 MB",
    "sha256": "2bda756a0b74e5e80f4c031de33fa8151aeb8af88e0643481154e0fd91bcd458",
    "assurance": "Developer ID signed and Apple notarized; notarization ticket included."
  },
  "licence": "Free for personal and professional audio work. Redistribution, resale and repackaging require permission; full terms are included in the installer.",
  "specifications": [
    [
      "Plugin formats",
      "VST3 and Audio Unit (AU)"
    ],
    [
      "Apple Silicon",
      "macOS 11.0 or later"
    ],
    [
      "Intel",
      "macOS 10.13 or later"
    ],
    [
      "Host",
      "A 64-bit DAW supporting VST3 or AU"
    ],
    [
      "Application",
      "DAW plugin; no standalone application"
    ],
    [
      "Platforms",
      "macOS only"
    ]
  ],
  "installation": [
    "Close your DAW and open Ullhexa.DAW-TXT-1.0.10.pkg.",
    "Follow the installer and choose VST3, Audio Unit (AU), or both. macOS will ask for administrator permission.",
    "Reopen your DAW and add Ullhexa DAW-TXT as an audio effect. Rescan your plugins if it does not appear.",
    "Save your DAW project to keep your tasks and notes."
  ],
  "documentation": "/Library/Application Support/Ull Hexa/DAW-TXT/Documentation",
  "contact": "ullhexa.music@gmail.com"
}, {
  "id": "headaxis",
  subtitle: "3D audio spatializer",
  "priceUSD": 0,
  "title": "Ullhexa HeadAxis",
  "summary": "A 3D audio spatializer with an interactive head, adjustable distance and optional floor reflections. A visual, hands-on approach to placing sound in space.",
  "description": "Rotate the head to move the perceived direction of a sound. Ullhexa HeadAxis combines direction-dependent filtering, ear timing and level cues, with optional floor reflections and distance shaping. Use it for focused sources, stereo textures or separate left and right material.",
  "kind": "Free · Head-controlled 3D audio spatialization.",
  "version": "1.0.0",
  "formats": "VST3 · Audio Unit",
  "page": "/plugins/headaxis/",
  "paypal": { "hostedButtonId": "5TP9F7P8YL45W" },
  "images": [
    {
      "src": "/assets/products/plugins/headaxis/HeadAxis_1.webp?v=16461121f948",
      "width": 915,
      "height": 915,
      "title": "Direction in your hands",
      "caption": "Drag the head to adjust direction, or use the X and Y controls. Use Z to set the distance.",
      "alt": "Ullhexa HeadAxis main view with the 3D head, X and Y rotation, Z distance, input modes and output gain."
    },
    {
      "src": "/assets/products/plugins/headaxis/HeadAxis_2.webp?v=296e6ccc0c3e",
      "width": 915,
      "height": 915,
      "title": "Playback and floor settings",
      "caption": "Choose Speakers, Headphones or Legacy playback, with optional Wood, Tile or Concrete floor reflections.",
      "alt": "Ullhexa HeadAxis settings showing playback, floor, wallpaper and interface scale options."
    },
    {
      "src": "/assets/products/plugins/headaxis/HeadAxis_3.webp?v=04bf69b78ecf",
      "width": 915,
      "height": 915,
      "title": "Turn and tilt",
      "caption": "Explore direction with continuous X and Y rotation and a head display that follows your adjustments.",
      "alt": "Ullhexa HeadAxis with the head turned and tilted, using a green wallpaper."
    },
    {
      "src": "/assets/products/plugins/headaxis/HeadAxis_4.webp?v=e36d04e6dffa",
      "width": 915,
      "height": 915,
      "title": "Near or far",
      "caption": "Shape distance from 20 cm to 50 m. The Z control shows the current distance in centimetres or metres.",
      "alt": "Ullhexa HeadAxis with the head angled upward and the distance set to 1.7 metres."
    },
    {
      "src": "/assets/products/plugins/headaxis/HeadAxis_5.webp?v=58b8bae5175d",
      "width": 915,
      "height": 915,
      "title": "Continuous rotation",
      "caption": "Rotate through both axes to explore different orientations, with angle readouts beneath the display.",
      "alt": "Ullhexa HeadAxis showing an inverted head orientation and the X and Y angle readouts."
    },
    {
      "src": "/assets/products/plugins/headaxis/HeadAxis_6.webp?v=222980500c0d",
      "width": 915,
      "height": 915,
      "title": "Make it your own",
      "caption": "Choose from six wallpapers and four interface sizes to suit your workspace.",
      "alt": "Ullhexa HeadAxis with a light purple wallpaper, Stereo input selected and distance set to 7.6 metres."
    }
  ],
  "features": [
    "Direct head control, continuous X/Y rotation and distance from 20 cm to 50 m.",
    "Mono, Stereo and Dual input modes.",
    "Speakers and Headphones playback options, plus the original Legacy model.",
    "Optional Wood, Tile and Concrete floor reflections.",
    "Output gain, six wallpapers and four interface sizes."
  ],
  "audioNote": "",
  "download": {
    "status": "published",
    "url": "https://github.com/ullhexa/ullhexa.github.io/releases/download/headaxis-v1.0.0/HeadAxis-1.0.0-macOS.pkg",
    "file": "HeadAxis-1.0.0-macOS.pkg",
    "bytes": 418269324,
    "size": "418.3 MB",
    "sha256": "7498b84b9424a1326e8378b0fa54977b2447ff583ac0d67812a363cef2bbae77",
    "assurance": "Developer ID signed and Apple notarized; notarization ticket included."
  },
  "licence": "Free for personal and professional audio work. Redistribution, resale and repackaging require permission; full terms are included in the installer.",
  "specifications": [
    [
      "Plugin formats",
      "VST3 and Audio Unit (AU)"
    ],
    [
      "Apple Silicon",
      "macOS 11.0 or later"
    ],
    [
      "Intel",
      "macOS 10.13 or later"
    ],
    [
      "Host",
      "A 64-bit DAW supporting VST3 or AU"
    ],
    [
      "Platforms",
      "macOS only; Windows and Linux plugins are not included"
    ]
  ],
  "installation": [
    "Quit your DAW and open HeadAxis-1.0.0-macOS.pkg.",
    "Follow the installer and choose VST3, Audio Unit (AU), or both.",
    "Reopen or rescan your DAW, then insert Ullhexa HeadAxis on an audio track with stereo output.",
    "Select Speakers or Headphones in settings. Drag the head to adjust direction and use Z for distance."
  ],
  "documentation": "/Library/Application Support/Ull Hexa/HeadAxis/Documentation/",
  "contact": "ullhexa.music@gmail.com"
}, {
  "id": "iiiipole",
  subtitle: "Four-pole analog-style ladder filter",
  "priceUSD": 0,
  "title": "Ullhexa IIIIPole",
  "summary": "A four-pole analog-style ladder filter with drive, split resonance and four editable modulation curves for resonant sweeps, rhythmic patterns and experimental textures.",
  "description": "Ullhexa IIIIPole combines a nonlinear ladder low-pass filter with level-managed drive, split resonance peaks and four editable modulation curves. Use it for resonant sweeps, rhythmic filtering, stepped textures or MIDI-controlled movement.",
  "kind": "Free · Four-pole analog-style filtering with editable modulation.",
  "version": "1.0.0",
  "formats": "VST3 · Audio Unit",
  "page": "/plugins/iiiipole/",
  "paypal": { "hostedButtonId": "A8XTN6K6GEJ9Y" },
  "images": [
    {
      "src": "/assets/products/plugins/iiiipole/IIIIPole_1.webp?v=529a9f3905be",
      "width": 1082,
      "height": 1052,
      "title": "Filtering in motion",
      "caption": "Combine resonant filtering, drive and sample-rate reduction with four editable modulation curves.",
      "alt": "Ullhexa IIIIPole with its filter panel and expanded modulation panel, showing a red editable curve and modulation sends."
    },
    {
      "src": "/assets/products/plugins/iiiipole/IIIIPole_2.webp?v=4229163bcc69",
      "width": 1082,
      "height": 1052,
      "title": "Four curves, one view",
      "caption": "View the four colour-coded curves together and select a curve to shape its timing and movement.",
      "alt": "Ullhexa IIIIPole modulation display showing four overlaid red, blue, yellow and green curves, with curve 3 selected."
    },
    {
      "src": "/assets/products/plugins/iiiipole/IIIIPole_3.webp?v=1c66f948d241",
      "width": 1078,
      "height": 1053,
      "title": "Shape the movement",
      "caption": "Bend curve segments, then refine the result with Time, Log/Lin/Exp, Skew and Level controls.",
      "alt": "Ullhexa IIIIPole curve 4 editor showing a green node-based curve and its timing and shape controls."
    },
    {
      "src": "/assets/products/plugins/iiiipole/IIIIPole_4.webp?v=6654d3a95e12",
      "width": 1083,
      "height": 1053,
      "title": "A library of shapes",
      "caption": "Choose a factory curve as a starting point, or save your own shapes in the curve library.",
      "alt": "Ullhexa IIIIPole curve library with Factory and User tabs and a grid of red modulation shapes."
    },
    {
      "src": "/assets/products/plugins/iiiipole/IIIIPole_5.webp?v=2f255bdea37f",
      "width": 1083,
      "height": 1049,
      "title": "Presets and guidance",
      "caption": "Save and recall presets. Open the Ull Hexa logo for controls, MIDI routing guidance and interface scaling.",
      "alt": "Ullhexa IIIIPole with the preset browser open beside the built-in UI Controls guide."
    },
    {
      "src": "/assets/products/plugins/iiiipole/IIIIPole_6.webp?v=9040b7d6c968",
      "width": 537,
      "height": 1052,
      "title": "Keep it compact",
      "caption": "Close the modulation panel with MOD to focus on the filter, drive, resonance, sample-rate reduction and wet/dry blend.",
      "alt": "Ullhexa IIIIPole in its narrow filter-only view, with the modulation panel closed."
    }
  ],
  "features": [
    "Low-pass and high-pass filtering, split resonance and sample-rate reduction.",
    "Four node-based curves with bending, time grids, shape controls and a library.",
    "Signed UNI/BI modulation sends, including four-source cutoff modulation.",
    "MIDI pitch, velocity and retriggering; preset storage and a resizable interface.",
    "Wet/dry blending and wet feedback before the output control."
  ],
  "audioNote": "",
  "download": {
    "status": "published",
    "url": "https://github.com/ullhexa/ullhexa.github.io/releases/download/iiiipole-v1.0.0/IIIIPole-1.0.0.pkg",
    "file": "IIIIPole-1.0.0.pkg",
    "bytes": 47510009,
    "size": "47.5 MB",
    "sha256": "17a4bdf9ea5f0b0e10449759f3c2d91d25786ef4a0187ff0b56155784db03373",
    "assurance": "Developer ID signed and Apple notarized; notarization ticket included."
  },
  "licence": "Free for personal and professional audio work. Redistribution, resale and repackaging require permission; full terms are included in the installer.",
  "specifications": [
    [
      "Plugin formats",
      "VST3 and Audio Unit (AU)"
    ],
    [
      "Apple Silicon",
      "macOS 11.0 or later"
    ],
    [
      "Intel",
      "macOS 10.13 or later"
    ],
    [
      "Host",
      "A 64-bit DAW supporting VST3 or AU. AU requires support for MIDI-capable music effects; use VST3 in Cubase."
    ],
    [
      "Platforms",
      "macOS only; Windows and Linux plugins are not included"
    ]
  ],
  "installation": [
    "Close your DAW and open IIIIPole-1.0.0.pkg.",
    "Follow the installer and choose VST3, Audio Unit (AU), or both.",
    "Reopen your DAW and insert Ullhexa IIIIPole. Rescan your plugins if it does not appear.",
    "Open the Ull Hexa logo for controls and MIDI routing guidance. To use MIDI controls, route a MIDI track to the plugin as described by your DAW."
  ],
  "documentation": "/Library/Application Support/Ull Hexa/IIIIPole/Documentation/",
  "contact": "ullhexa.music@gmail.com"
}, {
  "id": "micronudge",
  "subtitle": "Timing, phase alignment and split-band VCA",
  "priceUSD": 0,
  "title": "Ullhexa MicroNudge",
  "summary": "A kick-and-bass alignment plugin with stereo timing and phase control, a synced oscilloscope and a split-band VCA for precise alignment and rhythmic volume shaping.",
  "description": "Align kick and bass with stereo offset, phase rotation and a project-synced oscilloscope. Shape your signal with editable attenuation envelopes, or split it into low and high bands with independent envelope timing.",
  "kind": "Free · Timing, phase and volume shaping.",
  "version": "1.0.2",
  "formats": "VST3 · Audio Unit",
  "page": "/plugins/micronudge/",
  "paypal": { "hostedButtonId": "BTG2X28BM5PEE" },
  "images": [
    {
      "src": "/assets/products/plugins/micronudge/1.webp?v=5b6d4fba42f7",
      "thumb": "/assets/products/plugins/micronudge/1-thumb.webp?v=acc984b0b257",
      "width": 1446,
      "height": 984,
      "title": "Freeze the comparison",
      "caption": "Freeze the scope to inspect the main and sidechain waveforms while adjusting offset and phase.",
      "alt": "Ullhexa MicroNudge: A frozen mono scope showing the main and sidechain waveforms, with linked offset and phase controls."
    },
    {
      "src": "/assets/products/plugins/micronudge/2.webp?v=76ad605378b5",
      "thumb": "/assets/products/plugins/micronudge/2-thumb.webp?v=0229dfbf3c31",
      "width": 1449,
      "height": 986,
      "title": "Kick and bass, in view",
      "caption": "Compare the main and sidechain waveforms while adjusting timing, phase and the low-band VCA envelope.",
      "alt": "Ullhexa MicroNudge: Stereo overlay with main and sidechain waveforms, a 919 Hz band split and an editable purple low-band envelope."
    },
    {
      "src": "/assets/products/plugins/micronudge/3.webp?v=4aa51b804423",
      "thumb": "/assets/products/plugins/micronudge/3-thumb.webp?v=9c8b2e09f601",
      "width": 1447,
      "height": 989,
      "title": "Rhythmic low-band shaping",
      "caption": "Set the low-band envelope timing independently and use editable nodes to shape each cycle.",
      "alt": "Ullhexa MicroNudge: The purple low-band attenuation envelope repeating across the scope at a 1/32 time division."
    },
    {
      "src": "/assets/products/plugins/micronudge/4.webp?v=a05fa8468752",
      "thumb": "/assets/products/plugins/micronudge/4-thumb.webp?v=9880d2787ba6",
      "width": 1444,
      "height": 993,
      "title": "Inspect the combined waveform",
      "caption": "The Sum view displays the main output and sidechain added together for visual comparison. It does not mix the sidechain into the audio output.",
      "alt": "Ullhexa MicroNudge: The white Sum waveform in the stereo overlay scope."
    },
    {
      "src": "/assets/products/plugins/micronudge/5.webp?v=800da1f3068c",
      "thumb": "/assets/products/plugins/micronudge/5-thumb.webp?v=bb8695927f61",
      "width": 1446,
      "height": 989,
      "title": "Independent left and right control",
      "caption": "Link the channels or set their offset and phase independently, with both signals visible in the scope.",
      "alt": "Ullhexa MicroNudge: Independent left and right phase values alongside the main and sidechain waveforms."
    },
    {
      "src": "/assets/products/plugins/micronudge/6.webp?v=b23cbd7bae84",
      "thumb": "/assets/products/plugins/micronudge/6-thumb.webp?v=0bbfebdbae94",
      "width": 1447,
      "height": 985,
      "title": "A library of curves",
      "caption": "Choose a factory shape, save your own curves and mark favorites for quick access.",
      "alt": "Ullhexa MicroNudge: The curve library with Factory, User and Favorites tabs and purple envelope previews."
    },
    {
      "src": "/assets/products/plugins/micronudge/7.webp?v=754215722cbe",
      "thumb": "/assets/products/plugins/micronudge/7-thumb.webp?v=203565fd1197",
      "width": 1448,
      "height": 987,
      "title": "Separate stereo views",
      "caption": "Stack the left and right channels to compare their main and sidechain waveforms separately.",
      "alt": "Ullhexa MicroNudge: Stacked stereo scope rows showing the main and sidechain signals for each channel."
    },
    {
      "src": "/assets/products/plugins/micronudge/8.webp?v=10316342ecd9",
      "thumb": "/assets/products/plugins/micronudge/8-thumb.webp?v=ae8a392efdee",
      "width": 1445,
      "height": 984,
      "title": "Split-band volume shaping",
      "caption": "Use separate attenuation envelopes for the low and high bands, each with its own timing. Adjust the split with the HPF control.",
      "alt": "Ullhexa MicroNudge: Stacked stereo waveforms with a 771 Hz band split and an editable white high-band envelope."
    },
    {
      "src": "/assets/products/plugins/micronudge/9.webp?v=89b1fbb73b9e",
      "thumb": "/assets/products/plugins/micronudge/9-thumb.webp?v=ea6598043a7b",
      "width": 1447,
      "height": 499,
      "title": "Presets, favorites and groups",
      "caption": "Save useful setups, mark favorites and organize presets into groups.",
      "alt": "Ullhexa MicroNudge: The preset library showing All Presets, Favorites and Groups, with Group 1 selected."
    },
    {
      "src": "/assets/products/plugins/micronudge/10.webp?v=76328133f4d1",
      "thumb": "/assets/products/plugins/micronudge/10-thumb.webp?v=b82f51283797",
      "width": 1446,
      "height": 493,
      "title": "Focus on timing and phase",
      "caption": "Close the scope for a compact view of the offset, phase, polarity and channel controls.",
      "alt": "Ullhexa MicroNudge: The compact interface with the scope closed and polarity, stereo flip and mono sum controls visible."
    }
  ],
  "features": [
    "Independent or linked L/R offset up to ±5 ms and phase rotation from −180° to +180°.",
    "Project-synced scope with main, sidechain and visual sum, plus freeze, stacked and overlay views.",
    "Editable VCA envelopes with independent low/high-band timing.",
    "Curve libraries, favorites, grid snapping and envelope smoothing.",
    "User presets with favorites and groups; interface scaling from 75% to 200%.",
    "Polarity inversion, stereo channel swap and mono sum."
  ],
  "audioNote": "",
  "download": {
    "status": "published",
    "url": "https://github.com/ullhexa/ullhexa.github.io/releases/download/micronudge-v1.0.2/Ullhexa.MicroNudge-1.0.2.pkg",
    "file": "Ullhexa.MicroNudge-1.0.2.pkg",
    "bytes": 21557319,
    "size": "21.6 MB",
    "sha256": "c4007accfcb4957f120a9ae3cc3b0163c358fa83d142c4140c24951704a16fee",
    "assurance": "Developer ID signed and Apple notarized; notarization ticket included."
  },
  "licence": "Free for personal and professional audio work. Redistribution, resale and repackaging require permission; full terms are included in the installer.",
  "specifications": [
    [
      "Plugin formats",
      "VST3 and Audio Unit (AU)"
    ],
    [
      "Apple Silicon",
      "macOS 11.0 or later"
    ],
    [
      "Intel",
      "macOS 10.13 or later"
    ],
    [
      "Host",
      "A 64-bit DAW supporting VST3 or AU"
    ],
    [
      "Sidechain",
      "Host sidechain routing for an external reference waveform"
    ],
    [
      "Platforms",
      "macOS only"
    ]
  ],
  "installation": [
    "Close your DAW and open Ullhexa.MicroNudge-1.0.2.pkg.",
    "Follow the installer. VST3 and Audio Unit (AU) are selected by default; use Customize to choose formats.",
    "Reopen your DAW and insert Ullhexa MicroNudge on your bass or main track. Keep plugin delay compensation enabled.",
    "Route the kick or reference track to the plugin's sidechain input, then open Scope to compare waveforms while adjusting offset and phase."
  ],
  "documentation": "/Library/Application Support/Ull Hexa/MicroNudge/Documentation",
  "contact": "ullhexa.music@gmail.com",
  "badgeImageIndex": 1
}];
