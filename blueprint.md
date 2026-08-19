# 🏡 Hoomes: Your Gateway to Italian Real Estate 🏡

Welcome to **Hoomes**, a tool for scraping and searching homes for sale in Italy. Hoomes gathers listings from [Caasa.it](https://www.caasa.it/) and makes them searchable by the words inside each description, giving you deeper insights than the standard filters. Whether you're browsing or searching for something specific, Hoomes provides the information you need to make informed decisions.

<p align="center">
  <img src="docs/media/hoomes-demo.gif" alt="Hoomes: pick a few comuni, wait for the scrape to finish, then search the descriptions and open a listing in the preview pane" width="720">
</p>

## 🌟 What Hoomes Does

Hoomes pulls listings from Caasa.it and allows you to perform powerful full-text searches across the descriptions of each scraped property. Imagine being able to search for keywords like "panoramic view," "garden," or "historical center" across thousands of listings in seconds!

You pick the comuni to cover — one at a time, or a whole province in a single click — and one scraping job runs per comune.

> **Note on sources:** an [Idealista](https://www.idealista.it/) scraper lives in `server/services/scraper.py` and is kept for reference, but it is not wired into the job runner: Idealista worked for a while and then stopped. Everything Hoomes shows today comes from Caasa.it.

When you make a request, Hoomes scrapes the data on-demand, so it may take a bit of time to fetch the initial data. However, once the data is retrieved, it’s saved into your browser's IndexedDB, enabling faster searches without the need to re-fetch data. This approach reduces server load and ensures a smoother experience. Additionally, a backend SQLite database is used to cache results, further optimizing performance and reducing delays in subsequent searches.

## 🚀 Getting Started

### Requirements

Make sure to install all the necessary dependencies:

- **Docker**: Required for containerization and easy environment setup.
- **Poetry**: A tool for managing Python dependencies and virtual environments.


### Clone the Repository

```bash
git clone https://github.com/pinkynrg/hoomes.git
cd hoomes
```

To install npm packages:

```bash
npm install
```

To install pip packages:

```bash
cd server && poetry install && cd ..
```

### Start the Project

To start the project, use the following command:

```bash
npm start
```

### Tuning the scraper

Caasa.it answers a burst of requests with `429 Too Many Requests`, so the
worker paces itself: requests to a host are spaced out process-wide, and a
refused page is retried with backoff (honouring `Retry-After`) before the
comune is reported as failed. A comune that is only partly scraped still saves
what it got, and the next attempt re-fetches only the listings that are
missing. Defaults are deliberately slow; raise them at your own risk.

| Variable | Default | What it does |
| --- | --- | --- |
| `SCRAPER_MIN_REQUEST_INTERVAL` | `1.5` | Seconds between two requests to the same host |
| `SCRAPER_REQUEST_JITTER` | `0.5` | Random extra delay added to that gap |
| `SCRAPER_MAX_WORKERS` | `2` | Listing pages fetched in parallel |
| `SCRAPER_PAGE_DELAY_SECONDS` | `1` | Pause between result pages |
| `SCRAPER_MAX_ATTEMPTS` | `4` | Attempts per page before giving up |
| `SCRAPER_THROTTLE_BACKOFF_SECONDS` | `10` | Base backoff after a 429 |
| `SCRAPER_BACKOFF_SECONDS` | `2` | Base backoff after other retryable errors |
| `SCRAPER_MAX_RETRY_SLEEP` | `60` | Cap on any single backoff |
| `SCRAPER_TIMEOUT_SECONDS` | `30` | Per-request timeout |

Scraping a whole province takes a while at these settings: that is the price of
not getting blocked halfway through.

## 🎬 The demo above

The gif at the top is generated, not recorded by hand:

```bash
npm run build
npm run demo
```

`demo/record.mjs` serves the production build, drives it with Playwright and
encodes the result into `docs/media/`: the gif above, plus an `.mp4` and a
poster frame for embedding it anywhere a 1.8&nbsp;MB gif would be rude. It
never touches Idealista or Caasa.it:
every `/v1` call is answered from `demo/fixtures`, so the recording is the same
every time, runs offline, and does not depend on two other people's markup
staying still. The listings and the photos in it are invented.

Requires `ffmpeg` and `gifsicle` on the path, plus a browser for Playwright
(`npx playwright install chromium`).

Change the tape and re-run it whenever the interface moves: a screenshot of an
interface that no longer exists is worse than no screenshot.

## 📝 Editing this README

`README.md` is generated. Edit `blueprint.md` and run:

```bash
npm run readme
```

## 🛠️ Future Enhancements

We aim to bring the Idealista scraper back to life and integrate additional real estate platforms, making it easier than ever to find your dream home in Italy. Stay tuned for updates and new features!

## 🤝 Contributing

We welcome contributions! If you'd like to add a new feature, fix a bug, or improve the documentation, feel free to open a pull request. Let's build something amazing together.

## 📜 License

Hoomes is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
