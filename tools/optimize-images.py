#!/usr/bin/env python3
"""Resize website JPEGs proportionally, then export below a byte limit with sips.

Example: python3 tools/optimize-images.py assets/images/portfolio/new-photo.jpg
Only explicitly named files are processed. Originals and a report are backed up
under tools/image-backups/ (excluded from the site and ignored by Git).
No images are upscaled or cropped. Existing small images are left unchanged.
Requires Pillow to normalize image metadata and verify exported pixels.
"""

import argparse
from datetime import datetime, timezone
import hashlib
from io import BytesIO
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

from PIL import Image, ImageChops, ImageCms, ImageOps, ImageStat

ROOT = Path(__file__).resolve().parents[1]


def sips(*args):
    try:
        return subprocess.check_output(['/usr/bin/sips', *map(str, args)], text=True,
                                       stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as error:
        raise RuntimeError(error.output.strip()) from error


def dimensions(path):
    info = sips('-g', 'pixelWidth', '-g', 'pixelHeight', path)
    return tuple(int(re.search(rf'{key}:\s*(\d+)', info).group(1))
                 for key in ('pixelWidth', 'pixelHeight'))


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def visual_sample(image):
    """Compare visible pixels independently of macOS's image decoder."""
    sample = image.convert('RGBA').resize((64, 64), Image.Resampling.LANCZOS)
    background = Image.new('RGBA', sample.size, 'white')
    return Image.alpha_composite(background, sample).convert('RGB')


def verify_pixels(reference, target):
    with Image.open(target) as exported:
        exported.load()
        actual = visual_sample(exported)
    expected = visual_sample(reference)
    difference = ImageStat.Stat(ImageChops.difference(expected, actual)).mean
    lost_detail = (max(ImageStat.Stat(expected).stddev) > 5 and
                   max(ImageStat.Stat(actual).stddev) < 1)
    if lost_detail or max(difference) > 20:
        raise RuntimeError(f'{target}: export differs substantially from the original; '
                           'no website images were replaced')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('images', nargs='+', type=Path)
    parser.add_argument('--max-width', type=int, default=1200)
    parser.add_argument('--max-bytes', type=int, default=300000,
                        help='strict upper limit, in decimal bytes')
    args = parser.parse_args()
    if args.max_width < 1 or args.max_bytes < 1:
        parser.error('limits must be positive')
    paths = list(dict.fromkeys(p.resolve() for p in args.images))
    for path in paths:
        if not path.is_file() or ROOT not in path.parents:
            parser.error(f'not a website image within this repository: {path}')
        if path.suffix.lower() not in ('.jpg', '.jpeg', '.png'):
            parser.error(f'unsupported image format: {path}')

    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S.%fZ')
    backup = ROOT / 'tools/image-backups' / stamp
    backup.mkdir(parents=True)
    report = {'created_utc': stamp, 'max_width': args.max_width,
              'max_bytes_exclusive': args.max_bytes,
              'backup_directory': str(backup.relative_to(ROOT)), 'images': []}

    with tempfile.TemporaryDirectory(prefix='pslou-image-export-') as staging_dir:
        staging = Path(staging_dir)
        outputs = []
        for index, source in enumerate(paths):
            relative = source.relative_to(ROOT)
            with Image.open(source) as decoded:
                decoded.load()
                reference = ImageOps.exif_transpose(decoded)
            if reference.mode == 'CMYK':
                profile = reference.info.get('icc_profile')
                if profile:
                    reference = ImageCms.profileToProfile(
                        reference, ImageCms.ImageCmsProfile(BytesIO(profile)),
                        ImageCms.createProfile('sRGB'), outputMode='RGB')
                else:
                    reference = reference.convert('RGB')
            width, height = reference.size
            entry = {'path': str(relative), 'original_bytes': source.stat().st_size,
                     'original_width': width, 'original_height': height,
                     'original_sha256': sha256(source)}
            report['images'].append(entry)
            if width <= args.max_width and entry['original_bytes'] < args.max_bytes:
                entry.update(changed=False, bytes=entry['original_bytes'], width=width,
                             height=height, sha256=entry['original_sha256'], quality=None)
                print(f'Unchanged: {relative} ({entry["bytes"]:,} bytes)', flush=True)
                continue

            original = backup / relative
            original.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, original)
            assert sha256(original) == entry['original_sha256']

            # Decode the primary image independently, apply its orientation, and
            # discard auxiliary camera metadata before handing pixels to sips.
            # Some iPhone JPEG metadata makes sips silently export black pixels.
            normalized = staging / f'{index}-source.png'
            reference.save(normalized, format='PNG',
                           icc_profile=reference.info.get('icc_profile'), exif=b'')
            intermediate = normalized
            if width > args.max_width:
                intermediate = staging / f'{index}.tiff'
                sips('--resampleWidth', args.max_width, '-s', 'format', 'tiff',
                     '-s', 'formatOptions', 'lzw', normalized, '--out', intermediate)
            target = staging / f'{index}{source.suffix.lower()}'
            quality = None
            byte_limit = min(args.max_bytes, entry['original_bytes'])

            if source.suffix.lower() == '.png':
                sips('-s', 'format', 'png', intermediate, '--out', target)
                if target.stat().st_size >= byte_limit:
                    raise RuntimeError(f'{relative}: resized PNG is still too large; '
                                       'choose a format conversion explicitly')
            else:
                trial = staging / f'{index}-trial.jpg'
                low, high = 1, 100
                while low <= high:
                    candidate_quality = high if quality is None and high == 100 else (low + high) // 2
                    sips('-s', 'format', 'jpeg', '-s', 'formatOptions', candidate_quality,
                         intermediate, '--out', trial)
                    if trial.stat().st_size < byte_limit:
                        quality = candidate_quality
                        shutil.copyfile(trial, target)
                        low = candidate_quality + 1
                    else:
                        high = candidate_quality - 1
                if quality is None:
                    raise RuntimeError(f'{relative}: cannot meet the limit at this width')

            new_width, new_height = dimensions(target)
            assert new_width == min(width, args.max_width)
            assert abs(new_height - height * new_width / width) <= 1
            assert target.stat().st_size < args.max_bytes
            verify_pixels(reference, target)
            entry.update(changed=True, bytes=target.stat().st_size, width=new_width,
                         height=new_height, sha256=sha256(target), quality=quality)
            outputs.append((target, source))
            print(f'Prepared: {relative}: {entry["original_bytes"]:,} → '
                  f'{entry["bytes"]:,} bytes; {new_width}×{new_height}; quality={quality}',
                  flush=True)

        # Prepare the entire batch and its backups before replacing any source.
        (backup / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
        for target, source in outputs:
            shutil.copyfile(target, source)
        (ROOT / 'tools/image-optimization-report.json').write_text(
            json.dumps(report, indent=2) + '\n')

    before = sum(item['original_bytes'] for item in report['images'])
    after = sum(item['bytes'] for item in report['images'])
    print(f'Complete: {len(outputs)} images changed; {before:,} → {after:,} bytes.')
    print(f'Originals: {backup}')


if __name__ == '__main__':
    main()
