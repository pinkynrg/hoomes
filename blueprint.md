# 🏡 Hoomes: Your Gateway to Italian Real Estate 🏡

Welcome to **Hoomes**, a tool for scraping and searching homes for sale in Italy. Hoomes helps users find properties by gathering data from leading real estate platforms like [Idealista](https://www.idealista.it/) and [Caaasa.it](https://www.caasa.it/). What sets Hoomes apart is its ability to search within property comments, giving you deeper insights into listings. Whether you're browsing or searching for something specific, Hoomes provides the information you need to make informed decisions.

![demo](https://github.com/pinkynrg/Hoomes/blob/main/demo.gif)

## 🌟 What Hoomes Does

Hoomes pulls listings from popular Italian real estate platforms and allows you to perform powerful full-text searches across the descriptions of each scraped property. Imagine being able to search for keywords like "panoramic view," "garden," or "historical center" across thousands of listings in seconds!

When you make a request, Hoomes scrapes the data on-demand, so it may take a bit of time to fetch the initial data. However, once the data is retrieved, it’s saved into your browser's IndexedDB, enabling faster searches without the need to re-fetch data. This approach reduces server load and ensures a smoother experience. Additionally, a backend SQLite database is used to cache results, further optimizing performance and reducing delays in subsequent searches.

## 🚀 Getting Started

### Requirments

Make sure to install all the necessary dependencies:

- **Docker**: Required for containerization and easy environment setup.
- **Poetry**: A tool for managing Python dependencies and virtual environments.


### Clone the Repository

```bash
git clone https://github.com/yourusername/hoomes.git
cd hoomes
```

To install npm packages:

```bash
npm install
```

To install pip packages:

```bash
cd server && poetry install && cd..
```

### Start the Project

To start the project, use the following command:

```bash
npm start
```

## 🛠️ Future Enhancements

We aim to integrate additional real estate platforms, making it easier than ever to find your dream home in Italy. Stay tuned for updates and new features!

## 🤝 Contributing

We welcome contributions! If you'd like to add a new feature, fix a bug, or improve the documentation, feel free to open a pull request. Let's build something amazing together.

## 📜 License

Hoomes is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
