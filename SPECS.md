


# Students will have:

Video asset files in a folder

Audio only assets in a folder

Text files with content for display within the immersive room.



Students will have a plan for the interactions that will take place. 

They have Zigbee connected sensors and buttons that will trigger events.

The room has bluetooth beacons that will allow a mobile devices position in the room to be determined. 



Students will design their interactive environments. Some examples include.

- A user/visitor makes a selection from buttons on the wall or on a console.
- The user shows a hand gesture that is picked up by a camera.
- The user uses voice commands to request information or to control a device, a stream of media, or a state of the environment.
- The user moves from  location to location in the room and their position changes the audio and projections.
- The user carries out tasks. They give the system input and the responses are generated. The variety of interactions affect the responces
- This system makes decisions as the user makes decisions.



The system will change its state based on input. The state will be managed by the Show Control Interface.


# Phases

The app is built in phases. The UI loosely follows Macromedia Director (see `reference/`), but only the Director features the room needs will be built.

## Phase 1 (built)

- **Cast.** A three-column grid to the right of the stage drawing. Add a member by hand: name, kind (video, sound, text, color), and a path or the text/color value. Remove a member. Chips show a member number, name, and kind mark.
- **Stage.** The room drawing with ten numbered region faces. Hard-coded: faces cannot be moved, resized, or renamed. Each face shows the cue under the playhead: the video member's name, the text, the color fill, or dimmed when nothing is placed.
- **Playhead.** Manual only. Click a frame on the ruler or use previous/next. The score has 30 frames and ten region rows in face order. No play, loop, tempo, or labels.
- **Drop.** Drag a chip onto a face to create a span on that region's row starting at the playhead frame. Drag a chip onto a timeline row to create a span at the frame under the pointer. Dropping a new chip where a span already starts replaces it. Drag a span, or the content on a stage face, to move it to another frame or layer. Dropping a span on a frame that already starts one swaps the two. A region keeps showing a member until another span starts on that row (the hold rule). The timeline draws the span as a bar with a dashed hold tail running to the next span.
- Sound members can be added but not dropped on a face; audio lanes come later.
- `show.json` holds `cast`, `score.regions[].spans` (`memberId`, `start`, `length`), and `playhead`.

## Phase 2

Resize, select, and delete spans. Clear spans. Soundtrack and Ambient lanes. Labels and jump by label. Add frames. Transport: play, stop, loop, tempo. Folder import for the cast.

## Phase 3

Trigger cards and mapping cards. Inputs, zones, and states. Zones on the stage floor and a visitor marker for walk-through preview. Try preview. Step spans (`previous + 1`).

## Phase 4

Cue compiler and the `cues` table in `show.json`, plus `inputs`, `zones`, `states`, and `actions` in the shape TouchDesigner reads. Then the live link to the room.









# Timeline

A playhead with a frame-by-frame increment. The playhead can be sent to other frames by number or by label.

A timeline that moves friend by frame through layers, each frame on each layer contains an action in some cases the frame might just can be the proof the result of the previous action frame previous frames, action or discontinued. In other cases there might be a change made in the from the previous frame by running a simple script like 1+ one previous frame +1.

The layers represent the regions where media can be played on the stage. The content of the region is applied by dragging a cast member to the layer. Changing the cast member during playback occurs when the playhead leaves a frame with one cast member and enters a frame with another new one on the same layer.


# Interactions

An interaction occurs when an object is combined with a trigger and results in one or more responses.

Complex interactions:
* Have more than one response in an interaction.
* Assign different layers to triggers and responses in a single interaction.
* Control the duration and delay of each response.
* Control layers dynamically using formulas.
* Create interactions across multiple screens and devices


# Cast

A container for the assets to be displayed on the stage.

This is an index or library of the paths to media items and other content. The members are most likely video and sound files that will be played on the stage.


# Stage

The stage is a preview of the actions taken and stage state of the immersive room. It can be a live state. It can also be a preview for working off-site.


# Actions

Logic Cards are the core elements of the logic followed in an interaction. You can create a program by adding and configuring cards. 

trigger cards - logic based on an events. The is a "When-then" relationship. A trigger is an event that triggers a response or action. Triggers have properties.

mapping cards - defined relationship between components. Relationships can be linear.


# Database

Explain the relationship between a table and the coordination of multiple projections from a timeline

A simple table with a name, a path, and the name of the region the file is meant to play. At any point in time there will be 10 regions that could be showing video, disabled, showing text, or displaying a solid color. At any point in time sound can be playing. Sound could be connected to an interaction or an event. The sound could also be the soundtrack of the currently video. Sounds can be ambient as well. 
