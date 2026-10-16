# TouchDesigner Show Control

TouchDesigner reads the show from `show.json` in a project folder on this machine. That folder is also where the video, audio, and other asset files live. Paths inside the JSON, such as `media/ocean.mp4`, are relative to that folder.

While you are authoring in this repo, the folder is the project root (the directory that contains `show.json`). The downloaded Show Control app keeps its working copy somewhere else: on macOS that is `~/Library/Application Support/Show Control/`. Point TouchDesigner at whichever folder actually holds the file you want to play.

## Build the reader

These steps make a `.toe` that loads `show.json` from a folder you type in, parses it, and reloads when Show Control saves the file.

### 1. Save a new project

1. Open TouchDesigner and choose **File → New**.
2. Choose **File → Save** and save the project as `showcontrol.toe`. Put it somewhere outside the project folder if you like. The `.toe` does not have to sit next to `show.json`. The folder parameter in the next step is what locates the file.

### 2. Add a component with a folder parameter

1. In the network, press Tab and add a **Base COMP**. Name it `show`.
2. Select `show`. Right-click it and choose **Customize Component**.
3. Add a page named `Show`.
4. Add a **Folder** parameter on that page.
   - Label: `Project Folder`
   - Name: `Projectfolder`
5. Close the editor. On `show`, set **Project Folder** to the folder that contains `show.json`. Do not include `show.json` itself, and do not add a trailing slash.

   Example, if the file is the one in this repo:

   `/Users/you/gc-gcp-imr-showcontrol`

### 3. Read the file from that folder

1. Go inside `show`.
2. Add a **Text DAT** and name it `show_json`.
3. On its **File** page, click the name **File** and switch that parameter to **Expression**. Paste:

   ```python
   parent().par.Projectfolder.eval() + '/show.json'
   ```

4. Turn **Load on Start** on.
5. Turn **Sync to File** on. TouchDesigner then reloads the DAT whenever Show Control writes `show.json`.
6. Turn **Write on Toe Save** off.

`show_json` should fill with the JSON text. If it is empty, the folder parameter does not point at a directory that contains `show.json`.

Sync to File also writes this DAT back to disk if you type in it. Do not edit `show_json`. Treat it as a view of the file.

### 4. Parse the JSON

1. Add a **JSON DAT** and name it `show_data`.
2. Connect the output of `show_json` to the input of `show_data`.
3. Leave **Filter** empty. **Output** can stay on **Filter Result**.

`show_data` parses the text from the file. The whole show is a Python dictionary on that operator:

```python
op('/project1/show/show_data').source
```

Adjust `/project1` if your root component has another name. From inside `show` you can use `op('show_data').source`.

### 5. Confirm it loaded

1. Open the textport with Alt+T (Option+T on macOS).
2. Run:

   ```python
   show = op('/project1/show/show_data').source
   print(show['playhead'])
   print(len(show['cast']))
   print(show['cast'][0]['name'], show['cast'][0]['path'])
   ```

You should see the playhead, the number of cast members, and the first member's name and path. If this raises `KeyError` or the JSON DAT is in error, the file did not parse. Click `show_json` and confirm the text is the same JSON Show Control saved.

### 6. Lay the cast out as a table

1. Add a second **JSON DAT** named `cast_table`.
2. Connect `show_json` into it as well.
3. Set **Filter** to:

   ```text
   $.cast
   ```

4. Set **Output Format** to **Table**.

Each cast member becomes a row. Columns are the fields on that member: `id`, `number`, `name`, `kind`, and `path` or `value`.

A video or sound path on disk is the project folder plus that relative path:

```python
folder = op('/project1/show').par.Projectfolder.eval()
member = op('/project1/show/show_data').source['cast'][0]
movie = folder + '/' + member['path']
```

Put `movie` in a Movie File In TOP's **File** parameter (set that parameter to Expression) when you are ready to play a cast member. Color members store a hex color in `value` instead of a path. Text members store the words to display in `value`.

## What is in the file

```json
{
  "cast": [
    { "id": "…", "number": 1, "name": "Ocean", "kind": "video", "path": "media/ocean.mp4" }
  ],
  "score": {
    "regions": [
      { "region": 3, "spans": [{ "id": "…", "memberId": "…", "start": 1, "length": 1 }] }
    ]
  },
  "playhead": 1
}
```

- `cast` is the library of media, text, and colors.
- `score.regions` has one entry for each of the ten surfaces. A `span` is that member starting at `start` (a frame from 1 to 30). The member stays on that surface until the next span on the same region.
- `playhead` is the frame Show Control was on when it saved.

`op('show_data').source['score']['regions']` is the list of ten regions. `op('show_data').source['playhead']` is the saved frame.
