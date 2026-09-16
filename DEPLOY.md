# Deploy srakaj.com

## Recommended setup

Keep the domain registered with Squarespace, but host the static site elsewhere.

### Option 1: GitHub Pages

1. Create a GitHub repository, for example `srakaj-portfolio`.
2. Upload the complete contents of this folder.
3. In GitHub, open:
   `Settings → Pages`
4. Under **Build and deployment**, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. GitHub will create a temporary `github.io` URL.

### Connect srakaj.com

In the GitHub Pages settings, add your custom domain:

`srakaj.com`

GitHub will show the DNS records it expects.

Then open the DNS settings for the domain in Squarespace and add the records GitHub provides.

Important:
- Do not transfer the domain.
- Only change the DNS records required for the website.
- If you use Squarespace email or another email provider, do not delete MX records.

After DNS propagation, enable **Enforce HTTPS** in GitHub Pages.

## Option 2: Cloudflare Pages

Cloudflare Pages is also an excellent host and provides preview deployments.

Typical flow:

1. Put this site in GitHub.
2. Create a Cloudflare Pages project from the repository.
3. There is no build command for this site.
4. Set the output directory to the repository root.
5. Add `srakaj.com` as a custom domain.
6. Follow Cloudflare's DNS instructions.

## Updating the site

Once deployed:

1. edit files locally or in GitHub;
2. commit changes;
3. push to `main`.

The public site updates automatically.

## Recommended next improvements

- Add real GitHub and LinkedIn links.
- Add downloadable English CV.
- Add screenshots using synthetic/demo data.
- Add a simple Open Graph preview image later.
- Add a fourth project once another tool is portfolio-ready.
