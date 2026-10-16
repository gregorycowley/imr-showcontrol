# Show Control: User Guide

Show Control is a tool for designing an experience for the immersive room without opening TouchDesigner. You collect your media as a **cast**, place it on the room's projection surfaces from a **stage** view, and step through the show one frame at a time on a **timeline**.

If you have used Macromedia Director, the ideas are the same: cast members, a score, a stage, and a playhead. If you have not, the sections below explain each part.

This guide covers Phase 1. Later phases add timeline editing, sound lanes, playback, and interaction cards. See `SPECS.md` for the phase list.

## Starting the app

1. Install dependencies once: `npm install`
2. Copy `.env.example` to `.env`. The defaults work for one machine; edit it to change the address, port, or where the show file is kept. `.env` is private to your machine and is never committed.
3. Start the app: `npm run dev`
4. Open `http://127.0.0.1:5173/` in a browser.

The app keeps a working copy in `show.json` and writes it as you edit. In the Actions panel, **Save** downloads a copy of that file, and **Load** opens a show you saved earlier. Loading a file replaces the show on screen, then the working copy updates to match. If a save fails, a message appears at the bottom of the Actions panel.

### Download the app

Releases are built on GitHub. Open the latest release at `https://github.com/gregorycowley/imr-showcontrol/releases`, download the Mac zip or the Windows installer, and follow the notes on that page. The downloaded app includes the interface. Your show is saved on your computer. The first open on a Mac says the app is damaged. It is not. After moving it to Applications, run `xattr -cr "/Applications/Show Control.app"` in Terminal, then open it again. Right-click → Open does not clear that dialog. A double-click with no extra step needs an Apple Developer ID signature, which this build does not have.

### Using the Show Control app instead of a browser

There is also a small desktop app, the **shell**, that opens the interface in its own window with no browser tabs or address bar. It downloads the interface from the server each time it loads, so when the interface is updated on the server, the app shows the new version after a reload (⌘R). Nothing has to be reinstalled.

- Run it from the project root with `npm run shell` (first time: `npm run shell:install`).
- If the server is not running yet, the app shows a waiting screen and connects as soon as the server starts.
- To use a server on another machine, choose **Server > Change Server Address…** (⌘L) and enter its address, for example `http://192.168.1.20:5173/`. The machine running the server must start it with `npm run dev:lan`.
- For the room machine, `npm run start:kiosk` in the `shell` folder opens full screen with no window frame.

See `shell/README.md` for packaging the app and the full menu.

## The screen

The window has three panels.

| Panel | Where | What it does |
|---|---|---|
| **Stage** | Top | A drawing of the room with ten numbered projection surfaces. Shows what each surface displays at the current frame. The **Cast** sits to the right of the drawing. |
| **Timeline** | Bottom left | The score. Frames run left to right (1 to 30). Ten rows, one per projection surface. The playhead marks the current frame. |
| **Actions** | Bottom right | Reserved for trigger and mapping cards in a later phase. |

The three panels always stay in the same place. The whole layout scales to fit your window.

## The Stage

The room drawing shows ten **regions**, the surfaces a projector can fill:

| Region | Surface |
|---|---|
| 1 | Right wall, upper |
| 2 | Right wall, lower |
| 3 | Back wall, lower right |
| 4 | Back wall, lower left |
| 5 | Back wall, lower center |
| 6 | Back wall, upper right |
| 7 | Back wall, upper center |
| 8 | Back wall, upper left |
| 9 | Left wall, lower |
| 10 | Left wall, upper |

The regions are fixed. You cannot move, resize, or rename them; they match the real room.

Each region shows what it is displaying at the frame under the playhead:

- **Grey with a number only**: nothing is placed. The projector for that surface is off.
- **A name**: a video member is playing. The name is the cast member's name.
- **Text**: a text member is showing. Long text is shortened on the drawing.
- **A solid color**: a color member is showing.

The stage is a preview. It shows names, text, and colors so you can plan off-site; it does not play the actual video files.

## The Cast

The Cast is your library of things that can appear in the room. It sits to the right of the room drawing. Each entry is a **cast member**, shown as a chip with a number, a kind mark, and a name, in a grid of three columns.

### Kinds of cast member

| Kind | Mark | What you enter | Where it can go |
|---|---|---|---|
| Video | `VID` | A path to the video file, such as `media/ocean.mp4` | Any region |
| Text | `TXT` | The text to display | Any region |
| Color | a swatch | A color from the picker | Any region |
| Sound | `SND` | A path to the audio file | Not on a region yet (sound lanes come in Phase 2) |

Paths are stored as you type them. Use paths relative to your media folder so the same show works on the room machine.

### Adding a member

1. Click **Add member** in the Cast strip.
2. Enter a **Name**. This is what appears on the stage and in the timeline, so keep it short.
3. Choose a **Kind**.
4. Fill in the field for that kind: a **Path** for video and sound, the **Text** for text, or pick a **Color**.
5. Click **Add**. Click **Cancel** to close the form without adding.

The new chip appears at the end of the grid with the next member number. If the grid fills the panel, it scrolls.

### Removing a member

Click the **×** on a chip. The member is removed from the cast, and anything it was doing on the timeline is removed as well.

### What the chip tells you

- The **number** is the member's place in the cast. Numbers keep counting up and are not reused.
- Hover a chip to see its path or text.
- A sound chip has a dashed border. It is in the cast but cannot be dragged onto a region yet.

## The Timeline

The timeline is a grid. Columns are **frames**, numbered 1 to 30 along the top. Rows are the ten **regions**, numbered down the left in the same order as the stage.

A **frame** is one step of the show. It is not a fixed length of time yet; think of it as a cue number. Later phases add a tempo and playback.

### Moving the playhead

The **playhead** is the shaded column with a dark left edge. It marks the current frame. The frame readout in the top right of the panel shows its number.

To move it:

- Click any frame number on the ruler along the top.
- Click **◀** or **▶** to step one frame back or forward.

Whenever the playhead moves, the stage updates to show that frame.

The playhead position is saved with the show, so reopening the app returns to the same frame.

### Reading the rows

When you place a cast member on a region, a **span** appears on that region's row:

- The **solid bar** marks the frame where the member starts.
- The **dashed tail** behind it shows how long the member stays on that surface: until the next span on the same row, or to the end of the timeline.

The member's name is written on the span. For a color member, the bar is filled with that color.

Drop a chip on a timeline row to place it on that region at the frame under the pointer. The cell under the pointer darkens while you drag.

Drag a span, or the content showing on a stage face, to move it. Drop it on another frame or another layer. If that frame already starts a span, the two swap. You cannot resize or delete a span yet. Remove a span by removing its cast member.

## Placing a cast member on a region

This is the core workflow.

1. Move the playhead to the frame where you want the change to happen.
2. Drag a chip from the Cast strip.
   While you drag, every region on the stage gets a dashed outline to show it can accept the drop. The region under your pointer gets a thicker outline.
3. Drop the chip on a region, or on that region's row in the timeline. A drop on the timeline uses the frame under the pointer. A drop on the stage uses the playhead.

Three things happen at once:

- The region shows the member (its name, text, or color).
- A span appears on that region's row in the timeline, starting at the playhead frame.
- The show is saved.

To change a region at a later point in the show, move the playhead forward and drop another member on the same region. To change it at the same frame, drop a different member on the region while the playhead is still there; the new member replaces the old one at that frame.

Sound chips cannot be dropped on a region. Nothing happens if you try.

## The hold rule

A region keeps doing whatever it was last told to do until it is told something new.

If you drop "Ocean" on region 3 at frame 1 and "Welcome" on region 3 at frame 8:

- Frames 1 to 7 show Ocean on region 3.
- Frame 8 onward shows Welcome.
- Nothing needs to be placed on frames 2 to 7; the hold does that.

This is how the dashed tails in the timeline are drawn, and it is how the real room will behave: a cut happens when the playhead leaves a frame with one member and enters a frame with another on the same region.

There is no "turn off" member yet. Until Phase 2 adds clear spans, a region that has been given a member stays on through the end of the timeline.

## A worked example

Suppose a visitor walks in to a calm scene, then a title appears.

1. Click **Add member**, name it `Ocean`, kind **Video**, path `media/ocean.mp4`, click **Add**.
2. Click **Add member**, name it `Title`, kind **Text**, text `Welcome to the room`, click **Add**.
3. Click **Add member**, name it `Night`, kind **Color**, pick a deep blue, click **Add**.
4. With the playhead on frame 1, drag `Night` onto regions 9 (left wall, lower) and 10 (left wall, upper).
5. Still on frame 1, drag `Ocean` onto regions 3, 4, 5, and 6 (the lower back wall and the upper-right back face).
6. Click frame **10** on the ruler.
7. Drag `Title` onto region 4.
8. Step back and forth with **◀** and **▶** and watch the stage: those back-wall regions show Ocean from frame 1, the left wall is blue throughout, and region 4 switches to the title at frame 10.

## The show file

**Save** downloads `show.json`, the same shape the app keeps as its working copy. **Load** reads a file in that shape and replaces the open show. If the open show already has cast members or spans, Load asks before replacing it. A file that is not a show is left unloaded and an error appears in the Actions panel.

You do not need to edit the file, but it is readable if you want to check it:

```json
{
  "cast": [
    { "id": "…", "number": 1, "name": "Ocean", "kind": "video", "path": "media/ocean.mp4" }
  ],
  "score": {
    "regions": [
      { "region": 1, "spans": [] },
      { "region": 3, "spans": [{ "id": "…", "memberId": "…", "start": 1, "length": 1 }] }
    ]
  },
  "playhead": 1
}
```

- `cast` is the list of members.
- `score.regions` has one entry per region; each `span` points at a member and the frame where it starts.
- `playhead` is the current frame.

To start a fresh show, delete the members from the cast. To keep a version, click **Save** and store that file. Click **Load** later to open it again.

## Tips

- Name members for what they are on the wall, not the filename: `Ocean`, not `final_v3_export.mp4`. Names are what you see on the stage.
- Place the opening state on frame 1 so every region you care about has something from the start.
- Use the frame ruler to jump, and the arrows to check cuts one frame at a time.
- Hover a span or a chip to see details that do not fit on screen.

## Not in this phase

These are planned but not available yet:

- Resizing or deleting a span without removing its cast member.
- A "clear" span to turn a region off.
- Sound lanes (soundtrack and ambient), labels, tempo, play, and loop.
- Importing a whole folder into the cast.
- Trigger and mapping cards in the Actions panel; room inputs, zones, and states.
- Sending the show to TouchDesigner.
