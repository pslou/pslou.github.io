# Blog migration and publishing checklist

The blog is now part of `pslou.github.io`. The local import preserves five posts,
six photos, the welcome text, and the historical post, archive, image and feed URLs.
The main site's `random` navigation link opens `/blog/`.

No commit, push, pull, clone, GitHub setting change, or repository deletion was
performed. The steps below separate the completed local work from the remaining
publishing work.

## 1. Review the local result

From this repository:

```sh
bundle exec jekyll build --destination /private/tmp/pslou-blog-preview --disable-disk-cache
python3 tools/check-blog.py --site /private/tmp/pslou-blog-preview
bundle exec jekyll serve --host 127.0.0.1 --port 4000
```

Open <http://127.0.0.1:4000/blog/>. Check the index, archive, an ordinary post,
the photo post, the theme toggle, and a narrow/mobile window.
Automated checks cover source fidelity, image hashes, historical routes, redirects,
visible dates, local links, both Atom feeds, and the sitemap.
The index was reviewed in desktop dark-mode screenshots supplied by the user.
That review identified the heading-font mismatch, which is now corrected to use
the same serif title style as the other pages. Refresh the preview to check that
update. The photo post, light mode and mobile view still need a visual check;
this session lacks computer-control permission.

## 2. Back up the old repository before considering deletion

The source and publishing snapshots were downloaded over public HTTPS, without
GitHub authentication. Temporary ZIPs are at:

- `/private/tmp/pslou-blog-gh-pages-20261019.zip`
- `/private/tmp/pslou-blog-master-20261019.zip`

Those ZIPs contain snapshots, not Git history, and `/private/tmp` is not a durable
backup. To preserve all Git branches/tags/history, run these commands from a
backup directory outside this website repository:

```sh
git clone --mirror https://github.com/pslou/blog.git blog-backup.git
git -C blog-backup.git bundle create ../blog-backup.bundle --all
git -C blog-backup.git bundle verify ../blog-backup.bundle
```

Keep the bundle somewhere durable. A Git backup does not preserve GitHub-specific
metadata such as issues or release attachments; save those separately if needed.
[GitHub backup documentation](https://docs.github.com/en/repositories/archiving-a-github-repository/backing-up-a-repository).

## 3. Stage and commit only the migration

There was already unfinished notes/layout work in the working tree. The prepared
patch changes the two shared files without staging that unrelated work. It targets
the original `HEAD` (`87e1d8d`); if those files or the index have since changed,
review/regenerate the patch instead of forcing it to apply.

From the website repository, with no unrelated changes already staged:

```sh
git apply --cached --check tools/blog-shared-files.patch
git apply --cached tools/blog-shared-files.patch
git add -- \
  _posts/2017-05-20-bike-levers.markdown \
  _posts/2017-05-21-bike-work.markdown \
  _posts/2017-05-25-biketastrophe.markdown \
  _posts/2017-05-27-lunch.markdown \
  _posts/2019-03-10-oatmeal.markdown \
  _layouts/blog_post.html _layouts/blog_redirect.html \
  _includes/blog-post-list.html _includes/blog-feed.xml \
  assets/css/blog.css blog/ \
  tools/BLOG_MIGRATION.md tools/blog-migration-manifest.json \
  tools/check-blog.py tools/blog-shared-files.patch
git diff --cached --stat
git diff --cached
```

The shared-file patch adds the blog settings, canonical site URL, blog stylesheet,
feed discovery, navigation link, and the `tools` build exclusion. It does not
include unfinished note layouts, note assets, or changes to `main.css`.
Imported post bodies retain their original bytes, including a few trailing spaces.

After reviewing the staged changes:

```sh
git commit -m "Integrate personal blog into main website"
git push
```

Confirm the main repository's Pages build/deployment succeeds. The separate blog
may still serve `/blog/` until its own Pages source is disabled.

## 4. Disable Pages on the old blog repository

In **pslou/blog**, open **Settings → Pages → Build and deployment**:

1. Set **Source** to **Deploy from a branch**, if necessary.
2. Set **Branch** to **None**.
3. Click **Save**.

Do this only after the main website deployment has succeeded. Leave the main
repository's Pages and custom-domain settings in place; no DNS change is needed
for this migration. Do not rely only on “Unpublish site,” since a later deployment
can make it available again. If an old external deployment job is still active,
retire that job too (the old source contains a Travis configuration).
[Disable a Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/deleting-a-github-pages-site),
[unpublishing behavior](https://docs.github.com/en/pages/getting-started-with-github-pages/unpublishing-a-github-pages-site).

## 5. Verify the public cutover

Check that <https://paullou.me/blog/> shows the integrated layout. Then check the
archive and all five old post URLs:

- <https://paullou.me/blog/archive/>
- <https://paullou.me/blog/thoughts/2019/03/10/oatmeal/>
- <https://paullou.me/blog/seattle/2017/05/27/lunch/>
- <https://paullou.me/blog/seattle/2017/05/26/biketastrophe/>
- <https://paullou.me/blog/seattle/2017/05/22/bike-work/>
- <https://paullou.me/blog/seattle/2017/05/19/bike-levers/>

Check all six photos in “finished bike,” `/blog/atom.xml`, `/blog/feed.xml`, and
the `/blog/index/` and `/blog/page2/` through `/blog/page5/` redirects. Verify the
main home and notes pages still work. Codex can perform public HTTP checks after
you confirm the deployment and old Pages source change.

GitHub documents inherited custom-domain project paths, but not routing precedence
or a guaranteed cutover time when two sites overlap at `/blog/`. Verify the new
layout and content, not merely an HTTP 200 response. If the new blog is unavailable,
keep the old repository and use its previous Pages source to roll back while
investigating.
[Custom-domain project routing](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages#using-a-custom-domain-across-multiple-repositories).

## 6. Archive or delete the deprecated repository

Once the public checks pass and the backup is verified, the main website no longer
needs `pslou/blog`. Choose either action in the old repository's
**Settings → General → Danger Zone**:

- **Archive this repository** keeps its history online and can be reversed.
- **Delete this repository** removes it; use this only after the above steps.

Deletion is optional and must be done by you. The source-repository link in the
migration manifest is provenance only; the website does not fetch anything from it.
[Archive instructions](https://docs.github.com/en/repositories/archiving-a-github-repository/archiving-repositories),
[delete instructions](https://docs.github.com/en/repositories/creating-and-managing-repositories/deleting-a-repository).

## Import details and future posts

The manifest records the source branch (`gh-pages`, commit
`5113b17ae48c40f3a88cb9f71d74dda43de4e6b7`) and publishing branch (`master`, commit
`d495c17eb729facb97a73cd6920de2e127603dee`). Explicit permalinks and display dates
preserve the published URLs/calendar dates independently of the build machine's
timezone; original timestamps remain in the feeds.

At the user's request, displayed JPEGs were subsequently optimized to a maximum
width of 1200 pixels, preserving their proportions, and below 300,000 bytes each.
The original copies are archived under `tools/image-backups/`, which is ignored
by Git and excluded from the site build. The manifest retains the original blog
snapshot hashes in `sha256` and records optimized hashes, sizes, and dimensions
separately; the image checks verify the optimized copies when those records exist.

Both old feeds had malformed, scheme-less identifiers. The new feeds keep both
addresses and use valid HTTPS links/IDs; existing subscribers may see the repaired
entries as new once. Legacy styles/icons remain at their old paths for cached
pages, but the integrated blog uses the main site's design.

For a new post, create `_posts/YYYY-MM-DD-slug.md` with a title, date, and optional
categories. The blog layout and `/blog/.../` URL are defaults. Use a quoted
`display_date: "YYYY-MM-DD"` when you want to pin the displayed calendar day, and
put new images under `blog/images/`. Keep any explicit permalink stable after
publication. Technical notes continue to live separately in `_notes/`.
