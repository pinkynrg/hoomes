# 🏡 Hoomes: Your Gateway to Italian Real Estate 🏡

Welcome to **Hoomes**, the ultimate tool for scraping and searching homes for sale in Italy! Whether you're dreaming of a cozy Tuscan villa, a chic Milanese apartment, or a seaside retreat in Sicily, Hoomes has you covered. Currently, it supports scraping data from [Idealista](https://www.idealista.it/) and [Caaasa.it](https://www.caaasa.it/), with plans to extend to other leading real estate platforms. 

## 🌟 What Hoomes Does

Hoomes pulls listings from popular Italian real estate platforms and allows you to perform powerful full-text searches across the descriptions of each scraped property. Imagine being able to search for keywords like "panoramic view," "garden," or "historical center" across thousands of listings in seconds!

## 🚀 Getting Started

### Clone the Repository

```bash
git clone https://github.com/yourusername/hoomes.git
cd hoomes
```

### Bootstrap Your Development Environment

We've made setting up Hoomes a breeze with Docker. Just follow these simple steps:

1. **Build the Docker image**  
   ```bash
   docker compose -f docker-compose.development.yml build
   ```

2. **Start the container**  
   ```bash
   docker compose -f docker-compose.development.yml up -d
   ```
   
## 🛠️ Future Enhancements

Hoomes is designed with scalability in mind. We aim to integrate additional real estate platforms, making it easier than ever to find your dream home in Italy. Stay tuned for updates and new features!

## 🤝 Contributing

We welcome contributions! If you'd like to add a new feature, fix a bug, or improve the documentation, feel free to open a pull request. Let's build something amazing together.

## 📜 License

Hoomes is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
