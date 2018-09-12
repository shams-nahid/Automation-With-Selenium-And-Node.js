npm init

npm i chai@4.1.2 chai-as-promised@7.1.1 chromedriver@2.41.0 faker@4.1.0 mocha@5.2.0 mochawesome@3.0.3 selenium-webdriver@4.0.0-alpha.1 --save-dev --unsafe-perm=true --allow-root

mocha test script: mocha test --reporter mochawesome --reporter-options autoOpen=true

mkdir lib test utils

touch lib/basePage.js lib/homePage.js test/homePage.test.js utils/fakeDate.js utils/locator.js

create selector utils/locator.js:
    searchInputSelectorId: 'lst-ib',
    searchButtonSelectorName: 'btnK',
    resultConfirmationId: 'resultStats'
    
create and render fake data from fakeData.js

build up our generic helper methods in basePage.js
build up out test page healper mehod in HomePage.js
finally create test homePage for assertion