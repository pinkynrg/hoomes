# Real Estate Website with Idealista Scraper

This project combines a web-based real estate platform with a Python web scraper for Idealista, enabling users to search and browse real estate listings. The project includes a React-based front-end website, a Flask-based back-end API, and a Python web scraper to collect real estate data from [Idealista](https://www.idealista.it/).

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [State Management](#state-management)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Front-end Website**:
  - Search for real estate listings by various criteria (e.g., location, price, size).
  - Browse detailed property listings with images, descriptions, and contact information.
  - User-friendly and responsive design for desktop and mobile devices.

- **Back-end API**:
  - Provides endpoints for the front-end to search, retrieve, and display real estate listings.
  - Manages user interactions and data requests.
  - Communicates with the Python scraper to collect and store real estate data.

- **Python Scraper**:
  - Fetches house listings from Idealista based on various filtering criteria.
  - Extracts and stores data such as price, location, comments, and more for each house listing.
  - Supports concurrent execution for faster data retrieval.
  - Resumable - saves and loads the script's state to continue scraping from where it left off.

## Prerequisites

- **Front-end Website**:
  - Node.js and npm (Node Package Manager) for building and running the React application.
  - Required Node.js packages are listed in the `frontend/package.json` file.

- **Back-end API**:
  - Python 3.6 or higher.
  - Required Python libraries are listed in `backend/requirements.txt` and can be installed using `pip`.

- **Database**:
  - A database system (e.g., SQLite, PostgreSQL) for storing scraped data.

## Getting Started

1. Clone this repository to your local machine:

    ```bash
    git clone https://github.com/your-username/real-estate-website.git
    cd real-estate-website
    ```

2. Set up and run the front-end website. Navigate to the `frontend` directory and follow the instructions in the `README.md` file.

3. Set up and run the back-end API. Navigate to the `backend` directory and follow the instructions in the `README.md` file.

4. Configure and run the Python scraper by following the instructions in the `README.md` file in the `scraper` directory.

5. Start using the real estate website to search and browse listings.

## Usage

You can use this real estate website to search and browse property listings. The website communicates with the back-end API to retrieve and display data, and the back-end manages user interactions and data requests. Additionally, the Python scraper collects and stores real estate data from Idealista to keep the listings up to date.

## Project Structure

The project is structured as follows:

- `frontend`: Contains the React-based front-end website.
- `backend`: Contains the Flask-based back-end API.
- `scraper`: Contains the Python web scraper for Idealista.

## Configuration

You can configure each part of the project by following the instructions in their respective README files:

- Front-end Website Configuration: `frontend/README.md`
- Back-end API Configuration: `backend/README.md`
- Python Scraper Configuration: `scraper/README.md`

## State Management

The Python scraper is designed to be resumable. It saves its state to a file (`script_state.pkl`) when exiting and loads the state when starting. This allows you to stop and resume the scraping process without starting from scratch.

## Contributing

Contributions are welcome! If you would like to contribute to this project, please open an issue or submit a pull request. For major changes, please discuss your ideas in an issue before making changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.