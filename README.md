**The University of Melbourne**

# INFO30005 – Web Information Technologies

This doesn't grant you permission to use this work. Please do your own work to maintain academic integrity.

# Group Project Repository



## Table of contents

- [INFO30005 – Web Information Technologies](#info30005--web-information-technologies)
- [Group Project Repository](#group-project-repository)
  - [Table of contents](#table-of-contents)
  - [Team Members](#team-members)
  - [General info](#general-info)
  - [Postman requests](#postman-requests)
  - [Database Access](#access-details-to-database)
  - [.env File](#env-file)
  - [Testing](#testing)

## Team Members

| Name |
| :---         |    
| Hoang Ai Nhi Pham  | 
| Yung Ching Lin     | 
| Alexander Leris    | 
| Daniel Fink        | 
| Daniel Yotov       | 

## General info

This project contains the backend server for a snack business, that manages customer orders, accounts, and snack vendor interactions.

Live websites:

- [Frontend](https://snack-in-a-van-frontend.herokuapp.com/)

- [Backend](https://snacks-in-a-van-info30005.herokuapp.com/)

## Postman requests

For full routing documentation, refer to [this link](https://docs.google.com/document/d/1z7ycQcgdZbMaee9KHKcF9k2OtX8CSuRebNazsGc8Mcs/edit).

## Testing

This project supports both unit and integration testing, using the Mocha and Chai libraries. All tests are run using a local MongoDB instance so as to not affect the production database. Instead we support both unit and integration testing by seting up a mock database server. Simply run `npm test` to run the testing suite. The following functionality is currently tested:
- Vendor Signup
- Vendor Retrival by ID
- Vendor Status Update
