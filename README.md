# [Automated Testing With Node.js And Selenium Webdriver](https://medium.com/@bmshamsnahid/automated-testing-with-selenium-webdriver-and-node-js-f99f64720352)

Automated google search operation.

[Step By Step Tutorial](https://medium.com/@bmshamsnahid/automated-testing-with-selenium-webdriver-and-node-js-f99f64720352)

## Run application
Clone the repository

```bash
git clone https://github.com/bmshamsnahid/Automation-With-Selenium-And-Node.js.git
```

Install dependencies
```bash
npm i chai@4.1.2 chai-as-promised@7.1.1 chromedriver@2.41.0 faker@4.1.0 mocha@5.2.0 mochawesome@3.0.3 selenium-webdriver@4.0.0-alpha.1 --save-dev --unsafe-perm=true --allow-root
```

Run test
```bash
npm test
```

Folder Structure

    ├── ...
    │
    ├── lib                         # Helper methods
    │   ├── basePage.js             # Generic functionality for tests
    │   └── homePage.js             # Home page testing functionality
    │
    ├── test                        # Test suite
    │   └── homePage.test.js        # Testing in home page
    │
    ├── utils                       # Utility files for testing
    │   ├── fakeData.js             # Generating random keyword for searching
    │   └── locator.js              # HTML and CSS identifier for elements to test
    ├── ...

## License

MIT