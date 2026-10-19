# Website tools

## Optimize images

[`optimize-images.py`](optimize-images.py) automates resizing and compressing
website images. It requires Python 3 and macOS's built-in `/usr/bin/sips`; no
extra Python packages are needed.

By default, it:

- Resizes images wider than **1200 pixels**, preserving proportions without
  cropping or enlarging them. Portrait images can remain taller than 1200 pixels.
- Adjusts JPEG export quality to fit **strictly below 300,000 bytes (300 KB)**,
  without making the file larger than its input.
- Leaves images unchanged when they already satisfy both limits.
- Backs up each image it changes, then replaces the website copy at the same path.

### Add a new image

1. Copy the original into an appropriate website folder, such as
   `assets/images/personal/` or `assets/images/portfolio/`.
2. From the repository root, run the command below, replacing `new-photo.jpg`
   with the actual filename:

   ```bash
   python3 tools/optimize-images.py assets/images/personal/new-photo.jpg
   ```

3. Add the image to the appropriate page if it is new, then preview its appearance
   before committing and pushing your website changes.

To reach the repository root on this computer:

```bash
cd /Users/plou/Documents/Coding/pslou.github.io
```

The script processes **only the files you name**. It does not scan the website or
decide whether an image is displayed. Choose displayed images explicitly and
leave archives such as `old_headshots/` out of the command. Input files must be
inside this repository; files in Downloads must be copied in first.

### Process several images

```bash
python3 tools/optimize-images.py \
  assets/images/personal/new-photo.jpg \
  assets/images/portfolio/new-drawing.jpg
```

Quote paths that contain spaces. Already optimized files are skipped when they
meet the selected limits.

### Change the limits

```bash
python3 tools/optimize-images.py \
  --max-width 1000 --max-bytes 250000 \
  assets/images/personal/new-photo.jpg
```

Run `python3 tools/optimize-images.py --help` to see the available options.

### Backups and reports

Originals for changed images are saved under
`tools/image-backups/<timestamp>/`, preserving their repository-relative paths.
The script prints the backup directory when it finishes. These backups are
ignored by Git, and `tools/` is excluded from the published website.

To restore an original, copy its file from that backup directory back to the
matching path in `assets/images/` or `blog/images/`. For a fresh export with
different settings, start from the original rather than an already compressed
copy.

`tools/image-optimization-report.json` contains the latest run's before/after
sizes, dimensions, JPEG quality settings, and checksums. Each successful run
also saves its own `report.json` inside the timestamped backup directory.

### Supported formats and failures

Supported extensions are `.jpg`, `.jpeg`, and `.png` (case-insensitive).
JPEGs are resized first, then compressed. Each quality trial starts from the
original or a lossless resized intermediate, avoiding repeated compression of
trial outputs.

PNGs are resized and exported as PNGs; JPEG-style quality adjustment does not
apply. If a PNG cannot meet the size requirement, the script stops and requires
an explicit format-conversion decision. It also stops if a JPEG cannot meet the
limit at the selected width. All images in a batch are prepared before any
website copies are replaced, so a preparation failure leaves them unchanged.

The script does not edit page HTML, commit changes, or publish the website.

## Other guides

- [Blog migration](BLOG_MIGRATION.md)
